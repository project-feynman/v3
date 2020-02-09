<template>
  <div style="height: 100%">
    <div 
      @click="$emit('click')" 
      @mouseover="mouseHover = true" 
      @mouseleave="mouseHover = false" 
      style="height: 100%; width: 100%;"
    >
      <!-- Render thumbnail on the canvas -->
      <canvas
        :id="`myCanvas-${blackboardId}`"
        style="width: 100%; height: 1; background-color: rgb(62, 66, 66)"
      ></canvas>
    </div>
    <AudioRecorder
      v-if="audioUrl"
      :audioUrl="audioUrl"
      @recorder-loading="hasFetchedAudio = false"
      @play="handlePlay()"
      @stop="handleStop()"
      @seeking="handleSeeking()"
      @recorder-loaded="hasFetchedAudio = true"
      ref="audioRecorder"
    />
  </div>
</template>

<script>
import db from "@/database.js";
import DoodleVideoOverlay from "@/components/DoodleVideoOverlay.vue";
import AudioRecorder from "@/components/AudioRecorder.vue";
import firebase from "firebase/app";
import "firebase/storage";
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
      default () {
        return false;
      }
    }
  },
  components: {
    DoodleVideoOverlay,
    AudioRecorder
  },
  mixins: [CanvasDrawMixin],
  data () {
    return {
      canvas: null,
      ctx: null,
      hasFetchedStrokes: false,
      hasFetchedAudio: false,
      allStrokes: [],
      hasPreparedFrames: false,
      isQuickplaying: false,
      recursiveSync: null,
      mouseHover: false,
      indexOfNextStroke: 0,
      indexOfNextPoint: 0,
    }
  },
  computed: {
    hasOverlay () {
      return this.hasLoadedAvailableResources && (!this.isSyncing && !this.isQuickplaying)
    },
    hasLoadedAvailableResources () {
      return (this.hasFetchedAudio || !this.audioUrl) 
        && (this.hasFetchedStrokes || !this.blackboardId)
    },
    hasVisualAndAudio () {
      return this.hasFetchedStrokes && this.hasFetchedAudio
    }
  },
  watch: {
    mouseHover () {
      this.$emit("mouse-change", this.mouseHover);
    },
    hasVisualAndAudio () {
      this.$emit("visual-audio-ready");
    },
    hasLoadedAvailableResources () {
      this.$emit("available-resources-ready");
    }
  },
  async created () {
    if (this.thumbnail) return;
    this.fetchStrokes();  // auto-fetch strokes if no thumbnail is available
  },
  async mounted () {
    this.canvas = document.getElementById(`myCanvas-${this.blackboardId}`);
    this.ctx = this.canvas.getContext("2d");
    await this.setCanvasHeight(); // just for video: blackboard should fill space
    this.rescaleCanvas(false);
    window.addEventListener("resize", this.resizeVideo);
  },
  destroyed () {
    window.removeEventListener("resize", this.resizeVideo);
  },
  methods: {
    setCanvasHeight () {
      const setHeight = resolve => {
        const { scrollHeight, scrollWidth } = this.canvas; 
        if (Math.round(scrollHeight) === Math.round(0.6*scrollWidth)) {
          return;
        }
        this.canvas.height = 0.6*scrollWidth;
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
        const strokesRef = this.blackboardRef.collection("strokes").orderBy("strokeNumber", "asc");
        this.allStrokes = await helpers.getCollectionFromDB(strokesRef);
        this.$nextTick(() => {
          if (this.allStrokes.length === 0) return;
          this.hasFetchedStrokes = true;
          this.rescaleCanvas(true);
          this.$emit("strokes-ready")
        });
        resolve();
      });
      return promise;
    },
    playGivenWhatIsAvailable () { // called because the video is ready to play i.e. hasOverlay === true
      if (!this.hasLoadedAvailableResources) return;
      else if (this.hasVisualAndAudio) this.handlePlay(); // silent animation
      else if (this.blackboardId) this.quickplay();
    },
    async quickplay () {
      if (!this.hasFetchedStrokes) return;
      this.isQuickplaying = true;
      await this.quickplay();
      this.isQuickplaying = false;
    },
    resizeVideo () {
      if (!this.hasFetchedStrokes) return;
      // If we are in playback, just resize, stop, reset, and play. This will re-render. Otherwise, redraw everything.
      if (this.recursiveSync) {
        this.rescaleCanvas(false);
        this.handleStop();
        this.indexOfNextFrame = 0;
        this.handlePlay();
      } 
      else this.rescaleCanvas(true); // redraw = true
    },
    handlePlay () {
      // TODO: handlePlay() is called twice because the audio player has an @play event
      const { audioRecorder } = this.$refs;
      if (!this.hasPreparedFrames) { // create the frames and order them by time
        this.prepareFrames(audioRecorder.getAudioTime); 
        this.hasPreparedFrames = true
      }
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); // Clear the initial preview or completed video.
      if (!this.recursiveSync) { // now constantly sync against the audio player's progress
        this.keepSyncing();
      }
      this.recursiveSync = setTimeout(this.keepSyncing, 0);
      audioRecorder.playAudio();
    },
    handleStop () {
      clearTimeout(this.recursiveSync); // stop recursive call
      this.recursiveSync = undefined;
    },
    handleSeeking () {
      this.handleStop();
      const onlyOnce = true;
      this.keepSyncing(onlyOnce);
    },
    renderFrame (frame) {
      const strokeIndex = frame[0];
      const pointIndex = frame[1];
      const stroke = this.allStrokes[strokeIndex];

      // Set line style, since multiple strokes can be drawn simultaneously.
      this.setStyle(stroke.color, stroke.lineWidth);
      // TODO: use $_ instead of only _ or $ to avoid overwritting Vue's methods
      this._stroke(stroke.points, pointIndex, stroke.isErasing);
    },
    frameStartTime(frame) {
      const strokeIndex = frame[0];
      const pointIndex = frame[1];
      const stroke = this.allStrokes[strokeIndex];
      return stroke.startTime + (pointIndex - 1) * this.getPointPeriod(stroke);
    },
    nextFrameStartTime () {
      if (this.indexOfNextFrame === this.allFrames.length) {
        return Infinity; // We finished the last frame. The next frame should never start.
      } else {
        return this.frameStartTime(this.allFrames[this.indexOfNextFrame]);
      }
    },
    // Synchronize drawings with the audio on a point-by-point basis.
    keepSyncing (once = false) {
      const n = this.allFrames.length;
      const currentTime = this.getTimeInSeconds();
      // console.log(this.frameStartTime(this.allFrames[this.indexOfNextFrame - 1]));
      if (this.nextFrameStartTime() <= currentTime) {
        // The next frame should already have been rendered. Therefore, the visual needs to catch up. Draw until the we
        // reach a frame that should not be visible yet.
        for (let i = this.indexOfNextFrame; i < n; i++) {
          const frameStart = this.nextFrameStartTime();
          if (frameStart > currentTime) break;
          this.renderFrame(this.allFrames[i]);
          this.indexOfNextFrame++;
        }
      } else if (this.indexOfNextFrame > 0
        && this.frameStartTime(this.allFrames[this.indexOfNextFrame - 1]) > currentTime) {
        // It's `indexOfNextFrame - 1` because that is the index of current frame! Most recent i.e. current stroke on
        // canvas no longer belongs. However, this doesn't apply if there are no frames rendered at all. Reset canvas
        // and frames.

        // TODO: figure out why sometimes canvas.height is undefined
        // De-draw all frames to the current time.
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.indexOfNextFrame = 0;
        for (const frame of this.allFrames) {
          if (this.frameStartTime(frame) > currentTime) {
            break;
          }
          this.renderFrame(frame);
          this.indexOfNextFrame++;
        }
      }
      // sync continuously, unless "once" is true
      if (this.indexOfNextFrame !== n && !once) {
        // TODO: never catches up to n for some reason
        // The event loop takes some time, so we wait AT LEAST the timeout duraiton
        // Recompute the current time here. 
        let timeout = 1000 * (this.nextFrameStartTime() - this.getTimeInSeconds());
        if (timeout < 0) timeout = 0;
        // Recursively call on self. We do not use `setInterval` to prevent overlapping calls to this method.
        this.recursiveSync = setTimeout(this.keepSyncing, timeout);
      }
    },
    async prepareFrames (getTimeInSeconds) {
      if (!this.allStrokes || this.allStrokes.length === 0) return;
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
      this.indexOfNextFrame = 0; 
    }
  }
}
</script>
