<template>
  <!-- http://www.ckollars.org/canvas-two-coordinate-scales.html#scaling -->
  <!-- https://zipso.net/a-simple-touchscreen-sketchpad-using-javascript-and-html5/ -->
  <div class="whiteboard">
    <canvas id="myCanvas" height="800"></canvas>
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
        name: this.user.displayName,
        uid: this.user.uid
      }
    }
  },
  props: ['ownerUid'],
  data() {
    return {
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
    this.ctx.strokeStyle = 'purple'
    this.ctx.lineCap = "round" // lines at different angles can join into each other
    this.rescaleCanvas()
    window.addEventListener('resize', this.rescaleCanvas, false)
    this.initTouchEvents()
    this.addStrokesListener()
  },
  methods: {
    saveStrokes(explanationId) {
      const explanationRef = db.collection('explanations').doc(explanationId).collection('strokes')
      this.allStrokes.forEach(stroke => {
        explanationRef.doc(`${stroke.strokeNumber}`).set({
          author: stroke.author,
          points: stroke.points
        })
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
      const strokesRef = db.collection('students').doc(this.ownerUid).collection('strokes')
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
          if (change.type === 'removed') {
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
      const result = await deleteFn({ path: path })
      try {
        this.resetVariables()
        this.$root.$emit('delete-whiteboard-strokes-success')
      } catch(err) {
        console.log('err =', err)
      }
    },
    drawLine(x, y, size=3) {
      if (this.lastX == -1) {
        // means it's the start of the strokee
        this.lastX = x
        this.lastY = y
        return
      }
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
      this.drawLine(this.touchX, this.touchY, 3)
    },
    touchStart(e) {
      this.getTouchPos(e) 
      this.convertAndSavePoint(this.touchX, this.touchY)
      this.drawLine(this.touchX, this.touchY, 3)
    },
    touchMove(e) {
      e.preventDefault()
      this.getTouchPos(e)
      this.convertAndSavePoint(this.touchX, this.touchY)
      this.drawLine(this.touchX, this.touchY, 3)
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