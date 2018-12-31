<template>
  <!-- http://www.ckollars.org/canvas-two-coordinate-scales.html#scaling -->
  <!-- https://zipso.net/a-simple-touchscreen-sketchpad-using-javascript-and-html5/ -->
  <!-- handle empty whiteboard -->
  <div class="whiteboard">
    <canvas id="myCanvas" height="800"></canvas>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import db from '@/database.js'

export default {
  props: ['explanationId'],
  watch: {
    explanationId: {
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
  props: ['explanationId'],
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
  async created() {
    this.initData()
  },
  mounted() {
    this.$root.$on('replay-animation', this.replayAnimation)
    this.canvas = document.getElementById('myCanvas')
    this.ctx = this.canvas.getContext('2d')
    this.rescaleCanvas()
    window.addEventListener('resize', this.rescaleCanvas, false)
  },
  methods: {
    async initData() {
      // visually wipe previous drawings
      if (this.ctx) {
        // already loaded an explanation before
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
      }
      this.allStrokes = [] 
      const strokesRef = db.collection('explanations').doc(this.explanationId).collection('strokes')
      await this.$binding('allStrokes', strokesRef)
      this.drawAllStrokes(this.allStrokes)
    },
    rescaleCanvas() {
      this.canvas.width = this.canvas.scrollWidth
      this.canvas.height = this.canvas.scrollHeight
      // only redraw when the user has finished resizing the window
      clearTimeout(this.redrawTimeout) // rescaleCanvas() called again during the 400 milliseconds, so cancel 
      this.redrawTimeout = setTimeout(this.drawAllStrokes(this.allStrokes), 400) // resizing the canvas causes all drawings to be lost 
    },
    drawAllStrokes(strokes) {
      if (!strokes) {
        return 
      }
      for (let i = 0; i < strokes.length; i++) {
        this.drawStroke(strokes[i].points )
      }
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
