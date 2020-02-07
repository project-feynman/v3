<template>
  <div id="video" style="height: 90%">
    <TheAppBar :loading="isLoading"/>
    <v-content style="height: 90%">
      <DoodleVideo 
        v-if="video"
        :audioUrl="video.audioUrl"
        :blackboardId="videoId"
        @available-resources-ready="isLoading = false"
        @video-click="playGivenWhatIsAvailable()"
        ref="DoodleVideo"
      />
    </v-content>
  </div>
</template>

<script>
import db from "@/database.js";
import DoodleVideo from "@/components/DoodleVideo.vue";
import TheAppBar from "@/components/TheAppBar.vue";

export default {
  components: {
    DoodleVideo,
    TheAppBar
  },
  data () {
    return {
      video: null,
      isLoading: true,
      audioFileRef: null
    }
  },
  computed: {
    DoodleVideo () {
      return this.$refs.DoodleVideo;
    },
    videoId () {
      return this.$route.params.video_id;
    }
  },
  watch: {
    // TODO: maybe not needed
    $route: {
      handler: "bindVariables",
      immediate: true
    }
  },
  methods: {
    playGivenWhatIsAvailable () {
      if (isLoading) return;
      if (!this.video.audioUrl) { // silent animation
        if (this.DoodleVideo.isQuickplaying) return;
        this.DoodleVideo.quickplay();
      } else if (this.DoodleVideo.hasVisualAndAudio) {
        this.DoodleVideo.handlePlay();
      }
    },
    async bindVariables() {
      // TODO: just keep track of this.video so that I don't need to keep track of this.audioURL, this.audioPath explictly
      // initialize/reset variables
      this.audioURL = ""; //TODO this might not be necessary
      const classId = this.$route.params.class_id;
      const videoRef = db.collection("classes").doc(classId).collection("blackboards").doc(this.videoId);
      
      // TODO: implement a getDocFromDb function for helper.js
      let video = await videoRef.get();
      video = video.data();
      this.video = video;
    },
    // deleteVideo () {
    //   // bind references to make it easy to delete things
    //   // const storageRef = firebase.storage().ref();
    //   // if (video.audioPath) {
    //   //   this.audioFileRef = storageRef.child(`recordings/${video.audioPath}`);
    //   // }
    // }
  }
};
</script>