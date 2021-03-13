<template>
  
</template>

<script>
import { mapState } from "vuex"; 
import firebase from "firebase/app";

export default {
  props: {
    incrementToToggleMusic: {
      type: Number,
      required: true
    }
  },
  data () { 
    return {
      hasMusicLoaded: false,
      isPlayingMusic: false
    }
  },
  computed: {
    ...mapState([
      "user",
      "musicAudioElement",
      "isMusicPlaying"
    ])
  },
  async created () {
    if (this.user && !this.user.isAnonymous) {
      const maplestorySoundtrack = [
        "[MapleStory BGM] Lith Harbor Above the Treetops.mp3",
        "[MapleStory BGM] Ereve Raindrop Flower.mp3",
      ];
      const randomNumber =  Math.floor((Math.random() * maplestorySoundtrack.length));
      const pathReference = firebase.storage().ref(maplestorySoundtrack[randomNumber]); 
      const url = await pathReference.getDownloadURL(); 
      this.$store.commit("SET_MUSIC_AUDIO_ELEMENT", new Audio(url)); 
      this.$emit("music-fetched"); 
    }
  },
  watch: {
    incrementToToggleMusic () {
      console.log("incrementToToggleMusic changed =", this.incrementToToggleMusic); 
      if (!this.isMusicPlaying) {
        this.musicAudioElement.play(); 
        this.$store.commit("SET_IS_MUSIC_PLAYING", true); 
      } 
      else {
        this.musicAudioElement.pause(); 
        this.$store.commit("SET_IS_MUSIC_PLAYING", false); 
      }
    }
  }
};
</script>