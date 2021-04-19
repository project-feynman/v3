<template>
  <div>
    <div id="container-for-audio-elements">

    </div>

    <portal to="current-room-participants">
      <portal-target name="video-screenshare-hangup-buttons" class="mb-2">

      </portal-target>

      <div class="mb-2 mx-2">
        <template v-if="connectionStatus !== 'CONNECTED'">
          <v-btn @click.prevent.stop="joinConferenceRoom()" 
            :loading="connectionStatus === 'CONNECTING'"
            small block color="success"
          >
            Join voice
          </v-btn>
        </template>
      </div>

      <template v-for="client in allClients">
        <!-- TODO: rename "id" -->
        <div 
          :id="client.sessionID === sessionID ? 'my-local-video' : client.sessionID" 
          :key="client.id" 
          style="position: relative; height: max-content" 
          class="mt-1"
        >
          <div style="display: flex; justify-content: space-between; align-items: center; height: 30px; padding-left: 4px; padding-right: 0;"
            :class="participants.hasOwnProperty( firestoreIDToDailyID[client.sessionID] ) ? 
              (participants[firestoreIDToDailyID[client.sessionID]].video ? 'video-overlay' : '') : ''
              ||
              participants.hasOwnProperty('local') && client.sessionID === sessionID ? (participants.local.video ? 'video-overlay' : '') : ''
            "
          >
            <div
              style="font-weight: 400; font-size: 1em;"
              class="text--secondary d-flex caption"
            >
              <div :class="activeSpeakerDailyID === firestoreIDToDailyID[client.sessionID] ? 
                `caption font-weight-bold text--darken-3 grey--text` : 'text--secondary'" 
                style="align-items: center; display: flex; margin-left: 18px;"
              >
                <v-icon v-if="client.kind === 'engineer'" 
                  :color="`${client.sessionID === sessionID ? 'cyan' : '' }`" x-small :style="`opacity: 70%;`"
                >
                  mdi-wrench
                </v-icon>
                <v-icon v-else-if="client.kind === 'pioneer'" 
                  :color="`${client.sessionID === sessionID ? 'cyan' : '' }`" x-small style="opacity: 70%;"
                >
                  mdi-cowboy
                </v-icon>
                <v-icon v-else-if="client.isAdmin" 
                  :color="`${client.sessionID === sessionID ? 'cyan' : '' }`" x-small style="opacity: 70%;"
                >
                  mdi-account-tie
                </v-icon>
                <v-icon v-else x-small style="opacity: 70%;"
                  :color="`${client.sessionID === sessionID ? 'cyan' : '' }`"
                >
                  mdi-account
                </v-icon>
                <p :class="client.sessionID === sessionID ? 'mb-0 ml-1 text-truncate' : 'mb-0 ml-1 text-truncate'" style="max-width: 110px">
                  {{ client.firstName  + " " + client.lastName }} 
                </p>
              </div>
            </div>

            <!-- MY UI -->
            <template v-if="client.sessionID === sessionID">
              <div>
                <template v-if="connectionStatus === 'CONNECTED'">
                  <portal to="video-screenshare-hangup-buttons">
                    <div style="display: flex; align-items: center; justify-content: space-around;" class="mt-1 mb-3">
                      <v-btn @click.stop.prevent="toggleMic(); $store.commit('SET_IS_MIC_ON', !isMicOn)" 
                        small fab :color="`${ isMicOn ? 'cyan' : 'grey' }`"
                      >
                        <v-icon v-if="isMicOn" color="white">
                          mdi-microphone
                        </v-icon>
                        <v-icon v-else>
                          mdi-microphone-off
                        </v-icon>
                      </v-btn>

                      <v-btn @click.prevent="toggleCam(); $store.commit('SET_IS_CAMERA_ON', !isCamOn)" 
                        fab small :color="`${ isCamOn ? 'cyan' : 'grey' }`"
                      >
                        <v-icon v-if="isCamOn" color="white">
                          mdi-video
                        </v-icon>
                        <v-icon v-else color="white">
                          mdi-video
                        </v-icon>
                      </v-btn>

                      <v-btn @click.prevent.stop="toggleScreen()" 
                        fab small :color="`${ isSharingScreen ? 'cyan' : 'grey' }`"
                      >
                        <v-icon v-if="isSharingScreen" color="white">
                          mdi-monitor
                        </v-icon>
                        <v-icon v-else color="white">
                          mdi-monitor
                        </v-icon>
                      </v-btn>

                       <v-btn @click.prevent.stop="$store.commit('SET_CAN_HEAR_AUDIO', false); leaveConferenceRoom()" 
                        small dark fab color="red"
                      >
                        <v-icon small>mdi-phone-hangup</v-icon>
                      </v-btn>
                    </div>
                  </portal>
                </template>

                <template v-else-if="connectionStatus === 'ERROR'">
                  <p class="red--text">ERROR</p> 
                  <!-- TODO: show troubleshoot popup -->
                </template>
              </div>
              <!-- End of video call buttons -->

              <v-spacer/> 

              <v-icon v-if="participants && participants.local" :color="`${isMicOn ? 'grey darken-3' : 'red'}`">
                {{ isMicOn ? 'mdi-microphone' : 'mdi-microphone-off' }}
              </v-icon>
              <v-icon v-else color="grey">
                mdi-headphones-off
              </v-icon>

              <!-- Switch board dropdown -->
              <portal-target name="right-side-of-my-participant-name" style="margin-left: 5px;">

              </portal-target>

              <!-- 
                <video/> will be injected here VIA `div.appendChild()
              -->

            </template>
            <!-- END OF MY OWN UI -->

            <!-- OTHER PARTICIPANT UI -->
            <template v-else>
              <v-spacer/>

              <v-icon v-if="participants.hasOwnProperty( firestoreIDToDailyID[client.sessionID] )" 
                :color="`${participants[ firestoreIDToDailyID[client.sessionID] ].audio ? 'grey darken-3' : 'red'}`">
                {{ participants[ firestoreIDToDailyID[client.sessionID] ].audio ? 'mdi-microphone' : 'mdi-microphone-off' }}
              </v-icon>
              <!-- If I'm not connected, but someone else is connected, I'll see that their connected in a phone/voice chat-->
              <v-icon v-else-if="client.canHearAudio" color="green">
                mdi-phone
              </v-icon>
              <v-icon v-else color="red">
                mdi-headphones-off
              </v-icon>

              <!-- Deprecate or choose a new color -->
              <v-icon v-if="client.isMusicPlaying" color="cyan">
                mdi-music-clef-treble
              </v-icon>
              <v-icon v-if="client.isViewingLibrary" color="yellow darken-3">
                mdi-folder
              </v-icon>
              <v-icon v-if="client.isViewingForum" color="secondary">
                mdi-draw
              </v-icon>
         
              <div
                @click="$store.commit('SET_CURRENT_BOARD_ID', client.currentBoardID)"
                :style="`color: ${client.currentPenColor ? client.currentPenColor : 'white' } !important; 
                         width: 38px; 
                         height: 30px; 
                         display: flex; 
                         justify-content: center; 
                         align-items: center; 
                         background-color: rgb(62, 66, 66); 
                         margin-left: 5px; 
                         margin-right: 24px;
                       `"
              >
                {{ client.currentBoardNumber }}
              </div>
            </template>
          </div>
        </div>
        <!-- </div> -->
      </template>
    </portal>
  </div>
</template>

<script>
/** 
 * KNOWN ISSUES: 
 *   - Status breakpoints: error
 *   - Sometimes the laptop just keeps loading infinitely
 *   - Inconsistent video constraints / aspect ratios: investigate user media constraints
 * 
 * @see API guide https://docs.daily.co/reference#%EF%B8%8F-createcallobject
 * @see Github demo code https://github.com/daily-demos/call-object-react/blob/main/src/components/Call/Call.js
 */
import { API_KEY_SECRET } from "@/dailyCreds.js";
import { mapState } from "vuex"; 

export default {
  props: {
    roomID: {
      type: String,
      required: true
    }
  },
  data () {
    return {
      isDestroyed: false,
      isSharingScreen: false,
      connectionFailureDetector: null
    };
  },
  computed: {
    ...mapState([
      "user",
      "canHearAudio", // TODO: rename it 
      "CallObject",
      "connectionStatus",
      "participants",
      "roomIDtoParticipants",
      "firestoreIDToDailyID",
      "activeSpeakerDailyID"
    ]),
    allClients () { 
      if (!this.roomIDtoParticipants) return; 
      else return this.roomIDtoParticipants[this.roomID]; 
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
    // case 1 (sequential): the user leaves after connection has been resolved
    if (this.connectionStatus === "CONNECTED") {
      this.cleanUpCallObject(); 
    }
    // otherwise, as soon as the user connects to the room via `joinConferenceRoom`, 
    // the `isDestroyed` flag will initialize the cleanup straight away.
  },
  methods: {
     /**
     * @see https://www.daily.co/blog/video-call-api-tutorial-the-rooms-family-of-endpoints/
     * @see https://docs.daily.co/reference#room-configuration
     */
    async createConferenceRoom () {
      return new Promise(async (resolve) => {
        try {
          const SECONDS_IN_TWO_HOURS = 2 * 60 * 60; 
          const response = await fetch("https://api.daily.co/v1/rooms", {
            "method": "POST",
            "headers": {
              "content-type": "application/json", // remove this allows your room to beb created
              "Authorization": "Bearer " + API_KEY_SECRET
            },
            // mode: "cors",
            body: JSON.stringify({
              name: this.roomID,
              properties: {
                exp: Math.round(Date.now() / 1000) + SECONDS_IN_TWO_HOURS,
                start_video_off: true
              }
            })
          }); 
          const room = await response.json(); 
          if (room.error === "invalid-request-error" && room.info === `a room named ${this.roomID} already exists`) {
            resolve({ url: `https://feynman.daily.co/${this.roomID}` }); 
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
      const FIFTEEN_SECONDS_IN_MILLISECONDS = 15 * 1000; 
      this.connectionFailureDetector = setTimeout(() => {
        this.$root.$emit("error-joining-conference-room", { message: "Connection timed out after 15 seconds"})
        console.error("CAN'T CONNECT DESPITE 15 seconds"); 
      }, FIFTEEN_SECONDS_IN_MILLISECONDS);

      // quickfix
      if (this.$store.state.isMusicPlaying) {
        const { musicAudioElement } = this.$store.state; 
        if (musicAudioElement) musicAudioElement.pause(); 
        this.$store.commit("SET_IS_MUSIC_PLAYING", false);
      }
      this.$store.commit("SET_CONNECTION_STATUS", "CONNECTING");
      try {
        const conferenceRoom = await this.createConferenceRoom(); 
        await this.CallObject.join({
          url: conferenceRoom.url, // `https://feynman.daily.co/${'Ly77BmJeKWudV1FJISnD'}`,
          userName: this.sessionID
        }); 
        if (this.isDestroyed) { 
          // case 2 (non-sequential): the user joined this room but left before 
          // the join request even finished; now that it has finished, we clean up the room immediately
          this.leaveConferenceRoom();
        } else {
          this.$store.commit("SET_CONNECTION_STATUS", "CONNECTED");
          this.$store.commit("SET_CAN_HEAR_AUDIO", true);
        }
      } catch (error) {
        this.$store.commit("SET_CONNECTION_STATUS", "ERROR");
        console.error(error);
        this.$root.$emit("error-joining-conference-room", error); 
      } finally {
        clearTimeout(this.connectionFailureDetector); 
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
      const camVideoElems = document.querySelectorAll("video");
      for (const camVideoElem of camVideoElems) {
        camVideoElem.remove(); 
      }
      const micAudioElems = document.querySelectorAll("audio"); 
      for (const micAudioElem of micAudioElems) {
        micAudioElem.remove(); 
      }
      this.cleanUpCallObject();
    },
    async cleanUpCallObject () {
      this.$store.commit("SET_CONNECTION_STATUS", "DISCONNECTING"); 
      await this.CallObject.leave(); 
      this.$store.commit("SET_PARTICIPANTS", {}); 
      this.$store.commit("SET_CONNECTION_STATUS", "DISCONNECTED");
      this.$store.commit("SET_ACTIVE_SPEAKER_DAILY_ID", "");
    }
  }
};
</script>

<style>
.video-overlay {
  /* position: absolute; */
  /* top: 116px; */
  /* bottom: 0px; */
  background-color: white;
  opacity: 0.8;
  width: 100%;
  z-index: 5;
}
</style>