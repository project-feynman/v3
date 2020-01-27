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
      <RenderlessFetchStrokes :whiteboardID="post.blackboardID" :hasSubcollection="false">
        <template slot-scope="{ strokes }">
          <!-- length check is necessary because a length 0 array does not necessarily === [] (TODO: investigate why) -->
          <DoodleVideo 
            v-if="strokes.length !== 0"
            :strokes="strokes"
            :canvasID="`${postNumber}`"
            :audioURL="post.audioURL"
            :height="`${getFullWidth() * 9/16}`"
            @animation-loaded="hasFetchedVideos = true"
          />
        </template>
      </RenderlessFetchStrokes>
    </v-container>
    <footer class="post-footer px-4 py-3">
      Posted by {{ post.isAnonymous? 'Anonymous':post.author.name }}
    </footer>
  </v-card>
</template>

<script>
import DoodleVideo from "@/components/DoodleVideo.vue"
import RenderlessFetchStrokes from "@/components/RenderlessFetchStrokes.vue"

export default {
  props: {
    post: Object,
    postNumber: Number,
    postType: String
  },
  components: {
    DoodleVideo,
    RenderlessFetchStrokes
  },
  methods: {
    getFullWidth () {
      // sidenav's width = 200, BaseList's width = 300 
      return window.innerWidth - 500 
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