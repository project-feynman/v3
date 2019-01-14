<template>
  <!-- http://www.ckollars.org/canvas-two-coordinate-scales.html#scaling -->
  <!-- https://zipso.net/a-simple-touchscreen-sketchpad-using-javascript-and-html5/ -->
  <div class="whiteboard">
    <template v-if="user">
      <v-btn v-if="user.name == 'Elton Lin'" @click="handleDeletion()" class="red darken-2">
        <span class="white--text">Delete</span>
      </v-btn>
    </template>
    <!-- PREVIEW REPLAY -->
    <v-btn :loading="isReplaying"
           :disabled="isReplaying"
           @click="initReplayLogic()">
      <span>QUICKPLAY</span>
      <span slot="loader">Replaying...</span>
    </v-btn>
    <!-- PLAY VIDEO -->
    <v-btn :loading="isPlayingVisual"
           :disabled="isPlayingVisual"
           @click="playVisual()">
      <span>REPLAY VISUAL</span>
      <span slot="loader">Replaying...</span>
    </v-btn>
    <canvas id="myCanvas" height="700"></canvas>
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
      redrawTimeout: null 
    }
  },
  async created() {
    this.initData()
  },
  mounted() {
    // this.$root.$on('play-explanation', this.playAnimation)
    this.canvas = document.getElementById('myCanvas')
    this.ctx = this.canvas.getContext('2d')
    this.rescaleCanvas()
    window.addEventListener('resize', this.rescaleCanvas, false)
  },
  methods: {
    async initReplayLogic() {
      this.isReplaying = true
      await this.quickplay()
      this.isReplaying = false 
    },
    async handleDeletion() {
      console.log('handleDeletion()')
      await db.collection('explanations').doc(this.explanationId).delete()
      console.log('successfully deleted document')
    },
    async initData() {
      if (this.ctx) {
        // already loaded an explanation before, visually wipe previous drawings
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
      }
      this.allStrokes = [] 
      const strokesRef = db.collection('explanations').doc(this.explanationId).collection('strokes').orderBy('strokeNumber', 'asc')
      await this.$binding('allStrokes', strokesRef)
      this.$root.$emit('finish-loading-animation')
      this.drawStrokesInstantly()
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
