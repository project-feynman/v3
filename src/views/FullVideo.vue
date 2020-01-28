<template>
  <div id="video" style="height: 90%">
    <BaseAppBar :loading="!resourcesLoaded" />
    <v-content style="height: 90%">
      <!-- <v-container fluid class="pa-0"> -->
        <!-- <DoodleVideoAnimation
          v-if="allStrokes.length !== 0"
          ref="animation"
          :isFullscreen="true"
          :strokes="allStrokes"
          :overlay="overlay"
          @animation-loaded="animationLoaded=true"
          @animation-finished="handleEvent()"
          @play-video="startVideo()"
        />
        <AudioRecorder
          v-if="audioURL"
          ref="audio-recorder"
          :audioURL="audioURL"
          @recorder-loading="recorderLoaded=false"
          @play="handlePlay()"
          @stop="handleStop()"
          @seeking="handleSeeking()"
          @recorder-loaded="recorderLoaded=true"
        /> -->
        <DoodleVideo 
          v-if="video"
          :audioURL="video.audioURL"
          :whiteboardID="$route.params.video_id"
          @full-video-ready="playVideo()"
          @video-clicked="handleClick()"
          ref="DoodleVideo"
        />
             <!-- <DoodleVideo
                :whiteboardID="$route.params.video_id" 
                :ref="`doodle-video-${1}-${1}`"
                :canvasID="`${1}-${1}`"
              /> -->

      <!-- </v-container> -->
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
    playVideo () {
      this.resourcesLoaded = true
      const DoodleVideo = this.$refs.DoodleVideo
      DoodleVideo.resizeVideo() // might need next tick 
    },
    handleClick(){
      ////implement if you want to play and pause
    },

    // handlePlay() {
    //   const animation = this.$refs["animation"];
    //   animation.overlay = false;
    //   this.initializeAnimation();

    //   // Initialize playback synchronization if possible.
    //   if (this.syncInitialized) {
    //     animation.sync = setTimeout(animation.syncVisualWithAudio, 0);
    //   }
    // },
    // handleStop() {
    //   // Stop sync.
    //   const animation = this.$refs["animation"];
    //   clearTimeout(animation.sync);
    //   animation.sync = undefined;
    // },
    // handleSeeking() {
    //   // Stop first.
    //   this.handleStop();

    //   // Call once.
    //   const animation = this.$refs["animation"];
    //   animation.syncVisualWithAudio(true);
    // },
    // initializeAnimation() {
    //   if (!this.syncInitialized && this.resourcesLoaded) {
    //     const audioRecorder = this.$refs["audio-recorder"];
    //     const animation = this.$refs["animation"];
    //     animation.startSync(audioRecorder.getAudioTime);
    //     this.syncInitialized = true;
    //   }
    // },
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
    },
    // async deleteVideo() {
    //   const recursiveDelete = firebase
    //     .functions()
    //     .httpsCallable("recursiveDelete");
    //   recursiveDelete({ path: `whiteboards/${this.$route.params.video_id}` });
    //   if (this.audioFileRef) this.audioFileRef.delete();
    //   // redirect
    //   this.$router.push(`/${this.$route.params.class_id}/ranking`);
    // },
        
  }
};
</script>
