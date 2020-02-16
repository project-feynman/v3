<template>
  <div style="height: 100%; position: relative; z-index: 5">
    <div @click="$emit('click')" @mouseover="mouseHover = true" @mouseleave="mouseHover = false" style="height: 100%; width: 100%;">
      <div id="blackboard-wrapper" style="position: relative;">
        <canvas
          :id="`myCanvas-${blackboardId}`"
          style="width: 100%; height: 1; background-color: transparent; display: block;"
        ></canvas>
        <canvas 
          :id="`background-canvas-${blackboardId}`"
          class="background-canvas"
        ></canvas>
      </div>
    </div>
    <AudioRecorder
      v-if="audioUrl" :audioUrl="audioUrl" ref="audioRecorder"
      @loading="hasFetchedAudio = false" @loaded="hasFetchedAudio = true"
      @play="playVideo()" @stop="stopSyncing()" @seeking="handleSeeking()"
    />
  </div>
</template>

<script>
import DoodleVideoOverlay from "@/components/DoodleVideoOverlay.vue";
import AudioRecorder from "@/components/AudioRecorder.vue";
import CanvasDrawMixin from "@/mixins/CanvasDrawMixin.js";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";

export default {
  props: {
    blackboardRef: {
      type: Object,
      required: true
    },
    blackboardId: {
      type: String,
      required: true
    },
    thumbnail: String, // will soon be a required prop
    imageUrl: String,
    audioUrl: String,
    hasBetaOverlay: {
      type: Boolean,
      default () { return false; }
    }
  },
  components: {
    DoodleVideoOverlay,
    AudioRecorder
  },
  mixins: [CanvasDrawMixin, DatabaseHelpersMixin],
  data: () => ({
    canvas: null,
    ctx: null,
    bgCanvas: null,
    bgCtx: null,
    hasFetchedStrokes: false,
    hasFetchedAudio: false,
    allStrokes: [],
    allFrames: [],
    isQuickplaying: false,
    mouseHover: false,
    nextFrameIdx: 0,
    recursiveSync: null,
    getCurrentAudioTime: null
  }),
  computed: {
    // hasOverlay () {
    //   return this.hasLoadedAvailableResources && (!this.recursiveSync && !this.isQuickplaying)
    // },
    hasLoadedAvailableResources () {
      return (this.hasFetchedAudio || !this.audioUrl)
        && (this.hasFetchedStrokes || !this.blackboardId)
    },
    hasVisualAndAudio () { return this.hasFetchedStrokes && this.hasFetchedAudio; }
  },
  watch: {
    mouseHover () { this.$emit("mouse-change", this.mouseHover); },
    hasVisualAndAudio () { this.$emit("visual-audio-ready"); },
    hasLoadedAvailableResources () { this.$emit("available-resources-ready"); },
    // Uncomment below for painless debugging
    // nextFrameIdx () { console.log(`nextFrameIdx = ${this.nextFrameIdx}`)}
  },
  async created () {
    if (!this.thumbnail) { this.fetchStrokes(); } 
  },
  async mounted () {
    this.canvas = document.getElementById(`myCanvas-${this.blackboardId}`);
    this.ctx = this.canvas.getContext("2d");
    this.bgCanvas = document.getElementById(`background-canvas-${this.blackboardId}`);
    this.bgCtx = this.bgCanvas.getContext("2d");
    await this.setCanvasHeight(); // just for video: blackboard should fill space
    this.$_drawMixin_rescaleCanvas(false);
    this.$_drawMixin_displayImage(this.imageUrl);
    window.addEventListener("resize", this.handleResize);
  },
  destroyed () {
    window.removeEventListener("resize", this.handleResize);
  },
  methods: {
    setCanvasHeight () {
      const setHeight = resolve => {
        const { scrollHeight, scrollWidth } = this.canvas;
        if (Math.round(scrollHeight) !== Math.round((9/16)*scrollWidth)) {
          this.canvas.height = (9/16) * scrollWidth;
          resolve();
        }
      }
      return new Promise(resolve => setTimeout(setHeight(resolve), 0));
    },
    async fetchStrokes () {
      return new Promise(async resolve => {
        const strokesRef = this.blackboardRef.collection("strokes").orderBy("strokeNumber", "asc");
        this.allStrokes = await this.$_dbMixin_getDocs(strokesRef);
        this.$nextTick(() => {
          this.hasFetchedStrokes = true;
          this.$_drawMixin_rescaleCanvas(true);
          this.$emit("strokes-ready")
        });
        resolve();
      });
    },
    playGivenWhatIsAvailable () { 
      if (this.hasVisualAndAudio) { this.$refs.audioRecorder.playAudio(); }
      else { this.playSilentAnimation(); }
    },
    async playSilentAnimation () {
      this.isQuickplaying = true;
      await this.$_drawMixin_quickplay();
      this.isQuickplaying = false;
    },
    handleResize () {
      if (this.recursiveSync) {
        this.$_drawMixin_rescaleCanvas(false); // redraw = false
        this.stopSyncing();
        this.nextFrameIdx = 0; // need to redraw previous progress 
        this.syncContinuously();
      }
      else { this.$_drawMixin_rescaleCanvas(true); } // redraw = true
    },
    playVideo () {
      const { audioRecorder } = this.$refs;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); // video could already be rendered as an initial preview or completed video
      this.nextFrameIdx = 0;
      if (this.allFrames.length === 0) { this.prepareFrames(); }
      if (!this.getCurrentAudioTime) { this.getCurrentAudioTime = audioRecorder.getAudioTime; }
      if (!this.recursiveSync) { this.syncContinuously(); }
      audioRecorder.playAudio();
    },
    stopSyncing () {
      clearTimeout(this.recursiveSync); // stop recursive call
      this.recursiveSync = null;
    },
    handleSeeking () {
      this.stopSyncing();
      const onlyOneFrame = true;
      this.syncContinuously(onlyOneFrame);
    },
    /* Converts our array of separate strokes into an array of continuous points
    sorted by timestamp. Frames are in a `[{strokeIndex, pointIndex}, ...]` format
    @params: "this.allStrokes"
    @returns: mutates "this.allFrames" 
    */
    prepareFrames () {
      for (let i = 0; i < this.allStrokes.length; i++) {
        for (let j = 1; j < this.allStrokes[i].points.length; j++) {
          this.allFrames.push({ strokeIndex: i, pointIndex: j }); 
        }
      }
      this.allFrames.sort((f1, f2) => this.getStartTime(f1) - this.getStartTime(f2));
    },
    getStartTime ({ strokeIndex, pointIndex }) {
      const stroke = this.allStrokes[strokeIndex];
      return stroke.startTime + (pointIndex - 1) * this.$_drawMixin_getPointDuration(stroke);
    },
    // Synchronize drawings with the audio on a point-by-point basis.
    // TODO: never catches up to n for some reason when there are multiple DoodleVIdeos
    syncContinuously (once = false) {
      const nextFrame = this.allFrames[this.nextFrameIdx];
      if (!nextFrame) { return; }
      if (this.getStartTime(nextFrame) > this.getCurrentAudioTime()) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.nextFrameIdx = 0;
      }
      this.renderFramesUntilCurrentTime();
      if (!once && this.nextFrameIdx < this.allFrames.length) {
        let timeout = 1000 * (this.getStartTime(nextFrame) - this.getCurrentAudioTime()); 
        this.recursiveSync = setTimeout(this.syncContinuously, timeout); // use recursion instead of `setInterval` to prevent overlapping calls
      } 
    },
    renderFramesUntilCurrentTime () {
      for (let i = this.nextFrameIdx; i < this.allFrames.length; i += 1) {
        const frame = this.allFrames[i];
        if (this.getStartTime(frame) > this.getCurrentAudioTime()) { 
          break; 
        }
        this.renderFrame(frame);
        this.nextFrameIdx += 1;
      }
    },
    renderFrame ({ strokeIndex, pointIndex }) {
      const stroke = this.allStrokes[strokeIndex];
      this.$_drawMixin_setStyle(stroke.color, stroke.lineWidth); // since multiple strokes can be drawn simultaneously.
      this.$_drawMixin_connectTwoPoints(stroke.points, pointIndex, stroke.isErasing);
    }
  }
}
</script>

<style>
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
