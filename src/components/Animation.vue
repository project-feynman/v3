<template>
  <div id="whiteboard">
    <canvas id="myCanvas" 
            style="width: 100%;
                   height: 75vh;
                   background-color: rgb(192, 230, 253);">
    </canvas>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import DrawMethods from '@/mixins/DrawMethods'
import db from '@/database.js'

export default {
  props: ['explanationId', 'strokes', 'workspaceId'],
  watch: {
    explanationId: {
      handler: 'initData',
      immediate: true 
    },
    allStrokes() {
      if (this.playProgress) {
        console.log('removing playProgress()')
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
      playProgress: null,
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
  mounted() {
    this.$root.$on('whiteboard-closed', () => {
      this.initData()
    })
    this.canvas = document.getElementById('myCanvas')
    this.ctx = this.canvas.getContext('2d')
    this.rescaleCanvas() // should rename to rescale and redraw
    window.addEventListener('resize', this.rescaleCanvas, false)
  },
  beforeDestroy() {
    // clean up everything - needs testing
    if (this.playProgress) {
      clearInterval(this.playProgress)
    }
  },
  methods: {
    async initData() {
      this.indexOfNextStroke = 0
      this.$emit('animation-loading')
      if (this.ctx) {
        // already loaded an explanation before, visually wipe previous drawings
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
      }
      if (this.strokes) {
        this.allStrokes = this.strokes
        this.$emit('animation-loaded')
      }
    }
  }
}
</script>


