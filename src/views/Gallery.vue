<template>
  <div>

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
    <template v-for="(course, i) in whiteboards">
      <!-- HANDLE EDGE CASE -->
      <v-layout v-if="i == (whiteboards.length - 1) && i%2 != 1" :key="whiteboards[i]['.key']" :class="`px-${getSideMargin()}`" row wrap mt-0 mx-0 mb-5 pa-0>
        <v-flex :style="`flex-basis: calc((100% - ${getGapWidth()}px)/2)`">
          <renderless-component :whiteboardID="whiteboards[i]['.key']">
            <template slot-scope="slotProps">
              <vuetify-card :actionButtons="['PREVIEW', 'FULL VIDEO']"
                            @action="buttonName => handleAction(buttonName, whiteboards[i], i)" 
                            @save-paragraph="newValue => saveParagraph(newValue, whiteboards[i])"
                            :title="whiteboards[i].title"
                            :description="`By ${whiteboards[i].authorName || 'Anonymous'}`"
                            :paragraph="whiteboards[i].paragraph"
                            :hasPermission="checkPermission(whiteboards[i])"
                            :hasDeleteButton="checkPermission(whiteboards[i])">
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
                :key="whiteboards[i]['.key']" 
                :class="`px-${getSideMargin()}`" row wrap mt-0 mx-0 mb-5 pa-0>
        <v-flex :style="`flex-basis: calc((100% - ${getGapWidth()}px)/2)`">
          <renderless-component :whiteboardID="whiteboards[i-1]['.key']">
            <template slot-scope="slotProps">
              <vuetify-card :actionButtons="['PREVIEW', 'FULL VIDEO']"
                            @action="buttonName => handleAction(buttonName, whiteboards[i-1], i-1)" 
                            @save-paragraph="newValue => saveParagraph(newValue, whiteboards[i-1])"
                            :title="whiteboards[i-1].title"
                            :description="`By ${whiteboards[i].authorName || 'Anonymous'}`"
                            :paragraph="whiteboards[i-1].paragraph"
                            :hasPermission="checkPermission(whiteboards[i])"
                            :hasDeleteButton="checkPermission(whiteboards[i])">
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
          <renderless-component :whiteboardID="whiteboards[i]['.key']">
            <template slot-scope="slotProps">
              <h1>{{ whiteboards[i].ownerName }}</h1>
              <vuetify-card :actionButtons="['PREVIEW', 'FULL VIDEO']"
                            @action="buttonName => handleAction(buttonName, whiteboards[i], i)" 
                            @save-paragraph="newValue => saveParagraph(newValue, whiteboards[i])"
                            :title="whiteboards[i].title" 
                            :description="`By ${whiteboards[i].authorName || 'Anonymous' }`"
                            :paragraph="whiteboards[i].paragraph"
                            :hasPermission="checkPermission(whiteboards[i])"
                            :hasDeleteButton="checkPermission(whiteboards[i])">
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
      whiteboards: [],
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
    await this.$binding("whiteboards", ref)
  },
  methods: {
    handleAction (buttonName, { courseNumber, ".key": videoID, audioPath }, canvasID) {
      if (buttonName == "FULL VIDEO") {
        this.currentVideoID = videoID 
        this.whiteboardPopup = true
      } else if (buttonName == "PREVIEW") {
        const videoElem = this.$refs[`doodle-video-${canvasID}`][0]
        videoElem.quickplay()
      } else if (buttonName == "delete") {
        this.deleteVideo(videoID, audioPath)
      }
    },
    async saveParagraph (newValue, { ".key": videoID }) {
      const ref = db.collection("whiteboards").doc(videoID)
      await ref.update({
        paragraph: newValue
      })
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
