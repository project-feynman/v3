<template>
  <div style="height: 100%">
    <div @click="$emit('click')" @mouseover="mouseHover = true" @mouseleave="mouseHover = false" style="height: 100%; width: 100%;">
      <canvas
        :id="`myCanvas-${blackboardId}`"
        style="width: 100%; height: 1; background-color: rgb(62, 66, 66)"
      ></canvas>
    </div>
    <AudioRecorder
      v-if="audioUrl" :audioUrl="audioUrl" ref="audioRecorder"
      @recorder-loading="hasFetchedAudio = false" @recorder-loaded="hasFetchedAudio = true"
      @play="handlePlay()" @stop="handleStop()" @seeking="handleSeeking()"
    />
  </div>
</template>

<script>
import DoodleVideoOverlay from "@/components/DoodleVideoOverlay.vue";
import AudioRecorder from "@/components/AudioRecorder.vue";
import helpers from "@/helpers.js";
import CanvasDrawMixin from "@/mixins/CanvasDrawMixin.js";

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
    thumbnail: String,
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
  mixins: [CanvasDrawMixin],
  data: () => ({
    canvas: null,
    ctx: null,
    hasFetchedStrokes: false,
    hasFetchedAudio: false,
    allStrokes: [],
    allFrames: [],
    hasPreparedFrames: false,
    isQuickplaying: false,
    recursiveSync: null,
    mouseHover: false,
    nextFrameIdx: 0,
    getTimeInSeconds: null
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
    hasLoadedAvailableResources () { this.$emit("available-resources-ready"); }
  },
  async created () {
    if (this.thumbnail) { return; }
    this.fetchStrokes();  // auto-fetch strokes if no thumbnail is available
  },
  async mounted () {
    this.canvas = document.getElementById(`myCanvas-${this.blackboardId}`);
    this.ctx = this.canvas.getContext("2d");
    await this.setCanvasHeight(); // just for video: blackboard should fill space
    this.rescaleCanvas(false);
    window.addEventListener("resize", this.handleResize);
  },
  destroyed () {
    window.removeEventListener("resize", this.handleResize);
  },
  methods: {
    setCanvasHeight () {
      const setHeight = resolve => {
        const { scrollHeight, scrollWidth } = this.canvas;
        if (Math.round(scrollHeight) === Math.round(0.6*scrollWidth)) {
          return;
        }
        this.canvas.height = 9/16 * scrollWidth;
        resolve();
      }
      return new Promise(resolve => setTimeout(setHeight(resolve), 0));
    },
    async fetchStrokes () {
      const promise = new Promise(async resolve => {
        if (!this.blackboardId) {
          resolve();
          return;
        }
        const strokesRef = this.blackboardRef.collection("strokes")
          .orderBy("strokeNumber", "asc");
        this.allStrokes = await helpers.getCollectionFromDB(strokesRef);
        this.$nextTick(() => {
          if (this.allStrokes.length === 0) { return; }
          this.hasFetchedStrokes = true;
          this.rescaleCanvas(true);
          this.$emit("strokes-ready")
        });
        resolve();
      });
      return promise;
    },
    playGivenWhatIsAvailable () { // called because the video is ready to play i.e. hasOverlay === true
      if (!this.hasLoadedAvailableResources) { return; }
      else if (this.hasVisualAndAudio) { this.$refs.audioRecorder.playAudio(); }// silent animation
      else if (this.blackboardId) { this.quickplay(); }
    },
    async quickplay () {
      if (!this.hasFetchedStrokes) { return; }
      this.isQuickplaying = true;
      await this.quickplay();
      this.isQuickplaying = false;
    },
    handleResize () {
      // If we are in playback, just resize, stop, reset, and play. This will re-render. Otherwise, redraw everything.
      if (this.recursiveSync) {
        this.rescaleCanvas(false); // redraw = false
        this.handleStop();
        this.nextFrameIdx = 0; // need to redraw previous progress 
        this.syncContinuously();
      }
      else this.rescaleCanvas(true); // redraw = true
    },
    handlePlay () {
      // TODO: handlePlay() is called twice because the audio player has an @play event
      // First reset, in case the user is playing the video for the second time
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); // Clear the initial preview or completed video.
      this.nextFrameIdx = 0;

      const { audioRecorder } = this.$refs;
      if (!this.hasPreparedFrames) { // create the frames and order them by time
        this.prepareFrames(audioRecorder.getAudioTime);
        this.hasPreparedFrames = true;
      }
      if (!this.recursiveSync) { this.syncContinuously(); }
      // this.recursiveSync = setTimeout(this.keepSyncing, 0);
      audioRecorder.playAudio();
    },
    handleStop () {
      clearTimeout(this.recursiveSync); // stop recursive call
      this.recursiveSync = null;
    },
    handleSeeking () {
      this.handleStop();
      const onlyOneFrame = true;
      this.syncContinuously(onlyOneFrame);
    },
    prepareFrames (getTimeInSeconds) {
      // Create ordering of frames in `[[strokeIndex, pointIndex], ...]` format.
      this.allFrames = [];
      for (let i = 0; i < this.allStrokes.length; i++) {
        for (let j = 1; j < this.allStrokes[i].points.length; j++) {
          this.allFrames.push([i, j]);
        }
      }
      this.allFrames.sort((a, b) => this.frameStartTime(a) - this.frameStartTime(b));
      // Update the shared time method.
      this.getTimeInSeconds = getTimeInSeconds;
      this.nextFrameIdx = 0;
    },
    frameStartTime (frame) {
      const strokeIndex = frame[0];
      const pointIndex = frame[1];
      const stroke = this.allStrokes[strokeIndex];
      return stroke.startTime + (pointIndex - 1) * this.getPointDuration(stroke);
    },
    // Synchronize drawings with the audio on a point-by-point basis.
    syncContinuously (once = false) {
      const n = this.allFrames.length;
      const currentTime = this.getTimeInSeconds();
      // console.log(this.frameStartTime(this.allFrames[this.nextFrameIdx - 1]));
      if (this.nextFrameStartTime() <= currentTime) {
        console.log("if clause");
        // The next frame should already have been rendered. Therefore, the visual needs to catch up. Draw until the we
        // reach a frame that should not be visible yet.
        for (let i = this.nextFrameIdx; i < n; i++) {
          const frameStart = this.nextFrameStartTime();
          if (frameStart > currentTime) { break; }
          this.renderFrame(this.allFrames[i]);
          this.nextFrameIdx += 1;
        }
      } else if (this.nextFrameIdx > 0
        && this.frameStartTime(this.allFrames[this.nextFrameIdx - 1]) > currentTime) {
        console.log("else if");
        // It's `nextFrameIdx - 1` because that is the index of current frame! Most recent i.e. current stroke on
        // canvas no longer belongs. However, this doesn't apply if there are no frames rendered at all. Reset canvas
        // and frames.

        // TODO: figure out why sometimes canvas.height is undefined
        // De-draw all frames to the current time.
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.nextFrameIdx = 0;
        for (const frame of this.allFrames) {
          if (this.frameStartTime(frame) > currentTime) {
            break;
          }
          this.renderFrame(frame);
          this.nextFrameIdx += 1;
        }
      }
      // sync continuously, unless "once" is true
      if (this.nextFrameIdx !== n && !once) {
        console.log("last block")
        // TODO: never catches up to n for some reason
        // The event loop takes some time, so we wait AT LEAST the timeout duration
        let timeout = 1000 * (this.nextFrameStartTime() - this.getTimeInSeconds()); // recompute the current time here.
        if (timeout < 0) { timeout = 0; }
        this.recursiveSync = setTimeout(this.syncContinuously, timeout); // use recursion instead of `setInterval` to prevent overlapping calls
      }
    },
    renderFrame (frame) {
      const strokeIndex = frame[0];
      const pointIndex = frame[1];
      const stroke = this.allStrokes[strokeIndex];
      this.setStyle(stroke.color, stroke.lineWidth); // since multiple strokes can be drawn simultaneously.
      this._stroke(stroke.points, pointIndex, stroke.isErasing);
    },
    nextFrameStartTime () {
      if (this.nextFrameIdx === this.allFrames.length) { 
        console.log("frameStartTime is infinity")
        return Infinity; // We finished the last frame. The next frame should never start.
      } 
      // console.log("frameStartTime", this.frameStartTime(this.allFrames[this.nextFrameIdx]))
      return this.frameStartTime(this.allFrames[this.nextFrameIdx]);
    },
    // Internal stroke method for drawing a line between two points.
    // The color and line width should be set before calling this method.
    _stroke (points, i, isErasing) {
      const prevPoint = points[i - 1]; // this fails silently for the first point of the stroke i = 0
      const prevX = prevPoint.unitX * this.canvas.width;
      const prevY = prevPoint.unitY * this.canvas.height;

      const curPoint = points[i];
      const curX = curPoint.unitX * this.canvas.width;
      const curY = curPoint.unitY * this.canvas.height;

      this.ctx.globalCompositeOperation = isErasing ? 'destination-out' : 'source-over';
      this.ctx.beginPath();
      this.ctx.moveTo(prevX, prevY);
      this.ctx.lineTo(curX, curY);
      this.ctx.stroke();
    }
  }
}
</script>
