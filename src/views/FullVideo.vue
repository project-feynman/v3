<template>
  <div id="video" style="height: 90%">
    <BaseAppBar v-if="classData"
    :classData="classData"
    :loading="!resourcesLoaded" />
    <v-content style="height: 90%">
        <DoodleVideo 
          v-if="video"
          :audioURL="video.audioURL"
          :whiteboardID="$route.params.video_id"
          @full-video-ready="playVideo()"
          @video-clicked="handleClick()"
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
import {initClassesService} from '../dep'

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
  async created() {
      this.classID = this.$route.params.class_id;
      this.classData = await this.classesService.getClassData(this.classID);
  },

  data () {
    return {
      video: null,
      audioFileRef: null,
      overlay: true,
      resourcesLoaded: false,
      classesService: initClassesService(),
      classID: null,
      classData: null
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
