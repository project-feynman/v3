<template>
  <div @click="handleClick()" style="height: 100%">
    <DoodleVideoOverlay v-if="isFullscreen" :overlay="overlay" @play-video="startVideo()">
      <canvas
        v-if="isFullscreen"
        :id="`myCanvas-${canvasID}`"
        style="width: 100%; height: 90vh; background-color: rgb(62, 66, 66)"
      ></canvas>
    </DoodleVideoOverlay>
    <!-- <DoodleVideoOverlay v-else :overlay="false" @play-video="playVideo()"> -->
    <canvas
      v-else
      :id="`myCanvas-${canvasID}`"
      style="width: 100%; height: 100%; background-color: rgb(62, 66, 66)"
    ></canvas>
    <!-- </DoodleVideoOverlay> -->
  </div>
</template>

<script>
import DoodleVideoOverlay from "@/components/DoodleVideoOverlay.vue";
import { mapState } from "vuex";
import DrawMethods from "@/mixins/DrawMethods";
import db from "@/database.js";

export default {
  props: {
    strokes: Array,
    autoplay: Boolean,
    height: String,
    // overlay: Boolean,
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
    DoodleVideoOverlay
  },
  mixins: [DrawMethods],
  computed: {
    ...mapState(["user"])
  },
  data () {
    return {
      isReplaying: false,
      allStrokes: [],
      overlay: false,
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
    };
  },
  created () {
    this.initData();
  },
  mounted () {
    this.canvas = document.getElementById(`myCanvas-${this.canvasID}`);
    this.ctx = this.canvas.getContext("2d");
    this.canvas.height = this.height;
    this.rescaleCanvas(false);
    if (this.autoplay) setTimeout(this.quickplay, 1000);
    else this.drawStrokesInstantly();
    this.overlay = true;
    window.addEventListener("resize", this.rescaleCanvas, false);
  },
  methods: {
    startVideo() {
      this.$emit("play-video");
      this.overlay = false;
    },
    async quickplayVideo() {
      this.overlay = false;
      await this.quickplay();
      this.overlay = true;
    },
    renderAllStrokes() {
      // TODO: rename "rescaleCanvas"
      this.rescaleCanvas(true);
    },
    async initData() {
      if (!this.strokes) { return };
      this.indexOfNextStroke = 0;
      this.allStrokes = this.strokes;
      this.$emit("animation-loaded");
    },
    handleClick () {
      this.$emit('canvas-clicked');
    }
  }
};
</script>


