<template>
  <div>
    <v-container grid-list-md fluid pt-5>
      <template v-for="(course, i) in courses">
        <!-- HANDLE EDGE CASE (FIRST OR LAST?) -->
        <v-layout 
          v-if="i == (courses.length - 1) && i%2 != 1" 
          :key="course['.key']" 
          :class="`px-${getSideMargin()}`" 
          row wrap mt-0 mx-0 mb-5 pa-0
        >
          <v-flex :style="`flex-basis: calc((100% - ${getGapWidth()}px)/2)`">
            <renderless-component :whiteboardID="courses[i].introVideoID">
              <template slot-scope="slotProps">
                <vuetify-card 
                  :actionButtons="['ENTER CLASS']"
                  @action="buttonName => handleAction(buttonName, courses[i], i)"
                  @save-paragraph="newValue => saveParagraph(newValue, courses[i])"
                  :title="courses[i].courseNumber"
                  :description="courses[i].description"
                  :paragraph="courses[i].paragraph"
                  :hasPermission="hasPermission"
                >
                  <beta-doodle-video 
                    v-if="slotProps.strokes"
                    :ref="`doodle-video-${i}`"
                    :strokes="slotProps.strokes"
                    :canvasID="`${i}`">
                  </beta-doodle-video>
                </vuetify-card>
              </template>
            </renderless-component>
          </v-flex>
        </v-layout>

        <!-- OTHERWISE RENDER PAIRS AT A TIME -->
        <v-layout 
          v-else-if="i%2 == 1" 
          :key="course['.key']" 
          :class="`px-${getSideMargin()}`" row wrap mt-0 mx-0 mb-5 pa-0
        >

          <v-flex :style="`flex-basis: calc((100% - ${getGapWidth()}px)/2)`">
            <renderless-component :whiteboardID="courses[i-1].introVideoID">
              <template slot-scope="slotProps">
                <vuetify-card 
                  :actionButtons="['ENTER CLASS']"
                  @action="buttonName => handleAction(buttonName, courses[i-1], i-1)" 
                  @save-paragraph="newValue => saveParagraph(newValue, courses[i-1])"
                  :title="courses[i-1].courseNumber"
                  :description="courses[i-1].description"
                  :paragraph="courses[i-1].paragraph"
                  :hasPermission="hasPermission"
                >
                  <beta-doodle-video 
                    v-if="slotProps.strokes"
                    :ref="`doodle-video-${i-1}`"
                    :strokes="slotProps.strokes"
                    :canvasID="`${i-1}`"
                  >
                  </beta-doodle-video>
                </vuetify-card>
              </template>
            </renderless-component>
          </v-flex>

          <v-flex :style="`flex-basis: calc((100% - ${getGapWidth()}px)/2); margin-left: ${getGapWidth()}px`">
            <renderless-component :whiteboardID="courses[i].introVideoID">
              <template slot-scope="slotProps">
                <vuetify-card 
                  :actionButtons="['ENTER CLASS']"
                  @action="buttonName => handleAction(buttonName, courses[i], i)" 
                  @save-paragraph="newValue => saveParagraph(newValue, courses[i])"
                  :title="courses[i].courseNumber" 
                  :description="courses[i].description"
                  :paragraph="courses[i].paragraph"
                  :hasPermission="hasPermission"
                >
                  <beta-doodle-video
                    v-if="slotProps.strokes"
                    :ref="`doodle-video-${i}`"
                    :strokes="slotProps.strokes"
                    :canvasID="`${i}`"
                  />
                </vuetify-card>
              </template>
            </renderless-component>
          </v-flex>

        </v-layout>
        <!-- Edge case: last element (considering adding an invisible element) -->
      </template>

    </v-container>
  </div>
</template>

<script>
import VuetifyCard from "@/components/VuetifyCard.vue"
import BetaDoodleVideo from "@/components/BetaDoodleVideo.vue"
import RenderlessComponent from "@/components/RenderlessComponent.vue"
import db from "@/database.js"

export default {
  components: {
    VuetifyCard,
    BetaDoodleVideo,
    RenderlessComponent,
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
  computed: {
    user () {
      return this.$store.state.user
    },
    hasPermission () {
      if (!this.user) {
        return false
      } else if (this.user.email != 'eltonlin1998@gmail.com') {
        return false 
      } else {
        return true
      }
    }
  },
  async created () {
    await this.$binding("courses", db.collection("classes"))
  },
  methods: {
    handleAction (buttonName, { courseNumber }, canvasID) {
      if (buttonName == "ENTER CLASS") {
        this.$router.push(`${courseNumber}/gallery`)
      } else if (buttonName == "FULL VIDEO") {
        
      } else if (buttonName == "PREVIEW DOODLE") {
        const videoElem = this.$refs[`doodle-video-${canvasID}`][0]
        videoElem.quickplay()
      }
    },
    saveParagraph (newValue, { courseNumber }) {
      const ref = db.collection("classes").doc(courseNumber)
      ref.update({
        paragraph: newValue
      })
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

