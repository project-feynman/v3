<!-- Given a post, display its text and its blackboard -->
<template>
  <div>
    <v-col cols="12" class="pb-0">
      <v-textarea
        class="pa-2"
        readonly
        name="input-7-4"
        :value="post.description"
      />
    </v-col>
    <v-row>
      <v-col cols="12" class="pb-0">
        <RenderlessFetchStrokes :whiteboardID="post.blackboardID" :hasSubcollection="false">
          <template slot-scope="{ strokes }">
            <!-- length check is necessary because a length 0 array does not necessarily === [] (TODO: investigate why) -->
            <DoodleVideo 
              v-if="strokes.length !== 0"
              :strokes="strokes"
              :canvasID="`${postNumber}`"
              :height="`${getFullWidth() * 9/16}`"
              @animation-loaded="hasFetchedVideos = true"
            />
          </template>
        </RenderlessFetchStrokes>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import DoodleVideo from "@/components/DoodleVideo.vue";
import RenderlessFetchStrokes from "@/components/RenderlessFetchStrokes.vue";

export default {
  props: {
    post: Object,
    postNumber: Number
  },
  components: {
    DoodleVideo,
    RenderlessFetchStrokes
  },
  methods: {
    getFullWidth() {
      // sidenav's width = 200, BaseList's width = 300
      return window.innerWidth - 500;
    }
  }
};
</script>