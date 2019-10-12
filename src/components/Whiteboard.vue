<template>
  <div id="whiteboard">
    <!-- SAVING POPUP -->
    <whiteboard-save-popup 
      v-model="saveVideoPopup"
      @pre-save-explanation="videoTitle => handleSaving(videoTitle)"
      fullscreen
    />

    <!-- WHITEBOARD BUTTONS -->
    <v-toolbar v-if="!hideToolbar" id="whiteboard-toolbar" color="white">
      <v-app-bar-nav-icon @click="toggleSideNav()"></v-app-bar-nav-icon>
      <v-spacer></v-spacer>
      <v-toolbar-items v-if="whiteboardDoc">
        <template v-if="!whiteboardDoc.isAnswered">
          <swatches 
            v-model="color"
            :colors="colors"
            :wrapper-style="{ paddingTop: '0px', paddingBottom: '0px', paddingLeft: '40px', height: '30px' }"
            inline
            background-color="rgba(0, 0, 0, 0)"
            swatch-size="50"
          />
          <!-- <v-btn @click="disableTouch = !disableTouch">
            {{ disableTouch ? "ENABLE TOUCH" : "DISABLE TOUCH"}}
          </v-btn> -->
          <v-btn 
            v-if="!isRecording"
            @click="deleteStrokesSubcollection()"
            color="red darken-2 white--text"
          >
            CLEAR
            <v-icon dark right>clear</v-icon>
          </v-btn>
          <template v-if="!isRecording">
            <v-btn @click="saveDoodle()">
              SAVE 
              <v-icon dark right>save</v-icon>
            </v-btn>
            <v-btn @click="startRecording()" color="pink white--text" dark>
              RECORD
              <v-icon dark right>fiber_manual_record</v-icon>
            </v-btn>
          </template>
          <v-btn v-else @click="stopRecording()" color="pink white--text">
            STOP VIDEO
          </v-btn>
        </template>
        <template v-else>
          <v-btn @click="initReplayLogic()">PREVIEW</v-btn>
          <v-btn @click="retryAnswer()">RETRY</v-btn>
          <v-btn @click="saveVideoPopup = true" :disabled="!hasUploadedAudio" class="pink white--text">
            SAVE VIDEO
          </v-btn>
        </template>
        <!-- <v-btn @click="handleExit()" dark text>EXIT</v-btn> -->
      </v-toolbar-items>
    </v-toolbar>

    <!-- "@start-recording" is necessary because the audio-recorder can't 
    start recording instantaneously - and if we false believe it is, then `getAudioTime` will be 
    null-->
    <audio-recorder 
      v-if="whiteboardDoc"
      v-show="false"
      ref="audio-recorder"
      :audioURL="whiteboardDoc.audioURL"
      :audioPath="whiteboardDoc.audioPath"
      @start-recording="isRecording = true"
      @file-uploaded="audio => saveFileReference(audio)"
    />

    <!-- WHITEBOARD -->
    <canvas id="myCanvas" style="background-color: rgb(62, 66, 66)"/>
    <!-- <canvas id="myCanvas" style="height: 90vh; background-color: rgb(62, 66, 66)"/> -->
  </div>
</template>

<script>
import { mapState } from 'vuex'
import firebase from 'firebase/app'
import 'firebase/functions'
import slugify from 'slugify'
import db from '@/database.js'
import DrawMethods from '@/mixins/DrawMethods.js'
import Swatches from 'vue-swatches'
import 'vue-swatches/dist/vue-swatches.min.css'
import WhiteboardSavePopup from '@/components/WhiteboardSavePopup.vue'
import AudioRecorder from '@/components/AudioRecorder.vue'

export default {
  props: {
    whiteboardID: String,
    hideToolbar: Boolean
  },
  components: {
    WhiteboardSavePopup,
    AudioRecorder,
    Swatches
  },
  mixins: [DrawMethods],
  computed: {
    ...mapState(['user']),
    author () {
      if (this.user) {
        if (this.user.name) {
          return {
            name: this.user.name,
            uid: this.user.uid
          }
        } else {
          return {
            email: this.user.email,
            uid: this.user.uid
          }
        }
      } else {
        return {
          name: 'Anonymous',
          uid: 'Anonymous'
        }
      }
    }
  },
  data () {
    return {
      whiteboardDoc: null,
      color: '#0AF2F2',
      lineWidth: 2,
      colors: ['#F64272', 'orange', '#0AF2F2', 'rgb(62, 66, 66)'],
      disableTouch: false,
      saveSilently: false,
      saveVideoPopup: false,
      isRecording: false,
      strokesRef: null,
      stylus: false, 
      allStrokes: [],
      currentStroke: [],
      canvas: null,
      ctx: null,
      timer: null,
      getCurrentTime: null,
      currentTime: 0,
      startTime: 0,
      endTime: null,
      touchX: null,
      touchY: null,
      lastX: -1,
      lastY: -1,
      unsubscribe: null,
      redrawTimeout: null, // needed for mixins/DrawMethods.js TODO: consider declaring it in the data () section of DrawMethods.js instead,
      hasUploadedAudio: false,
      clearRectTimeout: null
    }
  },
  watch: {
    whiteboardID: {
      handler: 'initData',
      immediate: true
    },
    // detects when user switches from the eraser back to drawing (TODO: high surface area for bugs)
    color () {
      console.log("color changed to =", this.color)
      if (this.color != 'rgb(62, 66, 66)') { // eraser color stroke width is larger
        this.lineWidth = 2
        this.setStyle(this.color, this.lineWidth)
      } else {
        this.lineWidth = 18
        this.setStyle(this.color, this.lineWidth)
      }
    },
    isRecording () {
      if (this.isRecording) {
        this.startTimer()
      } else {
        this.stopTimer()
      }
    },
    whiteboardDoc (newVal) {
      // TODO: this gets triggered 2x more often than I expect, find out why
      if (newVal) {
        if (!newVal.isAnswered || this.canvas || this.ctx) {
          this.initTouchEvents()
        }
      }
    },
  },
  mounted () {
    // the mounted() hook is never called for subsequent switches between whiteboards
    const whiteboardRef = db.collection('whiteboards').doc(this.whiteboardID)
    this.canvas = document.getElementById('myCanvas')
    this.ctx = this.canvas.getContext('2d')
    // new redraw code
    this.canvas.width = document.documentElement.clientWidth 
    this.canvas.height = 0.9 * document.documentElement.clientHeight
    this.rescaleCanvas()
    window.addEventListener('resize', () => { 
      this.canvas.width = document.documentElement.clientWidth 
      this.rescaleCanvas()
    }, false)
    this.initTouchEvents()
    this.continuouslySyncBoardWithDB()
    this.$root.$on("side-nav-toggled", sideNavOpened => {
      if (sideNavOpened) {
        this.canvas.width = document.documentElement.clientWidth
      } else {
        this.canvas.width = document.documentElement.clientWidth
      }
      this.rescaleCanvas()
    })
  },
  methods: {
    toggleSideNav () {
      this.$root.$emit("toggle-side-nav")
    },
    takePicture () {
      const dataURL = this.canvas.toDataURL()
    },
    initData () {
      if (!this.whiteboardID) {
        return
      }
      const whiteboardRef = db.collection('whiteboards').doc(this.whiteboardID)
      this.$binding('whiteboardDoc', whiteboardRef)
      this.strokesRef = whiteboardRef.collection('strokes')
      // visually wipe previous drawings
      if (this.ctx) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
      }
      this.allStrokes = [] 
      if (this.unsubscribe) {
        this.unsubscribe() 
      }
      this.continuouslySyncBoardWithDB() 
    },
    continuouslySyncBoardWithDB () {
      this.unsubscribe = this.strokesRef.orderBy('strokeNumber').onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added') {
            const stroke = change.doc.data()
            // check if local strokes and db strokes are in sync 
            if (this.allStrokes.length < stroke.strokeNumber) {
              this.drawStroke(stroke, null)
              this.allStrokes.push(stroke)
            }
          } 
          else if (change.type === 'removed') {
            // inefficient way to clear canvas for OTHER users (since the current user's UI is already updated)
            clearTimeout(this.clearRectTimeout)
            this.clearRectTimeout = setTimeout(() => this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height), 400)
            this.resetVariables()
          }
        })
      })
    },
    resetVariables () {
      this.allStrokes = []
      this.lastX = -1
    },
    sortStrokesByTimestamp () {
      this.allStrokes.sort((a, b) => Number(a.startTime) - Number(b.startTime))
    },
    getHeightToWidthRatio () {
      return this.canvas.scrollHeight / this.canvas.scrollWidth
    },
    startTimer () {
      this.currentTime = 0 
      this.timer = setInterval(() => this.currentTime += 0.1, 100)
    },
    stopTimer () {
      clearInterval(this.timer)
    },
    initReplayLogic () {
      this.quickplay()
    },
    initTouchEvents () {
      this.canvas.addEventListener('touchstart', this.touchStart, false)
      this.canvas.addEventListener('touchend',this.touchEnd, false)
      this.canvas.addEventListener('touchmove', this.touchMove, false)
      this.setStyle(this.color, this.lineWidth)
    },
    removeTouchEvents () {
      this.canvas.removeEventListener('touchstart', this.touchStart, false)
      this.canvas.removeEventListener('touchend', this.touchEnd, false)
      this.canvas.removeEventListener('touchmove', this.touchMove, false)
    },
    async deleteStrokesSubcollection () {
      for (let i = 1; i < this.allStrokes.length + 1; i++) {
        this.strokesRef.doc(`${i}`).delete()
      }
      this.allStrokes = [] 
    },
    convertAndSavePoint (x, y) {
      const unitX = parseFloat(x / this.canvas.width).toFixed(4)
      const unitY = parseFloat(y / this.canvas.height).toFixed(4)
      this.currentStroke.push({ unitX, unitY })
      this.drawToPoint(this.touchX, this.touchY)
    },
    touchStart (e) {
      if (this.isNotValidTouch(e)) { 
        return 
      }
      if (e.touches[0].touchType == 'stylus') {
        this.disableTouch = true
      } 
      this.getTouchPos(e) 
      this.convertAndSavePoint(this.touchX, this.touchY)
      this.drawToPoint(this.touchX, this.touchY)
      if (this.isRecording) {
        this.startTime = this.currentTime.toFixed(1)
        // this.startTime keeps track of current stroke's startTime
      }
      event.preventDefault()
    },
    touchMove (e) {
      if (this.isNotValidTouch(e)) { 
        return 
      }
      this.getTouchPos(e)
      this.convertAndSavePoint(this.touchX, this.touchY)
      this.drawToPoint(this.touchX, this.touchY)
      event.preventDefault() // this line improves drawing performance for Microsoft Surfaces
    },
    touchEnd (e) {
      if (this.currentStroke.length == 0) {
        // user is touching the screen despite that touch is disabled
        return 
      }
      const strokeNumber = this.allStrokes.length + 1
      // save
      const stroke = {
        strokeNumber,
        author: this.author || 'anonymous',
        color: this.color,
        lineWidth: this.lineWidth,
        startTime: Number(this.startTime),
        endTime: Number(this.currentTime.toFixed(1)),
        points: this.currentStroke
      }
      this.allStrokes.push(stroke)
      this.strokesRef.doc(`${strokeNumber}`).set(stroke)
      // reset 
      this.currentStroke = []
      this.lastX = -1
    },
    getTouchPos (e) {
      const finger1 = e.touches[0] 
      this.touchX = finger1.pageX - this.canvas.getBoundingClientRect().left - window.scrollX
      this.touchY = finger1.pageY - this.canvas.getBoundingClientRect().top - window.scrollY
    },
    isNotValidTouch (e) {
      // multiple fingers not allowed 
      if (e.touches.length != 1) {
        return true
      }
      if (this.isFinger(e) && this.disableTouch) {
        return true
      } else {
        return false 
      }
    },
    isFinger (e) {
      if (e.touches[0].touchType != 'stylus') {
        return true 
      } 
      return false
    },
    saveDoodle () {
      this.saveSilently = true
      this.saveVideoPopup = true 
    },
    saveVideo () {
      this.saveSilently = false 
      this.saveVideoPopup = true
    },
    startRecording () {
      const audioRecorder = this.$refs['audio-recorder']
      audioRecorder.startRecording()
    },
    stopRecording () {
      this.isRecording = false
      this.removeTouchEvents()
      const audioRecorder = this.$refs['audio-recorder']
      audioRecorder.stopRecording()
      const ID = this.whiteboardDoc['.key']
      db.collection('whiteboards').doc(ID).update({
        isAnswered: true 
      })
    },
    async retryAnswer () {
      this.currentTime = 0 
      const ID = this.whiteboardDoc['.key']
      const whiteboardRef = db.collection('whiteboards').doc(ID)
      await whiteboardRef.update({
        isAnswered: false,
        audioURL: '',
        audioPath: ''
      })
    },
    handleExit () {
      this.$emit('close-whiteboard')
    },
    async handleSaving (videoTitle) {
      // mark the whiteboard as saved 
      const whiteboardID = this.whiteboardDoc['.key']
      const classID = this.$route.params.class_id

      // take a screenshot of the whiteboard to be used as the "preview" of the video
      // const dataURL = this.canvas.toDataURL()
      // const videoThumbnail = this.canvas.toDataURL()

      let metadata = {
        title: videoTitle, 
        fromClass: classID,
        isSaved: true,
        tabNumber: 0
        // thumbnail: videoThumbnail // toDataURL takes a screenshot of a canvas and encodes it as an image URL
      }
      if (this.user) {
        metadata.authorUID = this.user.uid
        metadata.authorEmail = this.user.email
        if (this.user.name) {
          metadata.authorName = this.user.name
        }
      }
      db.collection('whiteboards').doc(whiteboardID).update(metadata)

      // initialize a new whiteboard for the workspace
      const workspaceID = this.$route.params.id
      const newWhiteboardRef = await db.collection('whiteboards').add({ isAnswered: false })
      const workspaceRef = db.collection('classes').doc(classID).collection('workspaces').doc(workspaceID)
      workspaceRef.update({
        whiteboardID: newWhiteboardRef.id
      })
      // bad design, but informs the whiteboard that saving logic has completed
      // TODO: since WhiteboardSavePopup is just the child, communicate with it directly (through props)
      this.$root.$emit('audio-uploaded', whiteboardID)
    },
    saveFileReference({ url, path }) {
      // this is really bad, because the user may attempt to upload the video when the audio file has not yet been processed
      console.log('audio file successfully uploaded, now storing a reference')
      this.hasUploadedAudio = true
      const ID = this.whiteboardDoc['.key']
      db.collection('whiteboards').doc(ID).update({
        audioURL: url,
        audioPath: path
      })
    }
  }
}
</script>
