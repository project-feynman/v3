<template>
  <div>
    <portal to="left-side-panel-current-room">
      <div id="container-for-video-elements">

      </div>
    </portal> 

    <div id="container-for-audio-elements">

    </div>

    <portal to="current-room-participants">
      <template v-if="connectionState !== 'CONNECTED'">
        <v-row v-for="client in allClients"
          align="center"
          :key="client.id" 
          :class="['d-flex', `${client.sessionID === sessionID ? 'mt-3' : 'mt-1'}`, 'pl-5', 'pr-2', 'mr-0']"
        >
          <div 
            style="font-size: 0.9em;"
            :class="['ml-1', 'caption',
              `${dominantParticipantSessionID === client.sessionID ? 'font-weight-bold grey--text text--darken-3' : 'text--secondary' }`,
            ]"
          >
            {{ client.firstName + " " + client.lastName }} 
          </div>
      
          <v-spacer/>

          <template v-if="client.sessionID === sessionID">
            <v-btn v-if="connectionState !== 'CONNECTED'" @click.prevent.stop="joinConferenceRoom()" :loading="connectionState === 'CONNECTING'"
              small dark fab color="success" class="mx-2"
            >
              <v-icon>mdi-video</v-icon>
            </v-btn>

            <template v-else-if="connectionState === 'CONNECTED'">
              <!-- Toggle Microphone -->
              <v-switch
                :input-value="isMicOn"
                @change="toggleMic(); $store.commit('SET_IS_MIC_ON', !isMicOn)"
                :prepend-icon="isMicOn ? 'mdi-microphone' : 'mdi-microphone-off'"
                hide-details dense inset class="mt-0 pt-0 grey--text" color="grey darken-3"
              />

              <!-- Toggle Camera -->
              <v-switch 
                :input-value="isCamOn" 
                @change="toggleCam(); $store.commit('SET_IS_CAMERA_ON', !isCamOn)" 
                :loading="false"
                class="ml-1 mt-0 pt-0 grey--text" color="black" prepend-icon="mdi-video" hide-details inset dense
              />

              <v-btn @click.prevent.stop="leaveConferenceRoom()" class="ml-2" x-small dark fab color="red">
                <v-icon small>mdi-phone-hangup</v-icon>
              </v-btn>
              <ol>
                <li v-for="(p, i) in participants" :key="i">
                  {{ p.user_name }} micOn: {{ p.audio }}
                </li>
              </ol>
            </template>

            <div :class="['caption', 'black--text']" style="font-size: 1.05em">
              {{ "#" + client.currentBoardNumber }}
            </div>
          </template>
          <!-- END OF MY OWN UI -->

          <template v-else>
            <v-icon v-if="allClientAudioStatuses.hasOwnProperty(client.sessionID)" style="font-size: 0.9rem" color="grey darken-3">
              {{ allClientAudioStatuses[client.sessionID] ? 'mdi-microphone' : 'mdi-microphone-off' }}
            </v-icon>
            <v-icon v-else-if="client.canHearAudio" color="green" style="font-size: 0.9rem">
              mdi-phone-check
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
              {{ "#" + client.currentBoardNumber }}
            </div>
          </template>
        </v-row>
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
 * After reliable testing: 
 *   - Handle unforeseen edge cases: e.g. moving fast between rooms, multiple devices, cache errors
 *   // Error handling : disconnecting in the middle of the session
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
import { mapState } from "vuex"; 
import { API_KEY_SECRET } from "@/dailyCreds.js";

console.log("API_SECRET =", API_KEY_SECRET);

export default {
  data () {
    return {
      CallObject: null,
      connectionState: "NOT_CONNECTED",
      participants: {},
      isDestroyed: false,
      dominantParticipantSessionID: "",
      allClientAudioStatuses: {}
    };
  },
  computed: {
    ...mapState([
      "user",
      "roomIDtoParticipants"
    ]),
    allClients () { 
      if (!this.roomIDtoParticipants) return; 
      else return this.roomIDtoParticipants[this.$route.params.room_id]; 
    },
    sessionID () { return this.$store.state.session.currentID; },
    isMicOn () { return this.participants.local.audio; },
    isCamOn () { return this.participants.local.video; }
  },
  created () {
    this.CallObject = DailyIframe.createCallObject(); 
    
    // STATE: ensure `participants` object is always up to date
    const participantEvents = ["participant-joined", "participant-updated", "participant-left"]; 
    for (const participantEvent of participantEvents) {
      this.CallObject.on(participantEvent, (payload) => {
        console.log("payload =", payload); 
        this.participants = {...this.CallObject.participants()};
      }); 
    }

    // UI: handle mounting/unmounting of audio/video streams
    this.CallObject.on("track-started", async ({ track, participant }) => {
      switch (track.kind) {
        case "video": 
          const videoElement = document.createElement("video"); 

          videoElement.srcObject = new MediaStream([track]);
          videoElement.setAttribute("id", "video" + participant.user_id); 
          videoElement.setAttribute("muted", true); 
          videoElement.setAttribute("autoplay", true); 
          videoElement.setAttribute("playsinline", true); // without it, iOS forces video to play in fullscreen
          videoElement.setAttribute("width", 200); 
          videoElement.setAttribute("height", 150); 

          document.getElementById("container-for-video-elements").appendChild(videoElement);
          break; 

        case "audio": 
          if (participant.local) return; 
          else {
            const audioElement = document.createElement("audio"); 
            audioElement.srcObject = new MediaStream([track]); 
            audioElement.setAttribute("id", "audio" + participant.user_id); 
            audioElement.setAttribute("playsinline", true); 
            audioElement.setAttribute("autoplay", true); 

            document.getElementById("container-for-audio-elements").appendChild(audioElement);
          }
      }
    });

    this.CallObject.on("track-stopped", async ({ track, participant }) => {
      switch (track.kind) {
        case "video": 
          // note participant can be null sometimes (unpredictably), so there has to be a way to cleanup unused videos
          document.getElementById("video" + participant.user_id).remove();
          break;
        case "audio": 
          if (participant.local) return; 
          document.getElementById("audio" + participant.user_id).srcObject = null;
          break;
      }
    });
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
          let response;
          const { room_id } = this.$route.params; 
          const SECONDS_IN_TWO_HOURS = 2 * 60 * 60; 
          response = await fetch("https://api.daily.co/v1/rooms", {
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
          resolve({ url: "" });
        } 
      });
    },
    async joinConferenceRoom () {
      this.connectionState = "CONNECTING";
      try {
        const conferenceRoom = await this.createConferenceRoom(); 
        console.log("conferenceRoom =", conferenceRoom);
        await this.CallObject.join({
          url: conferenceRoom.url, // `https://feynman.daily.co/${'Ly77BmJeKWudV1FJISnD'}`,
          userName: `${this.user.firstName} ${this.user.lastName} ${this.sessionID}`
        }); 
        this.connectionState = "CONNECTED"; 
        this.participants = {...this.CallObject.participants()};
      } catch (error) {
        this.connectionState = "NOT_CONNECTED"; 
      } finally {
        // CONCURRENCY (if 2 instances of <DailyVideoConferenceRoom/> briefly exist simultaneously)
        if (this.isDestroyed && this.connectionState === "CONNECTED") {
          this.leaveConferenceRoom(); 
        }
      }

    },
    toggleMic () {
      this.CallObject.setLocalAudio(!this.isMicOn);
    },
    toggleCam () {
      this.CallObject.setLocalVideo(!this.isCamOn); 
    },
    async leaveConferenceRoom () {
      // unmount all mic and camera streams
      const videoContainer = document.getElementById("container-for-video-elements"); 
      while (videoContainer.firstChild) {
        videoContainer.removeChild(videoContainer.firstChild);
      }
      const audioContainer = document.getElementById("container-for-audio-elements"); 
      while (audioContainer.firstChild) {
        audioContainer.removeChild(audioContainer.firstChild);
      }
      
      this.cleanUpCallObject();
    },
    async cleanUpCallObject () {
      await this.CallObject.leave(); 
      await this.CallObject.destroy(); 
      this.connectionState = "NOT_CONNECTED";
    }
    // recomputeSortedParticipants() {
    //   const output = [...this.CallObject.participants()]; 
    //   output.sort((p1, p2) => {
    //     // pin myself to top
    //     if ([p1.user_id, p2.user_id].includes(this.sessionID)) {
    //       return (p2.user_id === this.sessionID) - (p1.user_id === this.sessionID);
    //     }      
    //     // sort primarily by who has camera turned on
    //     else if (p1.video !== p2.video) {
    //       return p1.video - p2.video;
    //     }
    //     // sort secondarily by who is connected to audio 
    //     else if (p1.audio !== p2.audio) {
    //       return p2.audio - p1.audio; 
    //     } 
    //     // sort finally by the highest board number
    //     // else {
    //     //   return p2.currentBoardNumber - p1.currentBoardNumber;
    //     // }
    //   });
    //   this.sortedParticipants = output;
    // }
  }
};
</script>
