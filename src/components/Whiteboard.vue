<template>
  <!-- http://www.ckollars.org/canvas-two-coordinate-scales.html#scaling -->
  <!-- https://zipso.net/a-simple-touchscreen-sketchpad-using-javascript-and-html5/ -->
  <div class="whiteboard">
    <template v-if="workspace">
        <v-btn :loading="loading3"
              :disabled="loading3"
              @click="initReplayLogic()">
        <span>Preview Replay</span>
        <span slot="loader">Replaying...</span>
      </v-btn>
      <template v-if="!workspace.isAnswered">
        <v-btn :loading="loading2"
                :disabled="loading2"
                @click="initClearBoardLogic()">
          <span>Clear Whiteboard</span>
          <span slot="loader">Clearing...</span>
        </v-btn>
        <v-btn @click="submitAnswer()">Submit Answer</v-btn>
      </template>
    </template>
    <canvas id="myCanvas" height="700"></canvas>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import firebase from 'firebase/app'
import 'firebase/functions'
import db from '@/database.js'

export default {
  props: ['ownerUid'],
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
    }
  },
  props: ['ownerUid', 'workspace'],
  data() {
    return {
      loading2: false,
      loading3: false,
      allStrokes: [],
      currentStroke: [],
      canvas: null,
      ctx: null,
      touchX: null,
      touchY: null,
      lastX: -1,
      lastY: -1,
      numOfStrokes: 0,
      unsubscribe: null,
      redrawTimeout: null 
    }
  },
  mounted() {
    this.$root.$on('clear-whiteboard', this.deleteStrokesSubcollection) // listen to Navbar's "clear whiteboard" button
    this.$root.$on('save-explanation', docId => this.saveStrokes(docId))
    this.canvas = document.getElementById('myCanvas')
    this.ctx = this.canvas.getContext('2d')
    this.rescaleCanvas()
    window.addEventListener('resize', this.rescaleCanvas, false)
    this.initTouchEvents()
    this.addStrokesListener()
  },
  methods: {
    async submitAnswer() {
      const ref = db.collection('workspaces').doc(this.$route.params.id)
      await ref.update({
        isAskingQuestion: false, 
        isAnswered: true
      })
    },
    async initReplayLogic() {
      this.loading3 = true
      await this.playAnimation()
      this.loading3 = false 
    },
    initClearBoardLogic() {
      this.loading2 = true 
      this.deleteStrokesSubcollection()
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
            this.allStrokes.push(stroke)
            if (this.numOfStrokes == stroke.strokeNumber) {
              return // board is already in sync 
            } else {
              this.numOfStrokes += 1
              this.drawStroke(stroke.points)
            }
          } 
          else if (change.type === 'removed') {
            // for OTHER users to also clear canvas (since the current user's UI is already updated)
            // currently inefficient
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
    drawAllStrokes(strokes) {
      for (let i = 0; i < strokes.length; i++) {
        this.drawStroke(strokes[i].points )
      }
    },
    resetVariables() {
      this.allStrokes = []
      this.lastX = -1
      this.numOfStrokes = 0
    },
    drawStroke(points) {
      for (let i = 0; i < points.length; i++) {
        const x = points[i]['unitX'] * this.canvas.width
        const y = points[i]['unitY'] * this.canvas.height
        this.drawLine(x, y, 3)
        if (i == points.length - 1) {
          this.lastX = -1 
        }
      }
    },
    initTouchEvents() {
      this.canvas.addEventListener('touchstart', this.touchStart, false)
      this.canvas.addEventListener('touchend',this.touchEnd, false)
      this.canvas.addEventListener('touchmove', this.touchMove, false)
    },
    async deleteStrokesSubcollection() { // rename this function to deleteStrokesOnFirestore
      const path = `students/${this.ownerUid}/strokes`
      var deleteFn = firebase.functions().httpsCallable('recursiveDelete')
     
      try {
        const result = await deleteFn({ path: path })
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        this.resetVariables()
        this.loading2 = false 
        // this.$root.$emit('delete-whiteboard-strokes-success')
      } catch(err) {
        console.log('err =', err)
      }
    },
    drawLine(x, y, size=2) {
      if (this.lastX == -1) {
        // means it's the start of the strokee
        this.lastX = x
        this.lastY = y
        return
      }
      this.ctx.strokeStyle = 'purple'
      this.ctx.lineCap = 'round' // lines at different angles can join into each other
      // "trace" the line
      this.ctx.beginPath()
      this.ctx.moveTo(this.lastX, this.lastY)
      this.ctx.lineTo(x,y)
      this.ctx.lineWidth = size
      // draw the line
      this.ctx.stroke()
      // Update the last position to reference the current position
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
    },
    touchMove(e) {
      e.preventDefault()
      this.getTouchPos(e)
      this.convertAndSavePoint(this.touchX, this.touchY)
      this.drawLine(this.touchX, this.touchY, 2)
    },
    touchEnd(e) {
      const strokeNumber = this.numOfStrokes + 1 
      this.numOfStrokes += 1
      const strokesRef = db.collection('students').doc(this.ownerUid).collection('strokes')
      strokesRef.doc(`${strokeNumber}`).set({
        points: this.currentStroke,
        author: this.author,
        strokeNumber
      })
      this.currentStroke = []
      this.lastX = -1
    },
    getTouchPos(e) {
      if (e.touches) {
        if (e.touches.length == 1) { // only deal with one finger
          const touch = e.touches[0]; // get info for finger #1
          // there should be an additional scrolling parameter to take into account 
          // whiteboard size might become an issue
          this.touchX = touch.pageX - this.canvas.getBoundingClientRect().left - window.scrollX
          this.touchY = touch.pageY - this.canvas.getBoundingClientRect().top - window.scrollY
        }
      }
    },
    getScreenHeight() {
      return window.innerHeight
    },
    // animation related 
    async playAnimation() {
			if (!this.ctx || !this.canvas) {
				return
			}
			this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
			if (!this.allStrokes) {
				return
			}
			if (this.allStrokes.length == 0) {
				return
			}
			function timeout(ms) {
				return new Promise(resolve => setTimeout(resolve, ms))
			}
			const strokes = this.allStrokes
			const n = strokes.length
			// determine drawing speed
			let strokePeriod = 0
			if (n < 10) {
				strokePeriod = 500
			} else if (n < 20) {
				strokePeriod = 250
			} else if (n < 40) {
				strokePeriod = 100
			} else {
				strokePeriod = 30
			}
			for (let i = 0; i < n; i++) {
				await this.drawPath(strokes[i], false) // draw incrementally, not instantly
				await timeout(strokePeriod / 100)
			}
		},
    async drawPath(data, instant = true) {
      // initialize styles
			if (data.isEraser) {
				this.ctx.strokeStyle = 'white'
				this.ctx.lineWidth = 20
				this.ctx.lineCap = 'round'
			} else {
				this.ctx.strokeStyle = 'purple'
				this.ctx.lineWidth = 2
				this.ctx.lineCap = 'round'
			}
      // draw 
			const points = data.points
      for (let i = 0; i < points.length; i++) {
        const x = points[i]['unitX'] * this.canvas.width
        const y = points[i]['unitY'] * this.canvas.height
        this.drawLine(x, y, 3)
        if (!instant) {
          await timeout(this.pointPeriod)
        }
        if (i == points.length - 1) {
          this.lastX = -1 
        }
      }
			function timeout(ms) {
				return new Promise(resolve => setTimeout(resolve, ms))
			}
			let promise = new Promise(resolve => setTimeout(resolve, 0))
			promise.catch(error => console.log('error =', error))
			return promise
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