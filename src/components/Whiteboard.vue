<template>
  <!-- http://www.ckollars.org/canvas-two-coordinate-scales.html#scaling -->
  <!-- https://zipso.net/a-simple-touchscreen-sketchpad-using-javascript-and-html5/ -->
  <div id="whiteboard">
    <template v-if="workspace">
      <template v-if="showButtons">
          <div style="display: flex;">
            <!-- CLEAR WHITEBOARD -->
            <!-- <v-btn :loading="isClearing"
                   :disabled="isClearing"
                   @click="initClearBoardLogic()"> 
              <span>CLEAR WHITEBOARD</span>
              <span slot="loader">Clearing...</span>
            </v-btn> -->
            
            <!-- timer -->
            <!-- <p v-if="currentTime">{{ currentTime.toFixed(1) }}</p> -->

            <v-btn @click="useEraser()">
              ERASER
            </v-btn>

            <!-- color palette  -->
            <swatches v-model="color" />
        </div>
      </template>

      <!-- WHITEBOARD -->
      <canvas id="myCanvas" :height="height"></canvas>

    </template>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import firebase from 'firebase/app'
import 'firebase/functions'
import db from '@/database.js'
import DrawMethods from '@/mixins/DrawMethods.js'
import Swatches from 'vue-swatches'
import "vue-swatches/dist/vue-swatches.min.css"

export default {
  props: ['ownerUid', 'showButtons', 'workspace', 'isRecording', 'isAnswered'],
  components: {
    Swatches
  },
  mixins: [DrawMethods],
  watch: {
    ownerUid: {
      handler: 'initData',
    },
    isRecording() {
      if (this.isRecording) {
        this.startTimer()
        // this.initTouchEvents()
      } else {
        this.stopTimer()
        // this.removeTouchEvents()
      }
    },
    // isAnswered() {
    //   if (this.isAnswered) {
    //     this.removeTouchEvents()
    //   } else {
    //     this.initTouchEvents()
    //   }
    // },
    color() {
      // bad - high surface area for bugs 
      console.log('user picked a color =', this.color)
      if (this.color != 'rgb(192, 230, 253)') {
        this.lineWidth = 2
      }
    }
  },
  computed: {
    ...mapState(['user']),
    author() {
      return {
        name: this.user.name,
        uid: this.user.uid
      }
    },
    isPlayingVideo: {
      get() {
        return this.isPlayingAudio || this.isPlayingVisual
      },
      set(isPlayingVideo) {
        this.isPlayingAudio = true 
        this.isPlayingVisual = true 
      }
    }
  },
  data() {
    return {
      height: 700,
      allStrokes: [],
      currentStroke: [],
      isPlayingVisual: false,
      isPlayingAudio: false,
      canvas: null,
      ctx: null,
      isClearing: false,
      isReplaying: false,
      timer: null,
      currentTime: null,
      startTime: null,
      endTime: null,
      touchX: null,
      touchY: null,
      lastX: -1,
      lastY: -1,
      unsubscribe: null,
      redrawTimeout: null,
      idx: 0,
      color: '#1CA085',
      lineWidth: 2
    }
  },
  mounted() {
    this.canvas = document.getElementById('myCanvas')
    this.ctx = this.canvas.getContext('2d')
    this.rescaleCanvas()
    window.addEventListener('resize', this.rescaleCanvas, false)
    this.initTouchEvents()
    this.addStrokesListener()
  },
  methods: {
    useEraser() {
      this.color = 'rgb(192, 230, 253)'
      this.lineWidth = 15
    },
    startTimer() {
      this.currentTime = 0 
      this.timer = setInterval(() => this.currentTime += 0.1, 100)
    },
    stopTimer() {
      clearInterval(this.timer)
    },
    async submitAnswer() {
      const ref = db.collection('workspaces').doc(this.$route.params.id)
      await ref.update({
        isAskingQuestion: false, 
        isAnswered: true
      })
    },
    async initReplayLogic() {
      this.isReplaying = true
      await this.quickplay()
      this.isReplaying = false 
    },
    initClearBoardLogic() {
      this.isClearing = true 
      this.deleteStrokesSubcollection()
      this.allStrokes = [] 
    },
    saveStrokes(explanationId) {
      const explanationRef = db.collection('explanations').doc(explanationId).collection('strokes')
      this.allStrokes.forEach(stroke => {
        explanationRef.doc(`${stroke.strokeNumber}`).set(stroke)
      })
    },
    initData() {
      // visually wipe previous drawings
      if (this.ctx) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
      }
      this.unsubscribe() 
      this.allStrokes = [] 
      this.addStrokesListener() 
    },
    addStrokesListener() {
      const strokesRef = db.collection('workspaces').doc(this.$route.params.id).collection('strokes').orderBy('strokeNumber')
      this.unsubscribe = strokesRef.onSnapshot(snapshot => {
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
    removeTouchEvents() {
      console.log('removeTouchEvents()')
      this.canvas.removeEventListener('touchstart', this.touchStart, false)
      this.canvas.removeEventListener('touchend', this.touchEnd, false)
      this.canvas.removeEventListener('touchmove', this.touchMove, false)
    },
    async deleteStrokesSubcollection () {
      const path = `workspaces/${this.$route.params.id}/strokes`
      var deleteFn = firebase.functions().httpsCallable('recursiveDelete')
      try {
        const result = await deleteFn({ path: path })
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        this.resetVariables()
        this.isClearing = false 
      } catch(err) {
        console.log('err =', err)
      }
    },
    convertAndSavePoint(x, y) {
      const unitX = parseFloat(x / this.canvas.width).toFixed(4)
      const unitY = parseFloat(y / this.canvas.height).toFixed(4)
      this.currentStroke.push({ unitX, unitY })
      this.drawToPoint(this.touchX, this.touchY)
    },
    touchStart(e) {
      this.setStyle(this.color, this.lineWidth)
      this.getTouchPos(e) 
      this.convertAndSavePoint(this.touchX, this.touchY)
      this.drawToPoint(this.touchX, this.touchY)
      if (this.currentTime) {
        this.startTime = this.currentTime.toFixed(1)
      }
    },
    touchMove(e) {
      e.preventDefault()
      this.getTouchPos(e)
      this.convertAndSavePoint(this.touchX, this.touchY)
      this.drawToPoint(this.touchX, this.touchY)
    },
    touchEnd(e) {
      const strokeNumber = this.allStrokes.length + 1
      const stroke = {
        strokeNumber,
        author: this.author,
        color: this.color,
        lineWidth: this.lineWidth
      }
      if (this.currentTime) {
        stroke.startTime = this.startTime,
        stroke.endTime = this.currentTime.toFixed(1)
      }
      stroke.points = this.currentStroke
      // save 
      this.allStrokes.push(stroke)
      const strokesRef = db.collection('workspaces').doc(this.$route.params.id).collection('strokes')
      strokesRef.doc(`${strokeNumber}`).set(stroke)
      // reset 
      this.currentStroke = []
      this.lastX = -1
    },
    getTouchPos(e) {
      if (e.touches) {
        if (e.touches.length == 1) { 
          const finger1 = e.touches[0] 
          this.touchX = finger1.pageX - this.canvas.getBoundingClientRect().left - window.scrollX
          this.touchY = finger1.pageY - this.canvas.getBoundingClientRect().top - window.scrollY
        }
      }
    }
  }
}
</script>

<style>
#myCanvas {
  width: 100%;
  background-color: rgb(192, 230, 253);
}
</style>