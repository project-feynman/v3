<template>
  <div id="video" style="height: 90%">
    <TheAppBar :loading="!resourcesLoaded"/>
    <v-content style="height: 90%">
      <DoodleVideo 
        v-if="video"
        :audioURL="video.audioURL"
        :blackboardId="$route.params.video_id"
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
import DoodleVideo from "@/components/DoodleVideo.vue";
import TheAppBar from "@/components/TheAppBar.vue";
import { mapState } from "vuex";

export default {
  components: {
    DoodleVideo,
    TheAppBar
  },
  computed: {
    ...mapState(["user"]),
  },
  data () {
    return {
      video: null,
      audioFileRef: null,
      overlay: true,
      resourcesLoaded: false,
      classDoc: null
    }
  },
  watch: {
    // TODO: maybe not neede 
    $route: {
      handler: "bindVariables",
      immediate: true
    }
  },
  methods: {
    initFullVideo () {
      this.resourcesLoaded = true
      this.$refs.DoodleVideo.resizeVideo() // might need next tick 
    },
    handleStrokesReady () {
      if (this.video.audioURL) { return; } // autoplay is only for "preview" videos
      this.resourcesLoaded = true;
      this.$refs.DoodleVideo.quickplay();
    },
    handleClick () {
      const DoodleVideo = this.$refs.DoodleVideo;
      if (!DoodleVideo.isQuickplaying) { DoodleVideo.quickplay(); }
    },
    async bindVariables() {
      // TODO: just keep track of this.video so that I don't need to keep track of this.audioURL, this.audioPath explictly
      // initialize/reset variables
      this.audioURL = ""; //TODO this might not be necessary
      const videoId = this.$route.params.video_id;
      const classId = this.$route.params.class_id;
      const videoRef = db.collection("classes").doc(classId).collection("blackboards").doc(videoId);
      
      // Fetch video
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