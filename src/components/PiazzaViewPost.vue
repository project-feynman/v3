<template>
   <v-card :width="getFullWidth()">
    <v-col cols="12" class="pb-0">
      <v-textarea
        readonly
        disabled
        name="input-7-4"
        label="Question"
        :value="question.description"
      />
    </v-col>
    <v-col cols="12" class="pt-0">
      <v-row>
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
      </v-row>
      <v-row>
        <PiazzaAnswerList
          :answers="answers"
        />
      </v-row>
      <v-row>
        <h1>Submit Answer</h1>
        <PiazzaNewAnswer
          @answer-submit="answerObj => $emit('answer-submit', answerObj)"
        />
      </v-row>
    </v-col>
  </v-card>
</template>

<script>
import DoodleVideo from "@/components/DoodleVideo.vue"
import RenderlessFetchStrokes from "@/components/RenderlessFetchStrokes.vue"
import PiazzaNewAnswer from "@/components/PiazzaNewAnswer.vue"
import PiazzaAnswerList from "@/components/PiazzaAnswerList.vue"

export default {
  props: {
    question: Object,
    answers: Array
  },
  components: {
    DoodleVideo,
    RenderlessFetchStrokes,
    PiazzaNewAnswer,
    PiazzaAnswerList
  },
  methods: {
    getFullWidth () {
      // sidenav's width = 200, BaseList's width = 300 
      return window.innerWidth - 500 
    }
  }
}
</script>