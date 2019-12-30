<template>
    <!-- THIS IS JUST THE TEXT, IMAGE AND VIDEO IN EDIT MODE -->
    <!-- IT'S NAMED POST SINCE IT CAN BE RE-USED FOR QUESTIONS AND ANSWERS -->
   <v-card :width="getFullWidth()">
          <v-col cols="12" class="pb-0">
            <v-textarea
              readonly
              name="input-7-4"
              label="Question"
              v-model="questionText"
            >{{ questionText }}</v-textarea>
          </v-col>
          <v-row>
            <v-col cols="6" class="pt-0">
              <v-img
                v-bind:src="questionImg"
                lazy-src="https://picsum.photos/id/11/10/6"
                aspect-ratio="1"
                class="grey lighten-2"
                max-width="500"
                max-height="300"
              ></v-img>
            </v-col>
            <v-col cols="6" class="pt-0">
              <RenderlessFetchStrokes v-bind:whiteboardID="questionVid">
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
        </v-card>
</template>

<script>
import DoodleVideo from "@/components/DoodleVideo.vue"
import RenderlessFetchStrokes from "@/components/RenderlessFetchStrokes.vue"

export default {
  props: {
      questions: Array,
      currentQuestionID: Number,
  },
  components: {
    DoodleVideo,
    RenderlessFetchStrokes
  },
  data: () => ({
    questionImg: "",
    questionVid: "",
    questionText: ""
  }),
  watch: { 
    currentQuestionID: function(newVal, oldVal) { // watch it
      this.questions[this.currentQuestionID]['image'] = "https://i.ytimg.com/vi/AZ2ZPmEfjvU/maxresdefault.jpg"
      this.questionImg = this.questions[newVal]['image']
      this.questionVid = this.questions[newVal]['videoID']
      this.questionText = this.questions[newVal]['text']
    }
  },
  async created () {
    this.questions[this.currentQuestionID]['image'] = "https://i.ytimg.com/vi/AZ2ZPmEfjvU/maxresdefault.jpg"
    this.questionImg = this.questions[this.currentQuestionID]['image']
    this.questionVid = this.questions[this.currentQuestionID]['videoID']
    this.questionText = this.questions[this.currentQuestionID]['text']
  },
  methods: {
    getFullWidth () {
      // sidenav's width = 200, BaseList's width = 300 
      return window.innerWidth - 500 
    }
  }
}
</script>