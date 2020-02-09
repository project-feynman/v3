<template>
  <div style="height: 100%">
    <!-- Uncomment below to debug -->
    <!-- <p>strokes: {{ strokes }}</p> -->
    <!-- <DoodleVideoOverlay :overlay="false" @play-video="playVideo()"> -->
      <canvas
        :id="`myCanvas-${canvasId}`"
        style="width: 100%; height: 1; background-color: rgb(62, 66, 66)"
      ></canvas>
    <!-- </DoodleVideoOverlay> -->
  </div>
</template>

<script>
import DoodleVideoOverlay from "@/components/DoodleVideoOverlay.vue";
import DrawMethods from "@/mixins/DrawMethods";

export default {
  props: {
    strokes: Array,
    canvasId: {
      type: String,
      default () { 
        return "1";
      }
    },
    // overlay: Boolean,
    height: String,
  },
  components: {
    DoodleVideoOverlay
  },
  mixins: [DrawMethods],
  data () {
    return {
      isReplaying: false,
      allStrokes: [],
      overlay: false,
      timer: null,
      // currentTime: 0,
      idx: 0,
      index: 0,
      canvas: null,
      ctx: null,
      lastX: -1,
      lastY: -1,
      redrawTimeout: null,
      interval: null
    };
  },
  created () {
    this.initData();
  },
  async mounted () {
    this.canvas = document.getElementById(`myCanvas-${this.canvasId}`);
    this.ctx = this.canvas.getContext("2d");
    // TODO: modify this so the height is automatically adjusted based on the the available width the video can occupy
    await this.setCanvasHeight();
    this.rescaleCanvas(true);
    this.overlay = true;
  },
  methods: {
    setCanvasHeight () {
      const setHeight = resolve => {
        const correctHeight = 0.65 * this.canvas.scrollWidth;
        if (Math.round(this.canvas.scrollHeight) === Math.round(correctHeight)) return;
        this.canvas.height = correctHeight;
        resolve();
      }
      return new Promise(resolve => setTimeout(setHeight(resolve), 0));
    },
    startVideo () {
      this.$emit("play-video");
      this.overlay = false;
    },
    async quickplayVideo() {
      this.overlay = false;
      await this.quickplay();
      this.overlay = true;
    },
    async initData () {
      if (!this.strokes) return;
      this.indexOfNextStroke = 0;
      this.allStrokes = this.strokes;
      this.$emit("animation-loaded");
    }
  }
};
</script>


