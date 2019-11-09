<template>
  <div>
    <!-- whiteboard popup -->
    <v-dialog v-model="whiteboardPopup" fullscreen hide-overlay>
      <v-card v-if="whiteboardPopup">
        <div class="text-xs-center">
          <v-btn @click="whiteboardPopup = false">EXIT</v-btn>
        </div>
        <doodle-video :videoID="currentVideoID"/>
      </v-card>
    </v-dialog>

    <v-container grid-list-md fluid pt-5 style="background-color: rgb(225, 233, 247)">
      <template v-for="(video, i) in whiteboards">
        <fetch-strokes :key="video['.key']" :whiteboardID="video['.key']">
          <template slot-scope="{ strokes }">
            <vuetify-card 
              :actionButtons="['FULL VIDEO', 'QUICKPLAY', `HELPFUL (${video.likes || 0})`]"
              @action="buttonName => handleAction(buttonName, whiteboards[i], i)" 
              @save-paragraph="newValue => saveParagraph(newValue, whiteboards[i])"
              @save-tab-number="newValue => handleTabChange(newValue, whiteboards[i])"
              :title="whiteboards[i].title"
              :description="`By ${whiteboards[i].authorName || 'Anonymous'}`"
              :paragraph="whiteboards[i].paragraph"
              :hasPermission="checkPermission(whiteboards[i])"
              :tabs="tabs"
              :tabNumber="tabNumber"
              class="mb-5"
            >
              <template v-slot:card-actions>
                <!-- <v-btn @click="loadAudio(video)">LOAD AUDIO</v-btn> -->
           
                  <!-- <h1>WHY</h1>
                  <template v-if="blob">
                    <h1>BLOB = {{ blob }}</h1>
                    <audio-recorder :audioBlob="blob"></audio-recorder>
                  </template> -->
          
              </template>
              <beta-doodle-video 
                v-if="strokes"
                :ref="`doodle-video-${i}`"
                :strokes="strokes"
                :canvasID="`${tabNumber}-${i}`"
              />
              
            </vuetify-card>
          </template>
        </fetch-strokes>
        <!-- <v-layout 
          v-if="i == (whiteboards.length - 1) && i%2 != 1" 
          :key="whiteboards[i]['.key']" :class="`px-${getSideMargin()}`" 
          row wrap mt-0 mx-0 mb-5 pa-0
        >
          <v-flex :style="`flex-basis: calc((100% - ${getGapWidth()}px)/2)`">
            <get-strokes-from-id
 :whiteboardID="whiteboards[i]['.key']">
              <template slot-scope="slotProps">
                <vuetify-card 
                  :actionButtons="['FULL VIDEO', 'QUICKPLAY']"
                  @action="buttonName => handleAction(buttonName, whiteboards[i], i)" 
                  @save-paragraph="newValue => saveParagraph(newValue, whiteboards[i])"
                  @tab-change="newValue => handleTabChange(newValue, whiteboards[i])"
                  @save-tab-number="newValue => handleTabChange(newValue, whiteboards[i])"
                  :title="whiteboards[i].title"
                  :description="`By ${whiteboards[i].authorName || 'Anonymous'}`"
                  :paragraph="whiteboards[i].paragraph"
                  :hasPermission="checkPermission(whiteboards[i])"
                  :tabs="tabs"
                  :tabNumber="tabNumber"
                >
             
                  <beta-doodle-video 
                    v-if="slotProps.strokes"
                    :ref="`doodle-video-${i}`"
                    :strokes="slotProps.strokes"
                    :canvasID="`${tabNumber}-${i}`">
                  </beta-doodle-video>
                </vuetify-card>
              </template>
            </get-strokes-from-id
>
          </v-flex>
        </v-layout>

        <v-layout 
          v-else-if="i%2 == 1" 
          :key="whiteboards[i]['.key']" 
          :class="`px-${getSideMargin()}`" row wrap mt-0 mx-0 mb-5 pa-0
        >
          <v-flex :style="`flex-basis: calc((100% - ${getGapWidth()}px)/2)`">
            <get-strokes-from-id
 :whiteboardID="whiteboards[i-1]['.key']">
              <template slot-scope="slotProps">
                <vuetify-card 
                  :actionButtons="['FULL VIDEO', 'QUICKPLAY']"
                  @action="buttonName => handleAction(buttonName, whiteboards[i-1], i-1)" 
                  @save-paragraph="newValue => saveParagraph(newValue, whiteboards[i-1])"
                  @save-tab-number="newValue => handleTabChange(newValue, whiteboards[i-1])"
                  :title="whiteboards[i-1].title"
                  :description="`By ${whiteboards[i].authorName || 'Anonymous'}`"
                  :paragraph="whiteboards[i-1].paragraph"
                  :hasPermission="checkPermission(whiteboards[i])"
                  :tabs="tabs"
                  :tabNumber="tabNumber"
                >
                  <beta-doodle-video 
                    v-if="slotProps.strokes"
                    :ref="`doodle-video-${i-1}`"
                    :strokes="slotProps.strokes"
                    :canvasID="`${tabNumber}-${i-1}`"
                  />
                </vuetify-card>
                </template>
            </get-strokes-from-id
>
          </v-flex>

          <v-flex :style="`flex-basis: calc((100% - ${getGapWidth()}px)/2); margin-left: ${getGapWidth()}px`">
            <get-strokes-from-id
 :whiteboardID="whiteboards[i]['.key']">
              <template slot-scope="slotProps">
                <h1>{{ whiteboards[i].ownerName }}</h1>
                <vuetify-card 
                  :actionButtons="['FULL VIDEO', 'QUICKPLAY']"
                  @action="buttonName => handleAction(buttonName, whiteboards[i], i)" 
                  @save-paragraph="newValue => saveParagraph(newValue, whiteboards[i])"
                  @save-tab-number="newValue => handleTabChange(newValue, whiteboards[i])"
                  :title="whiteboards[i].title" 
                  :description="`By ${whiteboards[i].authorName || 'Anonymous' }`"
                  :paragraph="whiteboards[i].paragraph"
                  :hasPermission="checkPermission(whiteboards[i])"
                  :tabs="tabs"
                  :tabNumber="tabNumber"
                >
                  <beta-doodle-video 
                    v-if="slotProps.strokes"
                    :ref="`doodle-video-${i}`"
                    :strokes="slotProps.strokes"
                    :canvasID="`${tabNumber}-${i}`"
                  >
                  </beta-doodle-video>
                </vuetify-card>
              </template>
            </get-strokes-from-id
>
          </v-flex>

        </v-layout> -->
      </template>
    </v-container>
  </div>
</template>

<script>
import VuetifyCard from "@/components/VuetifyCard.vue"
import BetaDoodleVideo from "@/components/BetaDoodleVideo.vue"
import FetchStrokes from "@/components/FetchStrokes.vue"
import AudioRecorder from "@/components/AudioRecorder.vue"
import DoodleVideo from "@/views/DoodleVideo.vue"
import VuetifyTabs from "@/components/VuetifyTabs.vue"
import db from "@/database.js"
import firebase from "firebase/app"
import "firebase/functions"
import "firebase/storage"
import axios from "axios"

export default {
  props: {
    tabNumber: Number,
    tabs: Array
  },
  components: {
    VuetifyCard,
    VuetifyTabs,
    BetaDoodleVideo,
    FetchStrokes,
    DoodleVideo,
    AudioRecorder
  },
  data () {
    return {
      blob: null,
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
    this.fetchVideos()
    // const classID = this.$route.params.class_id
    // const baseRef = db.collection("whiteboards").where("fromClass", "==", classID)
    // let videosRef = {} 
    // if (this.tabNumber != null) {
    //   videosRef = baseRef.where("tabNumber", "==", this.tabNumber)
    // } else {
    //   videosRef = baseRef.where("tabNumber", "==", null)
    // }
    // videosRef.get().then(snapshotQuery => {
    //   snapshotQuery.forEach(doc => {
    //     this.whiteboards.push({".key": doc.id, ...doc.data()})
    //   })
    // })
  },
  methods: {
    fetchVideos () {
      this.whiteboards = []
      const classID = this.$route.params.class_id
      const baseRef = db.collection("whiteboards").where("fromClass", "==", classID)
      let videosRef = {} 
      if (this.tabNumber != null) {
        videosRef = baseRef.where("tabNumber", "==", this.tabNumber)
      } else {
        videosRef = baseRef.where("tabNumber", "==", null)
      }
      videosRef.get().then(snapshotQuery => {
        snapshotQuery.forEach(doc => {
          this.whiteboards.push({".key": doc.id, ...doc.data()})
        })
      })
    },
    async loadAudio (video) {
      var storage = firebase.storage()
      const ref = storage.ref("recordings/05656c87-5fa4-6dcb-093c-a789a6dc7fcc")
      const URL = await ref.getDownloadURL()
      const response = await axios.get(URL)
      console.log("audio response =", response)
      this.blob = response.data
      // ref.getDownloadURL().then(URL => {
      //   axios
      //     .get(URL)
      //     .then(response => {
      //       // console.log('response =', response)
      //       this.blob = response
      //     })
        // var xhr = new XMLHttpRequest();
        // xhr.responseType = 'blob';
        // xhr.onload = (event) => {
        //   var blob = xhr.response;
        //   console.log("xhr.response =", xhr.response)
        //   this.blob = blob 
        // };
        // xhr.open('GET', URL);
        // xhr.send();
    
      // var storage = firebase.storage();
      // var pathReference = storage.ref('recordings/978b6e8b-5f53-f809-f10e-e6d')
      // now what do you do? 
    },
    async handleTabChange (newValue, { ".key": videoID }) {
      const ref = db.collection("whiteboards").doc(videoID)
      await ref.update({
        tabNumber: newValue
      })
      this.fetchVideos()
    },
    async handleAction (buttonName, { courseNumber, ".key": videoID, audioPath }, canvasID) {
      if (buttonName == "FULL VIDEO") {
        this.currentVideoID = videoID 
        this.whiteboardPopup = true
      } else if (buttonName == "QUICKPLAY") {
        const videoElem = this.$refs[`doodle-video-${canvasID}`][0]
        videoElem.quickplay()
      } else if (buttonName == "DELETE") {
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
      await recursiveDelete({ path: `whiteboards/${ID}` })
      // delete audio 
      if (audioPath) {
        const storageRef = firebase.storage().ref()
        const audioFileRef = storageRef.child(`recordings/${audioPath}`)
        await audioFileRef.delete()
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
      return this.$vuetify.breakpoint.smAndDown ? 0 : 30
    },
    getSideMargin () {
      if (this.$vuetify.breakpoint.xs) {
        return 0
      }
      return this.$vuetify.breakpoint.sm ? 2 : 5 
    }
  }
}
</script>
