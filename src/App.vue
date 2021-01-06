<template>
  <v-app>
    <!-- DIFFERENT PAGES WILL BE INJECTED BELOW -->
    <router-view/>
    
    <v-snackbar v-model="snackbar">
      {{ snackbarMessage }} <v-btn @click="snackbar = false" text>CLOSE</v-btn>
    </v-snackbar>

    <v-snackbar v-model="musicSnackbar" timeout="8000">
      Enable background music from Maplestory?
      <v-btn @click="playBackgroundMusic(); musicSnackbar = false;" text color="cyan">YES </v-btn>
      <v-btn @click="musicSnackbar = false;" text>NO</v-btn>
    </v-snackbar>
  </v-app>
</template>

<script>
import firebase from "firebase/app"; 
import "firebase/storage"; 

export default {
  data: () => ({
    snackbar: false,
    snackbarMessage: "",

    musicSnackbar: true,
    musicAudioElement: null
  }),
  async created () {
    this.$root.$on("show-snackbar", (message) => {
      this.snackbar = true;
      this.snackbarMessage = message;
    });

    // TODO: continuously randomize the music
    // "[MapleStory BGM] Singapore Boat Quay Town.mp3"
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