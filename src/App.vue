<template>
  <v-app>
    <router-view/>
    
    <v-snackbar v-model="snackbar">
      {{ snackbarMessage }}
      <v-btn @click="snackbar = false" color="pink" text>CLOSE</v-btn>
    </v-snackbar>

    <v-snackbar v-model="musicSnackbar" timeout="10000">
      Play music from Maplestory's soundtrack? 
      <v-btn @click="playBackgroundMusic(); musicSnackbar = false;" color="pink" text>YES </v-btn>
      <v-btn @click="musicSnackbar = false;" text>NO</v-btn>
    </v-snackbar>
  </v-app>
</template>

<script>
export default {
  data: () => ({
    snackbar: false,
    snackbarMessage: "",

    musicSnackbar: true,
    musicAudioElement: null
  }),
  computed: {
    user () { return this.$store.state.user; }
  },
  created () {
    // TODO: add 1 more soundtrack
    // Lith Harbor
    this.$store.commit("SET_MUSIC_AUDIO_ELEMENT", new Audio("/music.mp3"));

    this.$root.$on("show-snackbar", (message) => {
      this.snackbar = true;
      this.snackbarMessage = message;
    });
  },
  methods: {
    playBackgroundMusic () {
      console.log("musicAudioElement =", this.$store.state.musicAudioElement);
      this.$store.state.musicAudioElement.play(); 
      this.$store.commit("SET_IS_MUSIC_PLAYING", true);
    }
  }
}
</script>
<style>
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