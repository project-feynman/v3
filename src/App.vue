<template>
  <v-app>    
    <!-- DIFFERENT PAGES WILL BE INJECTED BELOW -->
    <router-view/>

    <!-- Camera/Mic permission errors -->
    <VideoTroubleshootPopup v-model="isShowingVideoTroubleshootPopup"/> 

    <!-- General errors  -->
    <div class="text-center">
      <v-dialog v-model="isShowingGeneralErrorPopup">
        <v-card width="500">
          <v-card-title class="headline">
            An unusual error occured
          </v-card-title>
          <v-card-text>
            {{ feedbackForUser }}

            <p>Try the general fixes:</p>
            <ol>
              <li>Reload the page</li> 
              <li>Close the page entirely, then open a new one</li> 
              <li>Ensure you use iPad Safari or desktop Chrome</li>
              <li>Clear cookies and cache</li>
              <li>Restart your computer</li>
              <li>Email eltonlin@mit.edu or Facetime +503 250 3868</li>
            </ol>
          </v-card-text>
        </v-card>
      </v-dialog>
    </div>

    <v-snackbar v-model="snackbar" timeout="1500">
      {{ snackbarMessage }}
      <template v-slot:action>
        <v-btn @click="snackbar = false" text>CLOSE</v-btn>
      </template>
    </v-snackbar>

    <v-snackbar v-model="musicSnackbar" timeout="5000">
      Play music from Maplestory?
      <v-btn @click="playBackgroundMusic(); musicSnackbar = false;" text color="cyan">YES </v-btn>
      <v-btn @click="musicSnackbar = false;" text>NO</v-btn>
    </v-snackbar>
  </v-app>
</template>

<script>
import firebase from "firebase/app"; 
import "firebase/storage"; 
import Vue from "vue"; 
import _ from "lodash"; 
import VideoTroubleshootPopup from "@/components/VideoTroubleshootPopup.vue"; 

const PARTICIPANT_EVENTS = ["participant-joined", "participant-updated", "participant-left"]; 

export default {
  data: () => ({
    snackbar: false,
    snackbarMessage: "",

    musicSnackbar: true,
    musicAudioElement: null,

    // Daily Video Conference API 
    firestoreIDToDailyID: {},
    isShowingVideoTroubleshootPopup: false,
    isShowingGeneralErrorPopup: false,
    feedbackForUser: ""
  }),
  components: {
    VideoTroubleshootPopup
  },
  computed: {
    CallObject () { return this.$store.state.CallObject; },
    participants () { return this.$store.state.participants },
    sessionID () { return this.$store.state.session.currentID }
  },
  async created () {
    // initialize CallObject (consumed by VideoConferenceRoom) lightweight is very important for MIT instructors
    this.CallObject.setBandwidth({
      kbs: 20,
      trackConstraints: { width: 320, height: 180, frameRate: 20 }
    });

    // initialize event listeners (documentation: https://docs.daily.co/reference#events)
    const ONE_HUNDRED_MILLISECONDS = 100; 
    for (const event of PARTICIPANT_EVENTS) {
      this.CallObject.on(event, _.debounce(this.maintainParticipantsCorrectness, ONE_HUNDRED_MILLISECONDS)); 
    }
    this.CallObject.on("track-started", this.mountNewTrack);
    this.CallObject.on("track-stopped", this.unmountTrack);
    this.CallObject.on("active-speaker-change", ({ activeSpeaker }) => {
      this.$store.commit("SET_ACTIVE_SPEAKER_DAILY_ID", activeSpeaker.peerId);
    });

    // handle specifically because it's common for users to use Zoom 
    this.CallObject.on("camera-error", (payload) => {
      this.isShowingVideoTroubleshootPopup = true; 
      console.error(payload); 
      console.log("CallObject state =", this.CallObject.meetingState()); 
    });

    // general errors
    this.CallObject.on("load-attempt-failed", ({ action, errorMsg }) => {
      this.isShowingGeneralErrorPopup = true; 
      this.feedbackForUser = action + ": " + errorMsg; 
    }); 
    this.CallObject.on("error", ({ action, errorMsg }) => {
      this.isShowingGeneralErrorPopup = true; 
      this.feedbackForUser = action + ": " + errorMsg; 
    });
    
    // TODO: refactor
    this.$root.$on("error-joining-conference-room", (error) => {
      this.isShowingGeneralErrorPopup = true; 
      this.feedbackForUser = error.message; 
      console.error(error); 
    });

    this.$root.$on("show-snackbar", (message) => {
      this.snackbar = true;
      this.snackbarMessage = message;
    });

    const maplestorySoundtrack = [
      "[MapleStory BGM] Lith Harbor Above the Treetops.mp3",
      "[MapleStory BGM] Ereve Raindrop Flower.mp3",
    ];
    const randomNumber =  Math.floor((Math.random() * maplestorySoundtrack.length));
    const pathReference = firebase.storage().ref(maplestorySoundtrack[randomNumber]); 
    const url = await pathReference.getDownloadURL(); 
    this.$store.commit("SET_MUSIC_AUDIO_ELEMENT", new Audio(url)); 
  },
  methods: {
    playBackgroundMusic () {
      this.$store.state.musicAudioElement.play(); 
      this.$store.commit("SET_IS_MUSIC_PLAYING", true);
    },
    maintainParticipantsCorrectness () {
      this.$store.commit("SET_PARTICIPANTS", { ...this.CallObject.participants() }); 
      this.$store.commit("SET_FIRESTORE_ID_TO_DAILY_ID", {});
      const temp = {}; 
      for (const participant of Object.values(this.participants)) {
        const { user_name, user_id } = participant; 
        // check if it Firestore participant.sessionID is binded to the Daily user_name
        if (user_name) {
          temp[user_name] = user_id; 
        }
      }
      this.$store.commit("SET_FIRESTORE_ID_TO_DAILY_ID", temp)
    },
    async mountNewTrack ({ track, participant }) {
      switch (track.kind) {
        case "video": 
          const v = document.createElement("video"); 
          v.srcObject = new MediaStream([track]);
          v.setAttribute("id", "video" + participant.user_id); 
          v.setAttribute("muted", true); 
          v.setAttribute("autoplay", true); 
          v.setAttribute("playsinline", true); // without it, iOS forces video to play in fullscreen
          
          v.setAttribute("width", 215); 
          v.setAttribute("height", 145); 
          v.setAttribute("position", "relative");
          v.setAttribute("z-index", 2); // not great

          // v.addEventListener("resize", ({ target }) => {
          //   const v = target; 
          //   const w = v.videoWidth;
          //   const h = v.videoHeight;
          //   console.log('w =', w); 
          //   console.log("h =", h);
          //   if (w && h) {
          //     console.log("style.width =", v.style.width);
          //     console.log("w =", w);
          //     v.style.width = w;
          //     v.style.height = h;
          //   }
          // }, false);

          if (! participant.user_name) { // user_name maps to sessionID 
            document.getElementById("my-local-video").appendChild(v); 
          } else if (participant.user_name === this.sessionID) { // TODO: refactor. Handles the case where I re-share my camera, but now my user_name is defined
            document.getElementById("my-local-video").appendChild(v); 
          } else { 
            document.getElementById(participant.user_name).appendChild(v);
          }
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
          break;
      }
    },
    async unmountTrack ({ track, participant }) {
      switch (track.kind) {
        case "video":
          document.getElementById("video" + participant.user_id).remove();
          break;
        case "audio": 
          if (participant.local) return; 
          document.getElementById("audio" + participant.user_id).srcObject = null;
          break;
      }
    }
  }
}
</script>

<style>
/* Fixes snackbar not visible on iOS Safari, see https://github.com/vuetifyjs/vuetify/issues/11781#issuecomment-655689025 */
div.v-snack:not(.v-snack--absolute) {
  height: 100%;
}

/* .v-input__prepend-outer {
  margin-right: 1px !important;
} */

/* Override v-switch CSS to make them more compact */
.v-application--is-ltr .v-input__prepend-outer {
  margin-right: 1px !important;
}

.v-application--is-ltr .v-input--selection-controls__input {
  margin-right: 0px !important;
}

.v-input__append-outer .v-icon, .v-input__prepend-outer .v-icon {
  font-size: 18px !important;
}

/* For the hint text under touch draw */

.v-input__control .v-messages {
  font-size: 8px !important; 
  color: white !important;
}

/* Global styles */
/* What does this do? */
a {
  text-decoration: none;
}
/*
::-webkit-scrollbar {
    width: 12px;
}
::-webkit-scrollbar-track {
    -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.3); 
    border-radius: 10px;
    background-color: rgba(0,0,0,0.15);
}
 
::-webkit-scrollbar-thumb {
    border-radius: 10px;
    -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.5); 
    background-color: orange;
}*/
</style>