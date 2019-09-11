<template>
  <div>
  <!-- voice chat -->
  <!-- <voice-chat></voice-chat> -->

  <!-- overlay experiment -->
  <!-- <experiment/> -->

  <v-dialog v-model="whiteboardPopup" fullscreen hide-overlay>
      <v-card v-if="whiteboardPopup">
        <div class="text-xs-center">
          <v-btn @click="whiteboardPopup = false">EXIT</v-btn>
        </div>
        <doodle-video :videoID="currentVideoID"/>
        <!-- <whiteboard v-if="loadCanvas"
                    ref="whiteboard"
                    :whiteboardID="workspace.whiteboardID"
                    @close-whiteboard="whiteboardPopup = false"/> -->
      </v-card>
    </v-dialog>

  <v-container grid-list-md fluid pt-5>
    <template v-for="(course, i) in courses">
      <!-- HANDLE EDGE CASE -->
      <v-layout v-if="i == (courses.length - 1) && i%2 != 1" :key="courses[i]['.key']" :class="`px-${getSideMargin()}`" row wrap mt-0 mx-0 mb-5 pa-0>
        <v-flex :style="`flex-basis: calc((100% - ${getGapWidth()}px)/2)`">
          <renderless-component :whiteboardID="courses[i]['.key']">
            <template slot-scope="slotProps">
              <vuetify-card :actionButtons="['QUICKPLAY', 'FULL VIDEO']"
                            @action="buttonName => handleAction(buttonName, courses[i], i)" 
                            :title="courses[i].title"
                             :description="`By ${courses[i].authorName || 'Anonymous'}`"
                            :hasDeleteButton="checkPermission(courses[i])">
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
                :key="courses[i]['.key']" 
                :class="`px-${getSideMargin()}`" row wrap mt-0 mx-0 mb-5 pa-0>
        <v-flex :style="`flex-basis: calc((100% - ${getGapWidth()}px)/2)`">
          <renderless-component :whiteboardID="courses[i-1]['.key']">
            <template slot-scope="slotProps">
              <vuetify-card :actionButtons="['QUICKPLAY', 'FULL VIDEO']"
                            @action="buttonName => handleAction(buttonName, courses[i-1], i-1)" 
                            :title="courses[i-1].title"
                            :description="`By ${courses[i].authorName || 'Anonymous'}`"
                            :hasDeleteButton="checkPermission(courses[i])">
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
          <renderless-component :whiteboardID="courses[i]['.key']">
            <template slot-scope="slotProps">
              <h1>{{ courses[i].ownerName }}</h1>
              <vuetify-card :actionButtons="['QUICKPLAY', 'FULL VIDEO']"
                            @action="buttonName => handleAction(buttonName, courses[i], i)" 
                            :title="courses[i].title" 
                            :description="`By ${courses[i].authorName || 'Anonymous' }`"
                            :hasDeleteButton="checkPermission(courses[i])">
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

    </template>

  </v-container>
  </div>
</template>

<script>
import VoiceChat from "@/components/future/VoiceChat.vue"
import VuetifyCard from "@/components/VuetifyCard.vue"
import BetaDoodleVideo from "@/components/BetaDoodleVideo.vue"
import RenderlessComponent from "@/components/RenderlessComponent.vue"
import DoodleVideo from "@/views/DoodleVideo.vue"
import db from "@/database.js"
import firebase from "firebase/app"
import "firebase/functions"
import "firebase/storage"

export default {
  components: {
    VoiceChat,
    VuetifyCard,
    BetaDoodleVideo,
    RenderlessComponent,
    DoodleVideo
  },
  data () {
    return {
      show: true,
      video: null,
      audioURL: "",
      courses: [],
      whiteboardPopup: false,
      currentVideoID: ""
    }
  },
  computed: {
    user () {
      return this.$store.state.user
    }
  },
  async created () {
    // get all whiteboards associated with a course 
    const classID = this.$route.params.class_id
    const ref = db.collection("whiteboards").where("fromClass", "==", classID)
    await this.$binding("courses", ref)
  },
  methods: {
    handleAction (buttonName, { courseNumber, ".key": videoID, audioPath }, canvasID) {
      if (buttonName == "FULL VIDEO") {
        this.currentVideoID = videoID 
        this.whiteboardPopup = true
        // console.log("FULLVIDEO()")
      } else if (buttonName == "QUICKPLAY") {
        const videoElem = this.$refs[`doodle-video-${canvasID}`][0]
        videoElem.quickplay()
      } else if (buttonName == "delete") {
        console.log("audioPath =", audioPath)
        this.deleteVideo(videoID, audioPath)
      }
    },
    async deleteVideo (ID, audioPath) {
      const recursiveDelete = firebase.functions().httpsCallable('recursiveDelete')
      recursiveDelete({ path: `whiteboards/${ID}` })
      // delete audio 
      if (audioPath) {
        const storageRef = firebase.storage().ref()
        const audioFileRef = storageRef.child(`recordings/${audioPath}`)
        audioFileRef.delete()
      }      
    },
    checkPermission (video) {
      console.log("video =", video)
      console.log("this.user =", this.user)
      if (!this.user) {
        return false
      } 
      if (video.authorUID == this.user.uid || this.user.email == "eltonlin1998@gmail.com") {
        return true 
      } 
      return false 
    },
    getGapWidth () {
      if (this.$vuetify.breakpoint.smAndDown) {
        return 0
      } else {
        return 30
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
