<!-- Given a post, display its text and its blackboard -->
<template>
  <div id="view-post">
    <v-textarea
      class="pa-2"
      readonly
      name="input-7-4"
      :value="post.description"
    />
    <DoodleVideo 
      :whiteboardID="post.blackboardID" 
      :hasSubcollection="false"
      :canvasID="`${postNumber}`"
      :audioURL="post.audioURL"
      :height="`${getFullWidth() * 9/16}`"
      ref = "DoodleVideo"
      @full-video-ready="initVideo()"
      />
  </div>
</template>

<script>
import DoodleVideo from "@/components/DoodleVideo.vue"
import RenderlessFetchStrokes from "@/components/RenderlessFetchStrokes.vue"
import db from "@/database.js";

export default {
  props: {
    post: Object,
    postNumber: Number
  },
  components: {
    DoodleVideo,
    RenderlessFetchStrokes
  },
  data () {
    return {
    video: null
    }
  },
  created () {
    // this.fetchVideo();
  },
  methods: {
    getFullWidth () {
      console.log("post: ", this.post)
      // sidenav's width = 200, BaseList's width = 300 
      return window.innerWidth - 500 
    },
    initVideo () {
      
      const doodleVideo = this.$refs.DoodleVideo
      // const animation = doodleVideo.$refs["animation"]
      // animation.drawStrokesInstantly()
      doodleVideo.resizeVideo();
      console.log("inititalized video")
    }
    // async fetchVideo () {
    //   const videoRef = db.collection("whiteboards").doc(this.post.videoID);
    //   let video = await videoRef.get();
    //   this.video = video.data();
    //   console.log("thumbnail: ", this.video.thumbnail)
    // }
    /// we need to figure out how to get thumbnail into this
  }
}
</script>