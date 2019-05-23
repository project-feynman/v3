<template>
  <div id="workspace">
    <v-container v-if="user && workspace && whiteboard" fluid class="pa-0">
      <div class="text-xs-center">
        <div>workspace.hasAudioRoom = {{ workspace.hasAudioRoom }}</div>
      </div>
      <video-chat 
        :hasAudioRoom="workspace.hasAudioRoom"
        :workspaceID="workspace['.key']"
        @open-room="updateHasAudioRoom()"
      />

      <!-- THIS IS THE WHITEBOARD THAT IS NOT FULLSCREEN -->
      <whiteboard
          v-if="loadCanvas"
          ref="whiteboard"
          :whiteboardID="workspace.whiteboardID"
          :isRecording="isRecording"
          :isAnswered="whiteboard.isAnswered"
          :disableTouch="disableTouch"
          :color="color"
          :colors="colors"
          :lineWidth="lineWidth"
      ></whiteboard>

      <!-- THIS IS THE FULLSCREEN WHITEBOARD -->
      <v-dialog v-model="whiteboardPopup" fullscreen hide-overlay>
        <v-card v-if="whiteboardPopup">
          <!-- SAVE VIDEO POPUP -->
          <save-video-popup
            v-model="saveVideoPopup"
            @pre-save-explanation="videoTitle => handleSaving(videoTitle)"
            fullscreen
          />
          <v-toolbar id="whiteboard-toolbar" color="grey">
            <v-spacer></v-spacer>
            <v-toolbar-items>
              <template v-if="!whiteboard.isAnswered">
                <swatches
                  v-model="color"
                  :colors="colors"
                  inline
                  background-color="rgba(0, 0, 0, 0)"
                  swatch-size="55"
                  :wrapper-style="{ paddingTop: '0px', paddingBottom: '0px', paddingLeft: '40px', height: '30px' }"
                ></swatches>
                <v-btn @click="useEraser()">
                  ERASER
                </v-btn>
                <v-btn @click="clearWhiteboard()">
                  CLEAR BOARD
                </v-btn>
                <v-btn @click="toggleDisableTouch()">
                  {{ disableTouch ? "ENABLE TOUCH" : "DISABLE TOUCH"}}
                </v-btn>
                <v-btn @click="saveDoodle()">
                  SAVE DOODLE
                </v-btn>
                <v-btn
                  v-if="!isRecording"
                  @click="startRecording()"
                  color="pink white--text"
                >
                  RECORD VIDEO
                </v-btn>
                <v-btn v-else @click="stopRecording()" color="pink white--text">
                  STOP VIDEO
                </v-btn>
              </template>
              <template v-else>
                <v-btn @click="quickplay()">
                  PREVIEW
                </v-btn>
                <v-btn @click="retryAnswer()">
                  RETRY
                </v-btn>
                <v-btn @click="saveVideoPopup = true" class="pink white--text">
                  SAVE VIDEO
                </v-btn>
              </template>
              <v-btn dark flat @click="handleExit()">EXIT</v-btn>
            </v-toolbar-items>
          </v-toolbar>

          <whiteboard 
            v-if="loadCanvas"
            ref="whiteboard"
            :whiteboardID="workspace.whiteboardID"
            :workspace="workspace"
            :isRecording="isRecording"
            :isAnswered="whiteboard.isAnswered"
            :disableTouch="disableTouch"
            :color="color"
            :colors="colors"
            :lineWidth="lineWidth"
          ></whiteboard>

          <audio-recorder
            v-show="false"
            ref="audio-recorder"
            :audioURL="workspace.audioURL"
            :audioPath="workspace.audioPath"
            @start-recording="isRecording = true"
            @file-uploaded="audio => saveFileReference(audio)"
          />

        </v-card>
      </v-dialog>
    </v-container>
  </div>
</template>

<script>
import firebase from 'firebase/app'
import "firebase/firestore"
import db from "@/database.js"
import Whiteboard from "@/components/Whiteboard.vue"
import SaveVideoPopup from "@/components/SaveVideoPopup.vue"
import AudioRecorder from "@/components/AudioRecorder.vue"
import VideoChat from "@/components/VideoChat.vue"
import Swatches from "vue-swatches"
import "vue-swatches/dist/vue-swatches.min.css"
import slugify from "slugify"

import { mapState } from "vuex"

export default {
  components: {
    Whiteboard,
    SaveVideoPopup,
    VideoChat,
    AudioRecorder,
    Swatches,
  },
  computed: {
    ...mapState(['user']),
    simpleUser() {
      return {
        email: this.user.email,
        uid: this.user.uid
      }
    }
  },
  data() {
    return {
      saveVideoPopup: false,
      saveSilently: false,
      whiteboardPopup: false,
      isRecording: false,
      disableTouch: true,
      workspace: null,
      whiteboard: null,
      whiteboardRef: null,
      loadCanvas: false,
      color: "#F64272",
      lineWidth: 2,
      colors: ["#F64272", "orange", "#0AF2F2"],
      prevWorkspaceRef: null
    };
  },
  watch: {
    $route: {
      handler: 'bindVariables',
      immediate: true
    },
    color () {
      // bad - high surface area for bugs
      if (this.color != "rgb(62, 66, 66)") {
        this.lineWidth = 2
      }
    }
  },
  created () {
    // necessary for canvas to not be invisible during initial render
    setTimeout(() => (this.loadCanvas = true), 0)
    this.$root.$on("open-whiteboard", () => this.whiteboardPopup = true)
  },
  async beforeDestroy () {
    // when the user switches to any other place besides another workspace
    this.cleanUpPrevWorkspace()
  },
  methods: {
    saveDoodle() {
      this.saveSilently = true 
      this.saveVideoPopup = true
    },
    saveVideo() {
      this.saveSilently = false
      this.saveVideoPopup = true
    },
    async bindVariables () {
      if (this.prevWorkspaceRef) {
        await this.cleanUpPrevWorkspace()
      }
      const userUID = this.$route.params.id
      const classID = this.$route.params.class_id
      const workspaceRef = db.collection('classes').doc(classID).collection('workspaces').doc(userUID)
      await this.$binding('workspace', workspaceRef)
      this.whiteboardRef = db.collection('whiteboards').doc(this.workspace.whiteboardID)
     
      this.$binding('whiteboard', this.whiteboardRef)
      // console.log('this.whiteboard =', this.whiteboard)
      this.setDisconnectHook()
      this.prevWorkspaceRef = workspaceRef
    },
    async cleanUpPrevWorkspace () {
      const promise = new Promise(async (resolve, reject) => {
        await this.prevWorkspaceRef.update({
          members: firebase.firestore.FieldValue.arrayRemove(this.simpleUser)
        })
        const workspaceDoc = await this.prevWorkspaceRef.get()
        if (workspaceDoc.data().members.length == 0) {
          await this.prevWorkspaceRef.update({
            hasAudioRoom: false
          })
        }
        resolve()
      })
      return promise
    },
    setDisconnectHook() {
      // have a firebase workspace as well to mirror the participants data
      const classID = this.$route.params.class_id 
      const workspaceID = this.$route.params.id
      const workspaceRef = db.collection('classes').doc(classID).collection('workspaces').doc(workspaceID)
      const firebaseClassID = classID.replace('.', '-')
      const firebaseRef = firebase.database().ref(`/workspace/${firebaseClassID}/${workspaceID}`)

      firebase.database().ref('.info/connected').on('value', async snapshot => {
        if (snapshot.val() == false) { 
          // do nothing 
        } else {
          // wait till server successfully processes the onDisconnectHook()
          await firebaseRef.onDisconnect().set(this.simpleUser) 
          // then update the firestore directly (much faster)
          workspaceRef.update({
            members: firebase.firestore.FieldValue.arrayUnion(this.simpleUser)
          })
          // reset it (otherwise setting the user is not actually triggering any changes)
          firebaseRef.set({ // if I just reset it to a truly empty object, Firestore does not detect the change for some reason
            email: '',
            uid: ''
          })
        }
      })
    },
    handleExit() {
      this.whiteboardPopup = false
      this.$root.$emit("whiteboard-closed")
    },
    clearWhiteboard() {
      const whiteboard = this.$refs['whiteboard']
      whiteboard.deleteStrokesSubcollection()
    },
    toggleDisableTouch() {
      this.disableTouch = !this.disableTouch
    },
    useEraser() {
      this.color = "rgb(62, 66, 66)"
      this.lineWidth = 18
    },
    async retryAnswer() {
      const whiteboard = this.$refs["whiteboard"]
      whiteboard.currentTime = 0;
      await this.whiteboardRef.update({
        isAnswered: false
      })
    },
    updateHasAudioRoom () {
      this.prevWorkspaceRef.update({
        hasAudioRoom: true
      })
    },
    startRecording() {
      const audioRecorder = this.$refs["audio-recorder"]
      this.isRecording = true
      audioRecorder.startRecording()
    },
    stopRecording () {
      this.isRecording = false
      const whiteboard = this.$refs["whiteboard"]
      const audioRecorder = this.$refs["audio-recorder"]
      whiteboard.removeTouchEvents()
      audioRecorder.stopRecording()
      this.whiteboardRef.update({
        isAnswered: true
      })
    },
    playVideo () {
      const audioRecorder = this.$refs['audio-recorder']
      const whiteboard = this.$refs['whiteboard']
      whiteboard.sortStrokesByTimestamp()
      whiteboard.playVisual(audioRecorder.getAudioTime)
      audioRecorder.playAudio()
    },
    quickplay () {
      const whiteboard = this.$refs['whiteboard']
      whiteboard.quickplay()
    },
    async saveFileReference({ url, path }) {
      await this.whiteboardRef.update({
        audioURL: url,
        audioPath: path
      })
    },
    async handleSaving(videoTitle) {
      // mark the whiteboard as saved 
      const whiteboardRef = db.collection('whiteboards').doc(this.workspace.whiteboardID)
      whiteboardRef.update({
        isSaved: true
      })
      // create a new video document that points to the whiteboard
      const classID = this.$route.params.class_id
      const videoID = slugify(videoTitle, {
        replacement: '-',
        lower: true
      })
      const docRef = await db.collection('classes').doc(classID).collection('videos').doc(videoID)

      const videoObj = {
        title: videoTitle,
        whiteboardID: this.workspace.whiteboardID,
        authorUID: this.user.uid || 'Anonymous',
        authorName: this.user.name || 'Anonymous'
      }

      if (!this.saveSilently) {
        if (this.whiteboard.audioURL && this.whiteboard.audioPath) {
          videoObj.audioURL = this.whiteboard.audioURL
          videoObj.audioPath = this.whiteboard.audioPath
        }
      }
 
      docRef.set(videoObj)

      // initialize a new whiteboard for the workspace
      const workspaceID = this.$route.params.id
      const newWhiteboardRef = await db.collection('whiteboards').add({ isAnswered: false })
      const workspaceRef = db.collection('classes').doc(classID).collection('workspaces').doc(workspaceID)
      workspaceRef.update({
        whiteboardID: newWhiteboardRef.id
      })
      console.log('new whiteboard ID =', newWhiteboardRef.id)
      this.$root.$emit('audio-uploaded', docRef.id)
    }
  }
};
</script>
