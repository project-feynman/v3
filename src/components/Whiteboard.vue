<template>
  <div id="whiteboard">
    <canvas id="myCanvas" 
            style="height: 90vh; width: 100%; background-color: rgb(192, 230, 253);">
    </canvas>
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
  props: ['workspace', 'isRecording', 'isAnswered', 'color', 'colors', 'disableTouch', 'lineWidth', 'whiteboardID'],
  components: {
    Swatches
  },
  mixins: [DrawMethods],
  watch: {
    whiteboardID: {
      handler: 'initData',
    },
    isRecording() {
      if (this.isRecording) {
        this.startTimer()
      } else {
        this.stopTimer()
      }
    },
    isAnswered() {
      if (!this.isAnswered) {
        this.initTouchEvents()
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
    }
  },
  data() {
    return {
      strokesRef: null,
      stylus: false, 
      allStrokes: [],
      currentStroke: [],
      canvas: null,
      ctx: null,
      isClearing: false,
      isReplaying: false,
      timer: null,
      currentTime: 0,
      startTime: 0,
      endTime: null,
      touchX: null,
      touchY: null,
      lastX: -1,
      lastY: -1,
      unsubscribe: null,
      redrawTimeout: null,
      idx: 0,
      interval: null 
    }
  },
  created() {
    this.strokesRef = db.collection('whiteboards').doc(this.whiteboardID).collection('strokes')
    // this.strokesRef = db.collection('workspaces').doc(this.$route.params.id).collection('strokes')
  },
  mounted() {
    this.canvas = document.getElementById('myCanvas')
    this.ctx = this.canvas.getContext('2d')
    this.rescaleCanvas()
    window.addEventListener('resize', this.rescaleCanvas, false)
    // for some reason, this is needed
    if (workspace) {
      if (!this.workspace.isAnswered) {
        this.initTouchEvents()
      }
    }
    this.addStrokesListener()
  },
  beforeDestroy() {
    clearInterval(this.interval)
  },
  methods: {
    sortStrokesByTimestamp() {
      this.allStrokes.sort((a, b) => Number(a.startTime) - Number(b.startTime))
    },
    getHeightToWidthRatio() {
      return this.canvas.scrollHeight / this.canvas.scrollWidth
    },
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
    async initReplayLogic() {
      await this.quickplay()
    },
    initClearBoardLogic() {
      this.isClearing = true 
      this.deleteStrokesSubcollection()
      this.allStrokes = [] 
    },
    initData() {
      // visually wipe previous drawings
      if (this.ctx) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
      }
      this.allStrokes = [] 
      this.unsubscribe() 
      this.addStrokesListener() 
    },
    addStrokesListener() {
      // const strokesRef = db.collection('workspaces').doc(this.$route.params.id).collection('strokes').orderBy('strokeNumber')
      this.unsubscribe = this.strokesRef.orderBy('strokeNumber').onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added') {
            const stroke = change.doc.data()
            // check if local strokes and db strokes are in sync 
            if (this.allStrokes.length < stroke.strokeNumber) {
              this.drawStroke(stroke, null)
              this.allStrokes.push(stroke)
              console.log('this.allStrokes =', this.allStrokes)
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
      this.canvas.removeEventListener('touchstart', this.touchStart, false)
      this.canvas.removeEventListener('touchend', this.touchEnd, false)
      this.canvas.removeEventListener('touchmove', this.touchMove, false)
    },
    async deleteStrokesSubcollection () {
      // const strokesRef = db.collection('workspaces').doc(this.$route.params.id).collection('strokes')
      for (let i = 1; i < this.allStrokes.length + 1; i++) {
        this.strokesRef.doc(`${i}`).delete()
      }
    },
    convertAndSavePoint(x, y) {
      const unitX = parseFloat(x / this.canvas.width).toFixed(4)
      const unitY = parseFloat(y / this.canvas.height).toFixed(4)
      this.currentStroke.push({ unitX, unitY })
      this.drawToPoint(this.touchX, this.touchY)
    },
    touchStart(e) {
      if (e.touches.length != 1) {
        return 
      }
      if (this.disableTouch) {
        if (e.touches.length == 1) {
          if (e.touches[0].touchType != 'stylus') {
            return
          } 
        }
      }
      this.setStyle(this.color, this.lineWidth)
      this.getTouchPos(e) 
      this.convertAndSavePoint(this.touchX, this.touchY)
      this.drawToPoint(this.touchX, this.touchY)
      if (this.currentTime) {
        this.startTime = this.currentTime.toFixed(1)
      }
    },
    touchMove(e) {
      if (e.touches.length != 1) {
        return 
      }
      if (this.disableTouch) {
        if (e.touches.length == 1) {
          if (e.touches[0].touchType != 'stylus') {
            return
          } 
        }
      }
      e.preventDefault()
      this.getTouchPos(e)
      this.convertAndSavePoint(this.touchX, this.touchY)
      this.drawToPoint(this.touchX, this.touchY)
    },
    touchEnd(e) {
      if (this.currentStroke.length == 0) {
        // user is touching the screen despite that touch is disabled
        return 
      }
      const strokeNumber = this.allStrokes.length + 1
      const stroke = {
        strokeNumber,
        author: this.author,
        color: this.color,
        lineWidth: this.lineWidth
      }
   
      stroke.startTime = Number(this.startTime),
      stroke.endTime = Number(this.currentTime.toFixed(1))
      stroke.points = this.currentStroke
      // save 
      this.allStrokes.push(stroke)
      // const strokesRef = db.collection('workspaces').doc(this.$route.params.id).collection('strokes')
      this.strokesRef.doc(`${strokeNumber}`).set(stroke)
      // reset 
      this.currentStroke = []
      this.lastX = -1
    },
    getTouchPos(e) {
      const finger1 = e.touches[0] 
      this.touchX = finger1.pageX - this.canvas.getBoundingClientRect().left - window.scrollX
      this.touchY = finger1.pageY - this.canvas.getBoundingClientRect().top - window.scrollY
    }
  }
}
</script>
