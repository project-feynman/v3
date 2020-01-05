<template>
  <div id="view-post">
    <v-col cols="12" class="pb-0">
      <v-textarea
        readonly
        disabled
        name="input-7-4"
        label="Question"
        :value="question.description"
      />
    </v-col>
    <v-row>
      <v-col cols="12" class="pt-0">
        <RenderlessFetchStrokes :whiteboardID="question.blackboardID" :hasSubcollection="false">
          <template slot-scope="{ strokes }">
            <DoodleVideo
              v-if="strokes"
              :strokes="strokes"
              canvasID="2"
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
    question: Object
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