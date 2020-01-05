<template>
  <div class="new-post">
    <v-textarea
      outlined
      name="input-7-4"
      label="Question"
      placeholder="Type question here..."
      v-model="newQuestion"
      class="mt-2"
    />
    <div :style="`height: ${getFullWidth() * 9/16}px; position: relative`">
      <BlackboardMini
        :allStrokes="boardStrokes"
        @new-stroke="stroke => $emit('new-stroke', stroke)"
        :width="`${getFullWidth()}`"
        :height="`${getFullWidth() * 9/16}`"
      />
      <!-- <RenderlessFetchStrokes whiteboardID="3u9102vnYb01zaOTYYbB">
        <template slot-scope="{ strokes }">
          <DoodleVideo 
            v-if="strokes"
            :strokes="strokes"
            canvasID="2"
            @animation-loaded="hasFetchedVideos = true"
          />
        </template>
      </RenderlessFetchStrokes>-->
    </div>
    <v-btn @click="submitQuestion()" block color="secondary" dark>Submit question</v-btn>
  </div>
</template>

<script>
import DoodleVideo from "@/components/DoodleVideo.vue";
import BlackboardMini from "@/components/BlackboardMini.vue";
import RenderlessFetchStrokes from "@/components/RenderlessFetchStrokes.vue";

export default {
  props: {
    boardStrokes: Array
  },
  components: {
    DoodleVideo,
    RenderlessFetchStrokes,
    BlackboardMini
  },
  data: () => ({
    newQuestion: ""
  }),
  methods: {
    submitQuestion() {
      const blackboardID =
        Math.random()
          .toString(36)
          .substring(2, 15) +
        Math.random()
          .toString(36)
          .substring(2, 15);
      const questionObj = {
        title: "No title yet",
        description: this.newQuestion,
        blackboardID
      };
      this.$emit("question-submit", questionObj);
      this.newQuestion = "";
    },
    getFullWidth() {
      // sidenav's width = 200, BaseList's width = 300
      return window.innerWidth - 500;
    }
  }
};
</script>