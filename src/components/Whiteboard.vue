<template>
  <div id="whiteboard">
    <!-- SAVING POPUP -->
    <save-video-popup v-model="saveVideoPopup"
                      @pre-save-explanation="videoTitle => handleSaving(videoTitle)"
                      fullscreen/>

    <!-- WHITEBOARD BUTTONS -->
    <v-toolbar v-if="!hideToolbar" id="whiteboard-toolbar" color="grey">
      <v-spacer></v-spacer>
      <v-toolbar-items v-if="whiteboardDoc">
        <template v-if="!whiteboardDoc.isAnswered">
          <swatches v-model="color"
                    :colors="colors"
                    inline
                    background-color="rgba(0, 0, 0, 0)"
                    swatch-size="55"
                    :wrapper-style="{ paddingTop: '0px', paddingBottom: '0px', paddingLeft: '40px', height: '30px' }"/>

          <v-btn @click="useEraser()">
            ERASER
          </v-btn>
          <v-btn @click="initClearBoardLogic()">
            CLEAR BOARD
          </v-btn>
          <v-btn @click="disableTouch = !disableTouch">
            {{ disableTouch ? "ENABLE TOUCH" : "DISABLE TOUCH"}}
          </v-btn>
          <v-btn @click="saveDoodle()">
            SAVE DOODLE
          </v-btn>
          <v-btn v-if="!isRecording" @click="startRecording()" color="pink white--text">
            RECORD VIDEO
          </v-btn>
          <v-btn v-else @click="stopRecording()" color="pink white--text">
            STOP VIDEO
          </v-btn>
        </template>
        <template v-else>
          <v-btn @click="initReplayLogic()">
            PREVIEW
          </v-btn>
          <v-btn @click="retryAnswer()">
            RETRY
          </v-btn>
          <v-btn @click="saveVideoPopup = true" class="pink white--text">
            SAVE VIDEO
          </v-btn>
        </template>
        <v-btn @click="handleExit()" dark flat>
          EXIT
        </v-btn>
      </v-toolbar-items>
    </v-toolbar>

    <!-- ACTUAL WHITEBOARD -->
    <canvas id="myCanvas" 
            style="height: 90vh; width: 100%; 
                   background-color: rgb(62, 66, 66)"/>
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
import SaveVideoPopup from '@/components/SaveVideoPopup.vue'

export default {
  props: {
    whiteboardID: String,
    isRecording: Boolean,
    isAnswered: Boolean,
    hideToolbar: Boolean
  },
  components: {
    Swatches,
    SaveVideoPopup
  },
  mixins: [DrawMethods],
  computed: {
    ...mapState(['user']),
    author() {
      return {
        name: this.user.name || 'anonymous',
        uid: this.user.uid
      }
    }
  },
  data() {
    return {
      // experiment zone
      whiteboardDoc: null,
      color: '#F64272',
      lineWidth: 2,
      colors: ['#F64272', 'orange', '#0AF2F2'],
      disableTouch: false,
      saveSilently: false,
      saveVideoPopup: false,
      // end of experiment zone 
      strokesRef: null,
      stylus: false, 
      allStrokes: [],
      currentStroke: [],
      canvas: null,
      ctx: null,
      timer: null,
      currentTime: 0,
      startTime: 0,
      endTime: null,
      touchX: null,
      touchY: null,
      lastX: -1,
      lastY: -1,
      unsubscribe: null,
      redrawTimeout: null, // needed for mixins/DrawMethods.js
      interval: null 
    }
  },
  watch: {
    whiteboardID: {
      handler: 'initData',
      immediate: true
    },

    // experiment zone 
    // bad - high surface area for bugs
    color () {
      if (this.color != 'rgb(62, 66, 66)') {
        this.lineWidth = 2
      }
    },
    // this is how whiteboard knows that it's starting to record
    isRecording () {
      if (this.isRecording) {
        console.log('whiteboard detects that isRecording is now true')
        this.startTimer()
      } else {
        this.stopTimer()
      }
    },
    isAnswered () {
      if (!this.isAnswered) {
        this.initTouchEvents()
      }
    }
  },
  mounted () {
    // the mounted() hook is never called for subsequent switches between whiteboards
    this.canvas = document.getElementById('myCanvas')
    this.ctx = this.canvas.getContext('2d')
    this.rescaleCanvas()
    window.addEventListener('resize', this.rescaleCanvas, false)
    this.initTouchEvents()
    this.continuouslySyncBoardWithDB()
  },
  beforeDestroy () {
    clearInterval(this.interval)
  },
  methods: {
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
    async initReplayLogic () {
      await this.quickplay()
    },
    initClearBoardLogic () {
      this.deleteStrokesSubcollection()
      this.allStrokes = [] 
    },
    initData () {
      if (!this.whiteboardID) {
        return
      }
      // experimental line 
      const whiteboardRef = db.collection('whiteboards').doc(this.whiteboardID)
      this.$binding('whiteboardDoc', whiteboardRef)
      // end of experimental line 
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
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
            this.resetVariables()
          }
        })
      })
    },
    resetVariables () {
      this.allStrokes = []
      this.lastX = -1
    },
    initTouchEvents () {
      this.canvas.addEventListener('touchstart', this.touchStart, false)
      this.canvas.addEventListener('touchend',this.touchEnd, false)
      this.canvas.addEventListener('touchmove', this.touchMove, false)
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
    },
    convertAndSavePoint (x, y) {
      const unitX = parseFloat(x / this.canvas.width).toFixed(4)
      const unitY = parseFloat(y / this.canvas.height).toFixed(4)
      this.currentStroke.push({ unitX, unitY })
      this.drawToPoint(this.touchX, this.touchY)
    },
    touchStart (e) {
       if (this.isNotValidTouch(e)) { return }
      this.setStyle(this.color, this.lineWidth)
      this.getTouchPos(e) 
      this.convertAndSavePoint(this.touchX, this.touchY)
      this.drawToPoint(this.touchX, this.touchY)
      if (this.currentTime) {
        this.startTime = this.currentTime.toFixed(1)
      }
    },
    touchMove (e) {
      if (this.isNotValidTouch(e)) { return }
      e.preventDefault()
      this.getTouchPos(e)
      this.convertAndSavePoint(this.touchX, this.touchY)
      this.drawToPoint(this.touchX, this.touchY)
    },
    touchEnd (e) {
      if (this.currentStroke.length == 0) {
        // user is touching the screen despite that touch is disabled
        return 
      }
      const strokeNumber = this.allStrokes.length + 1
      const stroke = {
        strokeNumber,
        author: this.author || 'anonymous',
        color: this.color,
        lineWidth: this.lineWidth
      }
      stroke.startTime = Number(this.startTime),
      stroke.endTime = Number(this.currentTime.toFixed(1))
      stroke.points = this.currentStroke
      // save 
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
      // finger drawing disabled
      if (this.disableTouch && this.isFinger(e)) {
        return true
      }
      return false
    },
    isFinger (e) {
      if (e.touches.length == 1) {
        if (e.touches[0].touchType != 'stylus') {
          return true 
        } 
      }
      return false
    },
    useEraser () {
      this.color = 'rgb(62, 66, 66)'
      this.lineWidth = 18
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
      this.$emit('start-recording')
    },
    stopRecording () {
      this.$emit('stop-recording')
    },
    async retryAnswer () {
      this.currentTime = 0 
      const ID = this.whiteboardDoc['.key']
      const whiteboardRef = db.collection('whiteboards').doc(ID)
      await whiteboardRef.update({
        isAnswered: false
      })
    },
    handleExit () {
      this.$emit('close-whiteboard')
    },
    async handleSaving (videoTitle) {
      // mark the whiteboard as saved 
      const whiteboardID = this.whiteboardDoc['.key']

      const whiteboardRef = db.collection('whiteboards').doc(whiteboardID)
      whiteboardRef.update({
        isSaved: true
      })
      // create a new video document that points to the whiteboard
      const classID = this.$route.params.class_id
      const videoID = slugify(videoTitle, {
        replacement: '-',
        lower: true
      })

      // I think this is an error - why are we awaiting a reference?
      const docRef = await db.collection('classes').doc(classID).collection('videos').doc(videoID)

      const videoObj = {
        title: videoTitle,
        whiteboardID,
        authorUID: this.user.uid || 'Anonymous',
        authorName: this.user.name || 'Anonymous'
      }

      if (!this.saveSilently) {
        if (this.whiteboardDoc.audioURL && this.whiteboardDoc.audioPath) {
          videoObj.audioURL = this.whiteboardDoc.audioURL
          videoObj.audioPath = this.whiteboardDoc.audioPath
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
      this.$root.$emit('audio-uploaded', docRef.id)
    }
  }
}
</script>
