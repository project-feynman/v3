<template>
  <div>
    <!-- VUETIFY TABS -->
    <template v-if="classDoc != {}">
      <vuetify-tabs 
        v-if="classDoc.tabs"
        :tabs="classDoc.tabs"
        @tabs-rename="newValues => renameTabs(newValues)"
      >
      </vuetify-tabs>
    </template>
  </div>
</template>

<script>
import VoiceChat from "@/components/future/VoiceChat.vue"
import VuetifyCard from "@/components/VuetifyCard.vue"
import BetaDoodleVideo from "@/components/BetaDoodleVideo.vue"
import RenderlessComponent from "@/components/RenderlessComponent.vue"
import DoodleVideo from "@/views/DoodleVideo.vue"
import VuetifyTabs from "@/components/VuetifyTabs.vue"
import db from "@/database.js"
import firebase from "firebase/app"
import "firebase/functions"
import "firebase/storage"

export default {
  components: {
    VoiceChat,
    VuetifyCard,
    VuetifyTabs,
    BetaDoodleVideo,
    RenderlessComponent,
    DoodleVideo
  },
  data () {
    return {
      video: null,
      audioURL: "",
      whiteboards: [],
      classDoc: {},
      whiteboardPopup: false,
      currentVideoID: ""
    }
  },
  computed: {
    user () {
      return this.$store.state.user
    }
  },
  created () {
    // get all whiteboards associated with a course 
    const classID = this.$route.params.class_id
    const ref = db.collection("whiteboards").where("fromClass", "==", classID)
                                            .where("title", "==", "Sun, Lake and Mountain")
    const classRef = db.collection("classes").doc(classID)
    this.$binding("whiteboards", ref)
    this.$binding("classDoc", classRef)
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
    renameTabs (newValues) {
      const ref = db.collection("classes").doc(this.$route.params.class_id)
      console.log("newValues =", newValues)
      ref.update({
        tabs: newValues
      })
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
