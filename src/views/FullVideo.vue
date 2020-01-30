<template>
  <div id="video" style="height: 90%">
    <BaseAppBar :loading="!resourcesLoaded" />
    <v-content style="height: 90%">
        <DoodleVideo 
          v-if="video"
          :audioURL="video.audioURL"
          :whiteboardID="$route.params.video_id"
          @full-video-ready="initFullVideo()"
          @video-clicked="handleClick()"
          @strokes-ready="handleStrokesReady()"
          ref="DoodleVideo"
        />
    </v-content>
  </div>
</template>

<script>
import db from "@/database.js";
import DoodleVideoAnimation from "@/components/DoodleVideoAnimation.vue";
import DoodleVideo from "@/components/DoodleVideo.vue";
import AudioRecorder from "@/components/AudioRecorder.vue";
import BaseAppBar from "@/components/BaseAppBar.vue";
import BaseOverlay from "@/components/BaseOverlay.vue";
import { mapState } from "vuex";
import firebase from "firebase/app";
import "firebase/storage";
import "firebase/functions";

export default {
  components: {
    DoodleVideoAnimation,
    AudioRecorder,
    DoodleVideo,
    BaseAppBar,
    BaseOverlay
  },
  computed: {
    ...mapState(["user"]),
  },
  data () {
    return {
      video: null,
      audioFileRef: null,
      overlay: true,
      resourcesLoaded: false
    }
  },
  watch: {
    // even this might be unnecessary
    $route: {
      handler: "bindVariables",
      immediate: true
    }
  },
  methods: {
    initFullVideo () {
      this.resourcesLoaded = true
      const DoodleVideo = this.$refs.DoodleVideo
      DoodleVideo.resizeVideo() // might need next tick 
    },
    handleStrokesReady () {
      if (!this.video.audioURL) {
        this.$nextTick(() => {
            this.resourcesLoaded = true
            const DoodleVideo = this.$refs.DoodleVideo;
            DoodleVideo.quickplay();
          });
      }
    },
    handleClick(){
      ////implement if you want to play and pause
      
      const DoodleVideo = this.$refs.DoodleVideo;
      if (!DoodleVideo.isQuickplaying){
        DoodleVideo.quickplay();
      }
    },

    async bindVariables() {
      // TODO: just keep track of this.video so that I don't need to keep track of this.audioURL, this.audioPath explictly

      // initialize/reset variables
      this.audioURL = ""; //TODO this might not be necessary

      const videoID = this.$route.params.video_id;
      const videoRef = db.collection("whiteboards").doc(videoID);
      
      let video = await videoRef.get();
      video = video.data();
      this.video = video;

      // bind references to make it easy to delete things
      // const storageRef = firebase.storage().ref();
      // if (video.audioPath) {
      //   this.audioFileRef = storageRef.child(`recordings/${video.audioPath}`);
      // }
    }
        
  }
};
</script>
