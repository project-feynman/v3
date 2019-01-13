<template>
  <!-- http://www.ckollars.org/canvas-two-coordinate-scales.html#scaling -->
  <!-- https://zipso.net/a-simple-touchscreen-sketchpad-using-javascript-and-html5/ -->
  <div class="whiteboard">
    <template v-if="user">
      <v-btn v-if="user.name == 'Elton Lin'" @click="handleDeletion()" class="red darken-2">
        <span class="white--text">Delete</span>
      </v-btn>
    </template>
    <!-- PLAY VIDEO -->
    <v-btn @click="playVideo()">PLAY VIDEO</v-btn>

    <!-- PREVIEW REPLAY -->
    <v-btn :loading="isReplaying"
           :disabled="isReplaying"
           @click="initReplayLogic()">
      <span>PREVIEW REPLAY</span>
      <span slot="loader">Replaying...</span>
    </v-btn>
    <canvas id="myCanvas" height="700"></canvas>
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
  data() {
    return {
      isReplaying: false,
      allStrokes: [],
      timer: null,
      currentTime: 0,
      idx: 0,
      index: 0,
      canvas: null,
      ctx: null,
      lastX: -1,
      lastY: -1,
      redrawTimeout: null 
    }
  },
  async created() {
    this.initData()
  },
  mounted() {
    this.$root.$on('play-explanation', this.playAnimation)
    this.canvas = document.getElementById('myCanvas')
    this.ctx = this.canvas.getContext('2d')
    this.rescaleCanvas()
    window.addEventListener('resize', this.rescaleCanvas, false)
  },
  methods: {
    async initReplayLogic() {
      this.isReplaying = true
      await this.playAnimation()
      this.isReplaying = false 
    },
    async handleDeletion() {
      console.log('handleDeletion()')
      await db.collection('explanations').doc(this.explanationId).delete()
      console.log('successfully deleted document')
    },
    async initData() {
      // visually wipe previous drawings
      if (this.ctx) {
        // already loaded an explanation before
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
      }
      this.allStrokes = [] 
      const strokesRef = db.collection('explanations').doc(this.explanationId).collection('strokes').orderBy('strokeNumber', 'asc')
      await this.$binding('allStrokes', strokesRef)
      this.$root.$emit('finish-loading-animation')
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
    async playVideo() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
      const checkWhetherStrokesShouldBePlayed = () => {
        // console.log('currentTime =', currentTime)
        // currentStroke represents the index of the next stroke that should be played 
        this.currentTime += 0.1
        const nextStroke = this.allStrokes[this.idx]
        console.log('nextStroke.timestamp =', nextStroke.timestamp)
        console.log('current time =', this.currentTime)
        // what is the problem? timestamp is a string, currentTime is a float AND it is also 


        if (Number(nextStroke.timestamp) == this.currentTime.toFixed(1)) {
          this.drawPath(nextStroke, false) // draw incrementally, not instantly
          this.idx += 1
        }
      }
      const playProgress = setInterval(checkWhetherStrokesShouldBePlayed, 100)
    },
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
  cursor: crosshair;
}
</style>
