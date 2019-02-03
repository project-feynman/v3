<template>
  <!-- http://www.ckollars.org/canvas-two-coordinate-scales.html#scaling -->
  <!-- https://zipso.net/a-simple-touchscreen-sketchpad-using-javascript-and-html5/ -->
  <div id="whiteboard">
    <canvas id="myCanvas" :height="height"></canvas>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import DrawMethods from '@/mixins/DrawMethods'
import db from '@/database.js'

export default {
  props: ['explanationId'],
  watch: {
    explanationId: {
      handler: 'initData',
    },
    allStrokes() {
      if (this.playProgress) {
        console.log('allStrokes changed - likely because video was switched - removing setInterval')
        clearInterval(this.playProgress)
        this.playProgress = null 
      }
    }
  },
  mixins: [DrawMethods],
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
      height: 800,
      playProgress: null,
      isPlayingVideo: false,
      isPlayingVisual: false,
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
      redrawTimeout: null,
      interval: null 
    }
  },
  async created() {
    this.initData()
  },
  mounted() {
    this.canvas = document.getElementById('myCanvas')
    this.ctx = this.canvas.getContext('2d')
    this.rescaleCanvas()
    window.addEventListener('resize', this.rescaleCanvas, false)
  },
  beforeDestroy() {
    // clean up everything 
    console.log('beforeDestroy()')
    if (this.playProgress) {
      console.log('this.playProgress =', this.playProgress)
      clearInterval(this.playProgress)
    }
  },
  methods: {
    async initReplayLogic() {
      this.isReplaying = true
      await this.quickplay()
      this.isReplaying = false 
    },
    async handleDeletion() {
      await db.collection('explanations').doc(this.explanationId).delete()
    },
    async initData() {
      if (this.ctx) {
        // already loaded an explanation before, visually wipe previous drawings
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
      }
      this.allStrokes = [] 
      const strokesRef = db.collection('explanations').doc(this.explanationId).collection('strokes').orderBy('startTime', 'asc')
      await this.$binding('allStrokes', strokesRef)
      this.$root.$emit('finish-loading-animation')
      this.drawStrokesInstantly()
      this.$emit('animation-loaded')
    },
  }
}
</script>

<style>
#myCanvas {
  width: 100%;
  height: 70vh;
  background-color: rgb(192, 230, 253);
  cursor: crosshair;
}
</style>
