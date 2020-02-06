<!-- Given a post, display its text and its blackboard -->
<template>
  <v-card id="view-post">
    <v-card-title class="post-header py-2">{{ postType }}</v-card-title>
    <v-container class="py-5 px-5">
      <h3 class="post-title">{{ post.title }}</h3>
      <div class="post-description mb-5">{{ post.description }} </div>
      <div v-if="post.image" class="image-container">
        <img :src="post.image"/>
      </div>
      <DoodleVideo 
        :whiteboardID="post.blackboardID" 
        :hasSubcollection="false"
        :canvasID="`${postNumber}`"
        :audioURL="post.audioURL"
        :height="`${getFullWidth() * 9/16}`"
        ref = "DoodleVideo"
        @full-video-ready="initVideo()"
        @video-clicked="handleClick()"
      />
    </v-container>
    <footer v-if="post.author" class="post-footer px-4 py-3">
      Posted by {{ post.isAnonymous? 'Anonymous' : post.author.firstName }}, {{ displayDate(post.date) }} 
    </footer>
  </v-card>
</template>

<script>
import DoodleVideo from "@/components/DoodleVideo.vue"
import db from "@/database.js";
import moment from "moment";

export default {
  props: {
    post: Object,
    postNumber: Number,
    postType: String
  },
  components: {
    DoodleVideo
  },
  data () {
    return {
      video: null
    }
  },
  methods: {
    displayDate (date) {
      return moment(date).format('MMM Do, h:mm a');
    },
    getFullWidth () {
      // sidenav's width = 200, BaseList's width = 300 
      return window.innerWidth - 500 
    },
    initVideo () {
      this.$refs.DoodleVideo.resizeVideo();
    },
    handleClick () {
      if (this.post.audioURL) return;
      const DoodleVideo = this.$refs.DoodleVideo;
      if (!DoodleVideo.isQuickplaying) DoodleVideo.quickplay();
    }
  }
}
</script>

<style>
.post-title {
    line-height: 1.3;
    font-size: 1.1em;
    font-weight: 500;
    margin-bottom: 15px;
}
.image-container img {
  max-width: 100%
}
.post-footer {
  background: #f9f9f9;
  text-align: right;
}
</style>