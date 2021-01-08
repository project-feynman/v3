<template>
  <v-app>
    <!-- DIFFERENT PAGES WILL BE INJECTED BELOW -->
    <router-view/>
    
    <v-snackbar v-model="snackbar" timeout="1500">
      {{ snackbarMessage }}
      <template v-slot:action>
        <v-btn @click="snackbar = false" text>CLOSE</v-btn>
      </template>
    </v-snackbar>

    <v-snackbar v-model="musicSnackbar" timeout="5000">
      Enable background music from Maplestory?
      <v-btn @click="playBackgroundMusic(); musicSnackbar = false;" text color="cyan">YES </v-btn>
      <v-btn @click="musicSnackbar = false;" text>NO</v-btn>
    </v-snackbar>
  </v-app>
</template>

<script>
import firebase from "firebase/app"; 
import "firebase/storage"; 
import Vue from "vue"; 

const PARTICIPANT_EVENTS = ["participant-joined", "participant-updated", "participant-left"]; 

export default {
  data: () => ({
    snackbar: false,
    snackbarMessage: "",

    musicSnackbar: true,
    musicAudioElement: null,

    // Daily Video Conference API 
    firestoreIDToDailyID: {}
  }),
  computed: {
    CallObject () { return this.$store.state.CallObject; },
    participants () { return this.$store.state.participants }
  },
  async created () {
    // initialize CallObject (consumed by DailyVideoConferenceRoom)
    for (const event of PARTICIPANT_EVENTS) {
      this.CallObject.on(event, this.maintainParticipantsCorrectness); 
    }
    this.CallObject.on("track-started", this.mountNewTrack);
    this.CallObject.on("track-stopped", this.unmountTrack);
    this.CallObject.on("active-speaker-change", ({ activeSpeaker }) => {
      console.log("payload =", activeSpeaker); 
      this.$store.commit("SET_ACTIVE_SPEAKER_DAILY_ID", activeSpeaker.peerId);
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
      console.log("maintainParticipantsCorrectness()");
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
          console.log("video track received =", track);
          const videoElement = document.createElement("video"); 
          videoElement.srcObject = new MediaStream([track]);
          videoElement.setAttribute("id", "video" + participant.user_id); 
          videoElement.setAttribute("muted", true); 
          videoElement.setAttribute("autoplay", true); 
          videoElement.setAttribute("playsinline", true); // without it, iOS forces video to play in fullscreen
          
          videoElement.setAttribute("width", 200); 
          videoElement.setAttribute("height", 150); 
          videoElement.setAttribute("position", "relative");
          videoElement.setAttribute("z-index", 2); // not great

          if (! participant.user_name) { // user_name maps to sessionID 
            document.getElementById("my-local-video").appendChild(videoElement); 
          } else if (participant.user_name === this.sessionID) { // TODO: refactor. Handles the case where I re-share my camera, but now my user_name is defined
            document.getElementById("my-local-video").appendChild(videoElement); 
          } else { 
            document.getElementById(participant.user_name).appendChild(videoElement);
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
          console.log("a video track stopped =", track);
          const firestoreID = participant.user_name; 
          if (firestoreID === this.sessionID) {
            console.log("it was my track");
            document.getElementById("my-local-video").remove(); 
          } else {
            console.log("it was someone else's track =", participant.user_id);
            document.getElementById("video" + participant.user_id).remove();
          }
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