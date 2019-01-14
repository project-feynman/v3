<template>
  <!-- http://www.ckollars.org/canvas-two-coordinate-scales.html#scaling -->
  <!-- https://zipso.net/a-simple-touchscreen-sketchpad-using-javascript-and-html5/ -->
  <div class="whiteboard">
    <template v-if="workspace">
      <!-- QUICKPLAY -->
      <v-btn :loading="isReplaying"
             :disabled="isReplaying"
             @click="initReplayLogic()">
        <span>QUICKPLAY</span>
        <span slot="loader">Replaying...</span>
      </v-btn>
      <!-- REPLAY VIDEO -->
      <v-btn :loading="isPlayingVideo"
             :disabled="isPlayingVideo"
             @click="playVideo()">
        <span>REPLAY VIDEO</span>
        <span slot="loader">Replaying...</span>
      </v-btn>
      <template v-if="showButtons">
        <!-- CLEAR WHITEBOARD -->
        <v-btn :loading="isClearing"
               :disabled="isClearing"
               @click="initClearBoardLogic()"> 
          <span>CLEAR WHITEBOARD</span>
          <span slot="loader">Clearing...</span>
        </v-btn>
        <!-- START TIMER -->
        <!-- <v-btn @click="startTimer()">START TIMER</v-btn> -->
        <!-- <v-btn @click="stopTimer()">STOP TIMER</v-btn> -->
        <p>{{ currentTime.toFixed(1) }}</p>
        <!-- RECORD -->
        <record-button ref="record-button"
                       @start-recording="startTimer()" 
                       @replay-recording="playVideo()" 
                       @end-recording="stopTimer()"
                       @replay-ended="isPlayingAudio = false"/>
      </template>
      <!-- WHITEBOARD -->
      <canvas id="myCanvas" height="700"></canvas>
    </template>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import firebase from 'firebase/app'
import 'firebase/functions'
import db from '@/database'
import RecordButton from '@/components/RecordButton'
import DrawMethods from '@/mixins/DrawMethods'

export default {
  props: ['ownerUid', 'showButtons', 'workspace'],
  mixins: [DrawMethods],
  components: {
    RecordButton
  },
  watch: {
    ownerUid: {
      handler: 'initData',
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
        return this.isPlayingAudio ||this.isPlayingVisual
      },
      set(isPlayingVideo) {
        this.isPlayingAudio = true 
        this.isPlayingVisual = true 
      }
    }
  },
  data() {
    return {
      allStrokes: [],
      currentStroke: [],
      isPlayingVisual: false,
      isPlayingAudio: false,
      canvas: null,
      ctx: null,
      isClearing: false,
      isReplaying: false,
      timer: null,
      currentTime: 0,
      startTime: null,
      endTime: null,
      touchX: null,
      touchY: null,
      lastX: -1,
      lastY: -1,
      unsubscribe: null,
      redrawTimeout: null,
      idx: 0,
    }
  },
  mounted() {
    this.$root.$on('save-explanation', docId => this.saveStrokes(docId))
    this.canvas = document.getElementById('myCanvas')
    this.ctx = this.canvas.getContext('2d')
    this.rescaleCanvas()
    window.addEventListener('resize', this.rescaleCanvas, false)
    this.initTouchEvents()
    this.addStrokesListener()
  },
  methods: {
    startTimer() {
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
      await this.playAnimation()
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
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
      this.unsubscribe() 
      this.allStrokes = [] 
      this.addStrokesListener() 
    },
    addStrokesListener() {
      const strokesRef = db.collection('students').doc(this.ownerUid).collection('strokes').orderBy('strokeNumber')
      this.unsubscribe = strokesRef.onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added') {
            const stroke = change.doc.data()
            // check if local strokes and db strokes are in sync 
            if (this.allStrokes.length < stroke.strokeNumber) {
              this.drawStroke(stroke.points)
              this.allStrokes.push(stroke)
            }
          } 
          else if (change.type === 'removed') {
            // to clear canvas for OTHER users (since the current user's UI is already updated)
            // is inefficient
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
            this.resetVariables()
          }
        })
      })
    },
    rescaleCanvas() {
      this.canvas.width = this.canvas.scrollWidth
      this.canvas.height = this.canvas.scrollHeight
      // only redraw when the user has finished resizing the window
      clearTimeout(this.redrawTimeout) // rescaleCanvas() called again during the 400 milliseconds, so cancel 
      this.redrawTimeout = setTimeout(this.drawAllStrokes(this.allStrokes), 400) // resizing the canvas causes all drawings to be lost 
    },
    resetVariables() {
      this.allStrokes = []
      this.lastX = -1
    },
    initTouchEvents() {
      this.canvas.addEventListener('touchstart', this.touchStart, false)
      this.canvas.addEventListener('touchend',this.touchEnd, false)
      this.canvas.addEventListener('touchmove', this.touchMove, false)
    },
    async deleteStrokesSubcollection() {
      const path = `students/${this.ownerUid}/strokes`
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
    drawLine(x, y, size = 2) {
      if (this.lastX == -1) {
        this.lastX = x
        this.lastY = y
        return
      }
      // set style 
      this.ctx.strokeStyle = 'purple'
      this.ctx.lineCap = 'round' // lines at different angles can join into each other
      this.ctx.lineWidth = size
      // "trace" the line
      this.ctx.beginPath()
      this.ctx.moveTo(this.lastX, this.lastY)
      this.ctx.lineTo(x,y)
      // draw the line
      this.ctx.stroke()
      // update position
      this.lastX = x
      this.lastY = y
    },
    convertAndSavePoint(x, y) {
      const unitX = parseFloat(x / this.canvas.width).toFixed(4)
      const unitY = parseFloat(y / this.canvas.height).toFixed(4)
      this.currentStroke.push({ unitX, unitY })
      this.drawLine(this.touchX, this.touchY, 2)
    },
    touchStart(e) {
      this.getTouchPos(e) 
      this.convertAndSavePoint(this.touchX, this.touchY)
      this.drawLine(this.touchX, this.touchY, 2)
      this.startTime = this.currentTime.toFixed(1)
    },
    touchMove(e) {
      e.preventDefault()
      this.getTouchPos(e)
      this.convertAndSavePoint(this.touchX, this.touchY)
      this.drawLine(this.touchX, this.touchY, 2)
    },
    touchEnd(e) {
      const strokeNumber = this.allStrokes.length + 1
      const stroke = {
        strokeNumber,
        startTime: this.startTime,
        endTime: this.currentTime.toFixed(1),
        author: this.author,
        points: this.currentStroke,
      }
      // save 
      this.allStrokes.push(stroke)
      const strokesRef = db.collection('students').doc(this.ownerUid).collection('strokes')
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
    },
    // ANIMATION RELATED FUNCTIONS
    getDrawSpeed(n) {
      if (n < 10) { return 500 } 
      else if (n < 20) { return 250 } 
      else if (n < 40) { return 100 } 
      else { return 30 }
    },
    async playAnimation() {
			if (!this.ctx || !this.canvas || !this.allStrokes) {
				return
			}
			this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
			function timeout(ms) {
				return new Promise(resolve => setTimeout(resolve, ms))
			}
			const n = this.allStrokes.length
			const strokePeriod = this.getDrawSpeed(n)
			for (let i=0; i<n; i++) {
				await this.drawPath(this.allStrokes[i], false) // draw incrementally, not instantly
				await timeout(strokePeriod / 100)
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