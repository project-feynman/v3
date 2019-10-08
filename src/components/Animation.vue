<template>
  <div id="whiteboard" style="height: 100%">
    <!-- <vuetify-overlay v-if="isFullscreen" :overlay="overlay" @play-video="playVideo()"> -->
      <canvas 
        v-if="isFullscreen"
        :id="`myCanvas-${canvasID}`"  
        style="width: 100%; height: 90vh; background-color: rgb(62, 66, 66)"
      >
      </canvas>
      <vuetify-overlay v-else :overlay="overlay" @play-video="playVideo()">
 
        <canvas 
          :id="`myCanvas-${canvasID}`" 
          style="width: 100%; height: 100%; background-color: rgb(62, 66, 66)"
        >
        </canvas>

      </vuetify-overlay>

  </div>
</template>

<script>
import VuetifyOverlay from "@/components/VuetifyOverlay.vue"
import { mapState } from 'vuex'
import DrawMethods from '@/mixins/DrawMethods'
import db from '@/database.js'

export default {
  props: {
    strokes: Array,
    autoplay: Boolean,
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
    VuetifyOverlay
  },
  mixins: [DrawMethods],
  watch: {
    strokes: {
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
    }
  },
  data () {
    return {
      overlay: true,
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
    this.$root.$on('whiteboard-closed', () => {
      this.initData()
    })
    this.canvas = document.getElementById(`myCanvas-${this.canvasID}`)
    this.ctx = this.canvas.getContext('2d')
    if (this.autoplay) {
      this.rescaleCanvas(false)
      setTimeout(this.quickplay, 1000)
    } else {
      this.rescaleCanvas() // should rename to rescale and redraw
    }
    window.addEventListener('resize', this.rescaleCanvas, false)
  },
  beforeDestroy () {
    // clean up everything - needs testing
    if (this.playProgress) {
      clearInterval(this.playProgress)
    }
  },
  methods: {
    async playVideo () {
      this.overlay = false 
      await this.quickplay()
      this.overlay = true 
    },
    async initData () {
      if (!this.strokes) {
        return 
      }
      this.indexOfNextStroke = 0
      this.allStrokes = this.strokes
      this.$emit('animation-loaded')
      if (this.ctx) {
        // already loaded an explanation before, visually wipe previous drawings
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        this.rescaleCanvas()
      }
    }
  }
}
</script>

<style>
/* .yellow-square {
  background-color: #FFDC00;
  display: inline-block;
  z-index: 1000;
  width: 50px;
  height: 50px;
  margin: 0 auto;
}

.cn {
  display: table-cell;
  width: 500px;
  height: 500px;
  vertical-align: middle;
  text-align: center;
} */
</style>



