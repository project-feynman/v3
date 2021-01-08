<template>
  <div>
    <div id="container-for-audio-elements">

    </div>

    <portal to="current-room-participants">
      <portal-target name="video-screenshare-hangup-buttons">

      </portal-target>

      <template v-for="client in allClients">
        <!-- TODO: rename "id" -->
        <div style="position: relative; height: max-content" :id="client.sessionID === sessionID ? 'my-local-video' : client.sessionID" :key="client.id" class="py-0">
          <div style="display: flex; align-items: center; height: 30px;" class="px-4"
            :class="participants.hasOwnProperty( firestoreIDToDailyID[client.sessionID] ) ? 
                      (participants[firestoreIDToDailyID[client.sessionID]].video ? 'video-overlay' : '') : ''
                      ||
                      participants.hasOwnProperty('local') && client.sessionID === sessionID ? (participants.local.video ? 'video-overlay' : '') : ''
                    "
          >
            <div v-if="activeSpeakerDailyID === firestoreIDToDailyID[client.sessionID]" class="caption font-weight-bold grey--text text--darken-3" style="font-size: 0.9em">
              {{ client.firstName }}
            </div>

            <div v-else class="text--secondary" style="font-size: 0.9em">
              {{ client.firstName }}
            </div>

            <v-spacer/>

            <!-- MYSELF -->
            <template v-if="client.sessionID === sessionID">
              <template v-if="connectionStatus === 'DISCONNECTED'">
                <v-btn @click.prevent.stop="joinConferenceRoom()" small dark fab color="success" class="ml-1 mr-2">
                  <v-icon>mdi-video</v-icon>
                </v-btn>
              </template>

              <template v-else-if="connectionStatus === 'CONNECTING'">
                <v-btn :loading="true" small dark fab color="success" class="mx-2">
                  <v-icon>mdi-video</v-icon>
                </v-btn>
              </template>

              <template v-else-if="connectionStatus === 'CONNECTED'">
                <v-switch @change="toggleMic(); $store.commit('SET_IS_MIC_ON', !isMicOn)"
                  :input-value="isMicOn"
                  :prepend-icon="isMicOn ? 'mdi-microphone' : 'mdi-microphone-off'"
                  class="mt-0 grey--text" 
                  style="padding-top: 2px;"
                  hide-details dense inset 
                  color="grey darken-3"
                />

                <portal to="video-screenshare-hangup-buttons">
                  <div style="display: flex; align-items: center;" class="mt-0 mb-2 pl-1">
                    <v-btn @click.prevent.stop="$store.commit('SET_CAN_HEAR_AUDIO', false); leaveConferenceRoom()" 
                      class="ml-2" x-small dark fab color="red"
                    >
                      <v-icon small>mdi-phone-hangup</v-icon>
                    </v-btn>
                    <v-switch @change="toggleCam(); $store.commit('SET_IS_CAMERA_ON', !isCamOn)" 
                      :input-value="isCamOn" 
                      prepend-icon="mdi-video"
                      class="ml-1 mt-0 pt-0 grey--text" 
                      hide-details inset dense
                      color="grey darken-3"  
                    />
                    <v-switch @change="toggleScreen()"
                      :input-value="isSharingScreen" 
                      prepend-icon="mdi-monitor"
                      class="mt-0 pt-0 grey--text"
                      hide-details inset dense
                      color="grey darken-3"
                    />
                  </div>
                </portal>
              </template>

              <template v-else-if="connectionStatus === 'ERROR'">
                TODO: show troubleshoot popup
              </template>

              <!-- Switch board number here -->
              <portal-target name="right-side-of-my-participant-name" class="ml-2">

              </portal-target>

              <!-- VIDEO IS INJECTED HERE -->

            </template>
            <!-- END OF MY OWN UI -->

            <!-- OTHER PARTICIPANT UI -->
            <template v-else>
              <v-icon v-if="participants.hasOwnProperty( firestoreIDToDailyID[client.sessionID] )" color="grey darken-3">
                {{ participants[ firestoreIDToDailyID[client.sessionID] ].audio ? 'mdi-microphone' : 'mdi-microphone-off' }}
              </v-icon>
        
              <v-icon v-else-if="client.canHearAudio" color="green">
                mdi-video
              </v-icon>

              <v-icon v-if="client.isMusicPlaying" color="cyan">
                mdi-music-clef-treble
              </v-icon>
              <v-icon v-if="client.isViewingLibrary" color="purple">
                mdi-bookshelf
              </v-icon>
              <v-icon v-if="client.isViewingForum" color="yellow darken-3">
                mdi-forum
              </v-icon>
              <div :class="['caption', 'black--text']" style="font-size: 1.2rem;">
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
 * TEST with 5 friends: move fast between rooms 
 *   - Explicit error handling 
 *   - Consistent video constraints / aspect ratios no matter the device size (notice in console it wasn't changed);
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
    },
    participants () {
      console.log("participants =", this.participants);
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
          if (room.error === "invalid-request-error" && room.info === `a room named ${room_id} already exists`) {
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
      // quickfix
      if (this.$store.state.isMusicPlaying) {
        const { musicAudioElement } = this.$store.state; 
        if (musicAudioElement) musicAudioElement.pause(); 
      }
      this.$store.commit("SET_CONNECTION_STATUS", "CONNECTING");
      try {
        const conferenceRoom = await this.createConferenceRoom(); 
        await this.CallObject.join({
          url: conferenceRoom.url, // `https://feynman.daily.co/${'Ly77BmJeKWudV1FJISnD'}`,
          userName: this.sessionID
        }); 
        if (this.isDestroyed) this.leaveConferenceRoom(); 
        else {
          this.$store.commit("SET_CONNECTION_STATUS", "CONNECTED");
          this.$store.commit("SET_CAN_HEAR_AUDIO", true);
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
    }
  }
};
</script>

<style>
.video-overlay {
  position: absolute;
  bottom: 15px;
  background-color: white;
  opacity: 0.7;
  width: 100%;
  z-index: 5;
}
</style>