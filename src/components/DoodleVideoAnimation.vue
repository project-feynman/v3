<template>
  <div id="whiteboard" style="height: 100%">
    <BaseOverlay v-if="isFullscreen" :overlay="isOverlayed" @play-video="startVideo()">
      <canvas 
        v-if="isFullscreen"
        :id="`myCanvas-${canvasID}`"  
        style="width: 100%; height: 90vh; background-color: rgb(62, 66, 66)"
      >
      </canvas>
    </BaseOverlay>
    <BaseOverlay v-else :overlay="isOverlayed" @play-video="playVideo()">
      <canvas 
        :id="`myCanvas-${canvasID}`" 
        style="width: 100%; height: 100%; background-color: rgb(62, 66, 66)"
      >
      </canvas>
    </BaseOverlay>
  </div>
</template>

<script>
import BaseOverlay from "@/components/BaseOverlay.vue"
import { mapState } from 'vuex'
import DrawMethods from '@/mixins/DrawMethods'
import db from '@/database.js'

export default {
  props: {
    strokes: Array,
    autoplay: Boolean,
    height: String,
    overlay: Boolean,
    isFullscreen: {
      type: Boolean,
      default: true
    },
    canvasID: {
      type: String,
      default: "1"
    }
  },
  components: {
    BaseOverlay
  },
  mixins: [DrawMethods],
  watch: {
    strokesReady: {
      handler: 'initData',
      immediate: true 
    },
    allStrokes () {
      if (this.playProgress) {
        clearInterval(this.playProgress)
        this.playProgress = null 
        console.log('terminated playProgress()')
      }
    }
  },
  computed: {
    ...mapState(['user']),
    author () {
      return {
        name: this.user.displayName,
        uid: this.user.uid
      }
    },
    isOverlayed(){
        return this.overlay
    }
  },
  data () {
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
  mounted () {
    this.canvas = document.getElementById(`myCanvas-${this.canvasID}`)
    this.ctx = this.canvas.getContext('2d')
    this.canvas.height = this.height
    if (this.autoplay) {
      this.rescaleCanvas(false)
      setTimeout(this.quickplay, 1000)
    } else {
      this.rescaleCanvas() // should rename to rescale and redraw
    }
    window.addEventListener('resize', this.rescaleCanvas, false) // good
  },
  beforeDestroy () {
    // clean up everything - needs testing
    if (this.playProgress) {
      clearInterval(this.playProgress)
    }
  },
  methods: {
    startVideo () {
      this.$emit('play-video')
      this.isOverlayed = false
    },
    async playVideo () {
      this.isOverlayed = false 
      await this.quickplay()
      this.isOverlayed = true 
    },
    async initData () {
      if (!this.strokes) {
        return 
      }
      this.indexOfNextStroke = 0
      this.allStrokes = this.strokes
      
      if (this.ctx) {
        // already loaded an explanation before, visually wipe previous drawings
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        // this.rescaleCanvas()
      }

      this.$emit('animation-loaded')
    }
  }
}
</script>


