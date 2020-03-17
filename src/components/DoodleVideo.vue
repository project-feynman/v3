<template>
  <div ref="VideoWrapper" class="video-wrapper">
    <div ref="CanvasWrapper" style="position: relative;">
      <canvas ref="FrontCanvas" class="front-canvas"></canvas>
      <canvas ref="BackCanvas" class="background-canvas"></canvas>
    </div>
    <!-- load the audio, but do not let user use the slider until strokes are loaded -->
    <audio v-if="audioUrl" v-show="strokesArray.length > 0"
      :src="audioUrl" 
      @canplay="playAudio()"
      @play="initSyncing()"
      @seeking="syncStrokesToAudio()"
      ref="AudioPlayer" 
      style="width: 100%;"
      controls="true"
    />
  </div>
</template>

<script>
import CanvasDrawMixin from "@/mixins/CanvasDrawMixin.js";
import _ from "lodash";
import { navbarHeight, audioPlayerHeight, aspectRatio } from "@/CONSTANTS.js";

export default {
  props: {
    strokesArray: Array,
    audioUrl: String,
    backgroundUrl: String,
  },
  mixins: [CanvasDrawMixin],
  data: () => ({
    canvas: null,
    ctx: null,
    bgCanvas: null,
    bgCtx: null,
    nextFrameIdx: 0, 
    recursiveSyncer: null
  }),
  computed: {
    /* Converts separate strokes into continuous points */
    allFrames () {
      const allPoints = [];
      for (let i = 0; i < this.strokesArray.length; i++) {
        for (let j = 1; j < this.strokesArray[i].points.length; j++) {
          const frame = { strokeIndex: i, pointIndex: j };
          allPoints.push({ 
            startTime: this.getStartTime(frame),
            ...frame, 
          }); 
        }
      }
      return allPoints.sort((p1, p2) => p1.startTime - p2.startTime);
    }
  },
  async created () {
    // this.syncStrokesToAudio = _.debounce(this.syncStrokesToAudio, 0);
  },
  async mounted () {
    this.canvas = this.$refs.FrontCanvas;
    this.bgCanvas = this.$refs.BackCanvas;
    this.ctx = this.canvas.getContext("2d");
    this.bgCtx = this.bgCanvas.getContext("2d");
    await this.handleResize();
    if (!this.audioUrl) {
      this.$_quickplay();
    }
    // if I put the below line before $_quickplay then the debounce will mess up the await 
    this.handleResize = _.debounce(this.handleResize, 100); 
    window.addEventListener("resize", this.handleResize);
  },
  beforeDestroy () {
    window.removeEventListener("resize", this.handleResize);
  },
  methods: {
    playAudio () {
      this.$refs.AudioPlayer.play();
    },
    // TODO: touch to play or pause
    getStartTime ({ strokeIndex, pointIndex }) {
      const stroke = this.strokesArray[strokeIndex];
      return stroke.startTime + (pointIndex - 1) * this.$_getPointDuration(stroke);
    },
    handleResize () {
      return new Promise(async (resolve) => {
        this.resizeVideo();
        this.$_rescaleCanvas();
        await this.renderBackground();
        if (this.recursiveSyncer) {
          this.nextFrameIdx = 0; // need to redraw previous progress 
          this.syncStrokesToAudio();
        } else {
          this.$_drawStrokesInstantly();
        }
        resolve();
      })
    },
    resizeVideo () {
      const { CanvasWrapper, VideoWrapper } = this.$refs;
      VideoWrapper.style.width = "100%";
      const availableWidth = VideoWrapper.offsetWidth; 
      const availableHeight = window.innerHeight - navbarHeight - audioPlayerHeight;
      let videoHeight; 
      let videoWidth; 

      if (availableWidth * aspectRatio < availableHeight) {
        videoWidth = availableWidth;
        videoHeight = videoWidth * aspectRatio;
      } else {
        videoHeight = availableHeight;
        videoWidth = videoHeight * (1/aspectRatio);
      }

      CanvasWrapper.style.height = `${videoHeight}px`;
      this.canvas.style.height = `${videoHeight}px`;
      this.bgCanvas.style.height = `${videoHeight}px`;
      VideoWrapper.style.width = `${videoWidth}px`;
    },
    renderBackground () {
      return new Promise((resolve) => {
        if (!this.backgroundUrl) resolve();
        const image = new Image();
        image.src = this.backgroundUrl;
        this.bgCanvas.width = this.canvas.width;
        this.bgCanvas.height = this.canvas.height;
        const { width, height } = this.bgCanvas;
        image.onload = () => {
          this.bgCtx.drawImage(image, 0, 0, width, height);
          resolve();
        } 
      });
    },
    initSyncing () {
      this.nextFrameIdx = 0;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); // video could already be rendered as an initial preview or completed video
      this.syncRecursively();
    },
    syncRecursively () {
      this.syncStrokesToAudio();
      if (this.nextFrameIdx < this.allFrames.length) {
        // calculate sleep duration
        const nextFrame = this.allFrames[this.nextFrameIdx];
        const { currentTime } = this.$refs.AudioPlayer;
        const timeout = 1000 * (nextFrame.startTime - currentTime); 
        // call itself after sleeping
        this.recursiveSyncer = setTimeout(this.syncRecursively, timeout); // use recursion instead of `setInterval` to prevent overlapping calls
      }
    },
    syncStrokesToAudio () {
      const { currentTime } = this.$refs.AudioPlayer;
      const nextFrame = this.allFrames[this.nextFrameIdx];
      if (!nextFrame || nextFrame.startTime > currentTime) { // !nextFrame: nextFrame is undefined after a video finishes
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.nextFrameIdx = 0;
      }
      this.renderFramesUntilCurrentTime();
    },
    renderFramesUntilCurrentTime () {
      const { currentTime } = this.$refs.AudioPlayer;
      for (let i = this.nextFrameIdx; i < this.allFrames.length; i++) {
        const frame = this.allFrames[i];
        if (frame.startTime > currentTime) { 
          break; 
        }
        this.renderFrame(frame);
        this.nextFrameIdx += 1;
      }
    },
    renderFrame ({ strokeIndex, pointIndex }) {
      const stroke = this.strokesArray[strokeIndex];
      this.$_setStyle(stroke.color, stroke.lineWidth); // since multiple strokes can be drawn simultaneously.
      this.$_connectTwoPoints(stroke.points, pointIndex, stroke.isErasing);
    }
  }
}
</script>

<style scoped>
.video-wrapper {
  height: 100%; 
  width: 100%; 
  position: relative; 
  z-index: 5; 
  margin: auto;
}
.doodle-video {
  height: 100%; 
  width: 100%;
  position: relative; 
  z-index: 5; 
  margin: auto;
}
.canvas-wrapper {
  width: 100%;
  height: 100%; 
  position: relative;
}
.front-canvas {
  width: 100%; 
  height: 1; 
  background-color: transparent; 
  display: block;
}
.background-canvas {
  /* absolute places the background relative to the parent and ignore the front canvas, thereby stacking on top of each other */
  position: absolute; 
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  background-color: rgb(62, 66, 66);
}
</style>
