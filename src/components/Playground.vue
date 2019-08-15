<template>
  <div>
  <!-- voice chat -->
  <!-- <voice-chat></voice-chat> -->

  <!-- overlay experiment -->
  <!-- <experiment/> -->

  <v-container grid-list-md fluid pt-5>
    <template v-for="(course, i) in courses">

      <!-- HANDLE EDGE CASE -->
      <v-layout v-if="i == (courses.length - 1) && i%2 != 1" :key="course['.key']" :class="`px-${getSideMargin()}`" row wrap mt-0 mx-0 mb-5 pa-0>
        <v-flex :style="`flex-basis: calc((100% - ${getGapWidth()}px)/2)`">
          <renderless-component :whiteboardID="courses[i].introVideoID">
            <template slot-scope="slotProps">
              <vuetify-card :actionButtons="['COLLABORATE NOW', 'REPLAY DOODLE']"
                            @action="buttonName => handleAction(buttonName, courses[i], i)" 
                            :title="courses[i].courseNumber"
                            :description="courses[i].description">
                <beta-doodle-video v-if="slotProps.strokes"
                                   :ref="`doodle-video-${i}`"
                                   :strokes="slotProps.strokes"
                                   :canvasID="i">
                </beta-doodle-video>
              </vuetify-card>
              </template>
          </renderless-component>
        </v-flex>
      </v-layout>

      <v-layout v-else-if="i%2 == 1" 
                :key="course['.key']" 
                :class="`px-${getSideMargin()}`" row wrap mt-0 mx-0 mb-5 pa-0>

        <v-flex :style="`flex-basis: calc((100% - ${getGapWidth()}px)/2)`">
          <renderless-component :whiteboardID="courses[i-1].introVideoID">
            <template slot-scope="slotProps">
              <vuetify-card :actionButtons="['COLLABORATE NOW', 'REPLAY DOODLE']"
                            @action="buttonName => handleAction(buttonName, courses[i-1], i-1)" 
                            :title="courses[i-1].courseNumber"
                            :description="courses[i-1].description">
                <beta-doodle-video v-if="slotProps.strokes"
                                   :ref="`doodle-video-${i-1}`"
                                   :strokes="slotProps.strokes"
                                   :canvasID="i-1">
                </beta-doodle-video>
              </vuetify-card>
              </template>
          </renderless-component>
        </v-flex>

        <v-flex :style="`flex-basis: calc((100% - ${getGapWidth()}px)/2); margin-left: ${getGapWidth()}px`">
          <renderless-component :whiteboardID="courses[i].introVideoID">
            <template slot-scope="slotProps">
              <vuetify-card :actionButtons="['COLLABORATE NOW', 'REPLAY DOODLE',]"
                            @action="buttonName => handleAction(buttonName, courses[i], i)" 
                            :title="courses[i].courseNumber" 
                            :description="courses[i].description">
                <beta-doodle-video v-if="slotProps.strokes"
                                   :ref="`doodle-video-${i}`"
                                   :strokes="slotProps.strokes"
                                   :canvasID="i">
                </beta-doodle-video>
              </vuetify-card>
            </template>
          </renderless-component>
        </v-flex>

      </v-layout>

      <!-- Edge case: last element -->
    

      <!-- Add invisible element -->

    </template>

  </v-container>
  </div>
</template>

<script>
import VoiceChat from "@/components/future/VoiceChat.vue"
import VuetifyCard from "@/components/VuetifyCard.vue"
import BetaDoodleVideo from "@/components/BetaDoodleVideo.vue"
import RenderlessComponent from "@/components/RenderlessComponent.vue"
import Experiment from "@/components/future/Experiment.vue"
import db from "@/database.js"
import sizeof from "sizeof"

export default {
  components: {
    VoiceChat,
    VuetifyCard,
    BetaDoodleVideo,
    RenderlessComponent,
    Experiment
  },
  data () {
    return {
      show: true,
      video: null,
      gapWidth: 40,
      audioURL: "",
      courses: []
    }
  },
  async created () {
    await this.$binding("courses", db.collection("classes"))
  },
  methods: {
    handleAction (buttonName, { courseNumber }, canvasID) {
      // console.log("buttonName =", buttonName)
      if (buttonName == "COLLABORATE NOW") {
        this.$router.push(`${courseNumber}/doodles`)
      } else if (buttonName == "FULL VIDEO") {
        console.log("FULLVIDEO()")
      } else if (buttonName == "REPLAY DOODLE") {
        const videoElem = this.$refs[`doodle-video-${canvasID}`][0]
        videoElem.quickplay()
      }
    },
    getGapWidth () {
      if (this.$vuetify.breakpoint.smAndDown) {
        return 0
      } else {
        return 40 
      }
    },
    getSideMargin () {
      if (this.$vuetify.breakpoint.xs) {
        return 0
      }
      if (this.$vuetify.breakpoint.sm) {
        return 2
      } else {
        return 5
      }
    }
  }
}
</script>

