<template>
  <!-- http://www.ckollars.org/canvas-two-coordinate-scales.html#scaling -->
  <!-- https://zipso.net/a-simple-touchscreen-sketchpad-using-javascript-and-html5/ -->
  <div class="whiteboard">
    <canvas id="myCanvas" width="1500" height="1500"></canvas>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import db from '@/database.js'

export default {
  computed: {
    ...mapState(['user'])
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
      numOfStrokes: 0 
    }
  },
  mounted() {
    const strokesRef = db.collection('students').doc(this.ownerUid).collection('strokes')
    this.$root.$on('clear-whiteboard', this.clearCanvas) // listen to Navbar's "clear whiteboard" button
    this.canvas = document.getElementById('myCanvas')
    this.ctx = this.canvas.getContext('2d')
    this.rescaleCanvas()
    window.addEventListener('resize', this.rescaleCanvas, false)
    this.initTouchEvents()
    strokesRef.onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
            if (change.type === "added") {
              const stroke = change.doc.data()
              if (this.numOfStrokes == stroke.strokeNumber) {
                return // whiteboard and database have the same # of strokes
              } else {
                this.numOfStrokes += 1
                const points = stroke.points
                for (let i=0; i<points.length; i++) {
                  const x = points[i]['unitX'] * this.canvas.width
                  const y = points[i]['unitY'] * this.canvas.height
                  this.drawLine(x, y, 3)
                  if (i == points.length - 1) {
                    this.lastX = -1 
                    this.lastY = -1
                  }
                }
              }
            }
            if (change.type === 'removed') {
              this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
              this.lastX = -1
              this.lastY = -1
              this.numOfStrokes = 0
            }
        })
    })
  },
  methods: {
    rescaleCanvas() {
      this.canvas.width = this.canvas.scrollWidth
      this.canvas.height = this.canvas.scrollHeight
    },
    initTouchEvents() {
      this.canvas.addEventListener('touchstart', this.touchStart, false)
      this.canvas.addEventListener('touchend',this.touchEnd, false)
      this.canvas.addEventListener('touchmove', this.touchMove, false)
    },
    clearCanvas() {
      const strokesRef = db.collection('students').doc(this.ownerUid).collection('strokes')
      for (let i = 1; i < this.numOfStrokes + 1; i++) {
        strokesRef.doc(`${i}`).delete()
      }
    },
    drawLine(x, y, size) {
        console.log('drawLine()')
        if (this.lastX == -1) {
          this.lastX = x
	        this.lastY = y
          return // means it's the start of the stroke
        }
        this.ctx.strokeStyle = 'black'
        this.ctx.lineCap = "round" // lines at different angles can join into each other
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
      const points = this.currentStroke       
      this.currentStroke = []
      const author = {
        name: this.user.displayName,
        uid: this.user.uid,
      }
      const strokesRef = db.collection('students').doc(this.ownerUid).collection('strokes')
      strokesRef.doc(`${strokeNumber}`).set({
        points,
        author,
        strokeNumber
      })
      this.lastX = -1
      this.lastY = -1 
    },
    getTouchPos(e) {
      if (e.touches) {
        if (e.touches.length == 1) { // only deal with one finger
          const touch = e.touches[0]; // get info for finger #1
          this.touchX = touch.pageX - this.canvas.getBoundingClientRect().left
          this.touchY = touch.pageY - this.canvas.getBoundingClientRect().top
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
  cursor: crosshair;
}
</style>