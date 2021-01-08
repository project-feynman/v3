<template>
  <div>
    <portal to="left-side-panel-current-room">
      <div id="container-for-video-elements">

      </div>
    </portal> 

    <div id="container-for-audio-elements">

    </div>

    <portal to="current-room-participants">
      <template v-for="client in allClients">
        <v-row :key="client.id" 
          align="center"
          :class="['d-flex', `${client.sessionID === sessionID ? 'mt-3' : 'mt-1'}`, 'pl-5', 'pr-2', 'mr-0']"
        >
          <div 
            style="font-size: 0.9em;"
            :class="['ml-2', 'caption',
              `${ firestoreIDToDailyID[client.sessionID] === activeSpeakerDailyID ? 'font-weight-bold grey--text text--darken-3' : 'text--secondary' }`,
            ]"
          >
            {{ client.firstName }}
          </div>
      
          <v-spacer/>

          <template v-if="client.sessionID === sessionID">
            <!-- 
              <VideoConferenceRoom/> can only request to join a room if the CallObject is ready i.e. in the 'DISCONNECTED' state 
              which makes the correctness proof simple. 
            -->
            <template v-if="connectionStatus === 'DISCONNECTED'">
              <v-btn @click.prevent.stop="joinConferenceRoom()" small dark fab color="success" class="mx-2">
                <v-icon>mdi-video</v-icon>
              </v-btn>
            </template>

            <template v-else-if="connectionStatus === 'CONNECTING'">
              <v-btn :loading="true" small dark fab color="success" class="mx-2">
                <v-icon>mdi-video</v-icon>
              </v-btn>
            </template>

            <template v-else-if="connectionStatus === 'CONNECTED'">
              <portal to="bottom-right-of-camera-video">
                <v-switch @change="toggleMic(); $store.commit('SET_IS_MIC_ON', !isMicOn)"
                  :input-value="isMicOn"
                  :prepend-icon="isMicOn ? 'mdi-microphone' : 'mdi-microphone-off'"
                  hide-details dense inset class="mt-0 pt-0 grey--text" color="grey darken-3"
                />
              </portal>

              <portal to="video-screenshare-hangup-buttons">
                <v-row class="d-flex pl-3 pr-1 mt-2" align="center">
                  <v-switch @change="toggleCam(); $store.commit('SET_IS_CAMERA_ON', !isCamOn)" 
                    :input-value="isCamOn" 
                    class="ml-1 mt-0 pt-0 grey--text" color="black" prepend-icon="mdi-video" hide-details inset dense
                  />
                  <v-switch @change="toggleScreen()"
                    :input-value="isSharingScreen" 
                    color="black" inset dense hide-details
                    prepend-icon="mdi-monitor"
                    class="mt-0 pt-0 grey--text"
                  />
                  <v-btn @click.prevent.stop="$store.commit('SET_CAN_HEAR_AUDIO', false); leaveConferenceRoom()" class="ml-2" x-small dark fab color="red">
                    <v-icon small>mdi-phone-hangup</v-icon>
                  </v-btn>
                </v-row>
              </portal>
            </template>

            <template v-else-if="connectionStatus === 'ERROR'">
              Error: Troubleshoot Guide
            </template>

            <portal-target name="right-side-of-my-participant-name">

            </portal-target>
          </template>
          <!-- END OF MY OWN UI -->

          <template v-else>
            <v-icon v-if="participants.hasOwnProperty( firestoreIDToDailyID[client.sessionID] )" style="font-size: 1rem" color="grey darken-3">
              {{ participants[ firestoreIDToDailyID[client.sessionID] ].audio ? 'mdi-microphone' : 'mdi-microphone-off' }}
            </v-icon>
            <v-icon v-else-if="client.canHearAudio" color="green" style="font-size: 0.9rem">
              mdi-video
            </v-icon>

            <v-icon v-if="client.isMusicPlaying" color="cyan" style="font-size: 0.9rem">
              mdi-music-clef-treble
            </v-icon>

            <v-icon v-if="client.isViewingLibrary" color="purple" style="font-size: 0.9rem">
              mdi-bookshelf
            </v-icon>
            <v-icon v-else-if="client.isViewingForum" color="yellow darken-3" style="font-size: 0.9rem">
              mdi-forum
            </v-icon>

            <div :class="['caption', 'black--text']" style="font-size: 1em">
              {{ client.currentBoardNumber }}
            </div>
          </template>
        </v-row>

        <div v-if="client.sessionID === sessionID" 
          id="my-local-video" 
          :key="client.sessionID + 'local-video'"
          style="position: relative;"
        >
          <!-- z-index is not great -->
          <portal-target name="bottom-right-of-camera-video" 
            style="position:absolute;
            bottom: 5px; 
            right: 5px;
            z-index: 3;"
          >

          </portal-target>
        </div>
        <div v-else :id="client.sessionID" 
          :key="client.sessionID + 'remote-video'"
          style="position: relative;"
        >
          
        </div>
      </template>
    </portal>
  </div>
</template>

<script>
/**
 * Better than Twilio: simple, easy-to-use API, much cheaper
 * Better than Jitsi: more reliable, much easier to use than Jitsi, more reliable future

 * 
 * TEST with 5 friends
 * 
 * // TODO: persist audio state and camera state across rooms
 * 
 * After reliable testing: 
 *   - Handle unforeseen edge cases: e.g. moving fast between rooms, multiple devices, cache errors
 *   // Error handling : disconnecting in the middle of the session
 *    // TODO: better error handling (for caches with Zooms) 
 *   // UI improvement
 *   - Consistent video constraints / aspect ratios no matter the device size
 * 
 *   // TROUBLESHOOT ADVICE
 *   - Selecting input/output devices 
 *   - Better warnings (e.g. browser compatibility)
 *   - Better troubleshoot warnings (e.g. reset cache, etc.)
 * 
 * @see API guide https://docs.daily.co/reference#%EF%B8%8F-createcallobject
 * @see Github demo code https://github.com/daily-demos/call-object-react/blob/main/src/components/Call/Call.js
 */
import DailyIframe from '@daily-co/daily-js';
import { API_KEY_SECRET } from "@/dailyCreds.js";
import { mapState } from "vuex"; 
import Vue from "vue";

export default {
  data () {
    return {
      isDestroyed: false,
      isSharingScreen: false
    };
  },
  computed: {
    ...mapState([
      "user",
      "canHearAudio", // TODO: rename it to something better
      "CallObject",
      "connectionStatus",
      "participants",
      "roomIDtoParticipants",
      "firestoreIDToDailyID",
      "activeSpeakerDailyID"
    ]),
    allClients () { 
      if (!this.roomIDtoParticipants) return; 
      else return this.roomIDtoParticipants[this.$route.params.room_id]; 
    },
    sessionID () { return this.$store.state.session.currentID; },
    isMicOn () { return this.participants.local.audio; },
    isCamOn () { return this.participants.local.video; }
  },
  watch:  {
    // after initially joining a room, Analia will auto-join subsequent rooms 
    connectionStatus: {
      immediate: true,
      handler (newValue) {
        if (newValue === 'DISCONNECTED' && this.canHearAudio) {
          this.joinConferenceRoom(); 
        }
      }
    }
  },
 async destroyed () {
    this.isDestroyed = true; 
    this.cleanUpCallObject(); 
  },
  methods: {
     /**
     * @see https://www.daily.co/blog/video-call-api-tutorial-the-rooms-family-of-endpoints/
     */
    async createConferenceRoom () {
      return new Promise(async (resolve) => {
        try {
          const { room_id } = this.$route.params; 
          const SECONDS_IN_TWO_HOURS = 2 * 60 * 60; 
          const response = await fetch("https://api.daily.co/v1/rooms", {
            "method": "POST",
            "headers": {
              "content-type": "application/json", // remove this allows your room to beb created
              "Authorization": "Bearer " + API_KEY_SECRET
            },
            // mode: "cors",
            body: JSON.stringify({
              name: this.$route.params.room_id,
              properties: {
                exp: Math.round(Date.now() / 1000) + SECONDS_IN_TWO_HOURS 
              }
            })
          }); 
          const room = await response.json(); 
          console.log("room =", room); 
          if (room.error === "invalid-request-error" && room.info === `a room named ${room_id} already exists`) {
            console.log("room already exists =", room_id);
            resolve({ url: `https://feynman.daily.co/${room_id}` }); 
          } else {
            resolve(room); 
          }
        } catch (error) {
          // TODO: handle error explicitly
          console.error(error);
          alert(error);
          resolve({ url: "" });
        } 
      });
    },
    async joinConferenceRoom () {
      this.$store.commit("SET_CONNECTION_STATUS", "CONNECTING");
      try {
        const conferenceRoom = await this.createConferenceRoom(); 
        console.log("conferenceRoom =", conferenceRoom);
        await this.CallObject.join({
          url: conferenceRoom.url, // `https://feynman.daily.co/${'Ly77BmJeKWudV1FJISnD'}`,
          userName: this.sessionID
        }); 
        // NEED TO LEAVE
        if (this.isDestroyed) {
          this.leaveConferenceRoom(); 
        } else {
          this.$store.commit("SET_CONNECTION_STATUS", "CONNECTED");
          if (this.canHearAudio) {
            // TODO: camera should never be turne don 
            // fundamentall turn off the audio light and the camera light
            // TODO: differentiate between the global isMicOn and the true isMicOn
            // if (this.$store.state.isMicOn !== this.isMicOn) {
            //   this.toggleMic(); 
            // } 
            // if (this.$store.state.isCameraOn !== this.isCamOn) {
            //   this.toggleCam(); 
            // }
          } else {
            this.$store.commit("SET_CAN_HEAR_AUDIO", true);
          }
        }
      } catch (error) {
        this.$store.commit("SET_CONNECTION_STATUS", "ERROR");
      } 
    },
    toggleMic () {
      this.CallObject.setLocalAudio(! this.isMicOn);
    },
    toggleCam () {
      this.CallObject.setLocalVideo(! this.isCamOn); 
    },
    toggleScreen () {
      if (! this.isSharingScreen) this.CallObject.startScreenShare(); 
      else this.CallObject.stopScreenShare(); 
      this.isSharingScreen = ! this.isSharingScreen; 
    },
    async leaveConferenceRoom () {
      // await this.CallObject.leave(); 
      // // unmount camera streams
      for (const client of this.allClients) {
        let videoContainer; 
        if (client.sessionID === this.sessionID) {
          videoContainer = document.getElementById("my-local-video"); 
        } else {
          videoContainer = document.getElementById(client.sessionID); 
        }
        if (videoContainer) {
          if (videoContainer.firstChild) { // note the video could have been already been unmounted by the track-stopped event
             videoContainer.removeChild(videoContainer.firstChild); 
          }
        }
      }
      // unmount audio streams
      const audioContainer = document.getElementById("container-for-audio-elements"); 
      while (audioContainer.firstChild) {
        audioContainer.removeChild(audioContainer.firstChild);
      }

      this.cleanUpCallObject();
    },
    async cleanUpCallObject () {
      await this.CallObject.leave(); 
      this.$store.commit("SET_CONNECTION_STATUS", "DISCONNECTING"); 
      this.$store.commit("SET_CONNECTION_STATUS", "DISCONNECTED");
    }
  }
};
</script>
