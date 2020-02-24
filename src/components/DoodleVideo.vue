<template>
  <div style="height: 100%; position: relative; z-index: 5">
    <div @mouseover="mouseHover = true" @mouseleave="mouseHover = false" style="height: 100%; width: 100%;">
      <div id="blackboard-wrapper" style="position: relative;">
        <canvas :id="`myCanvas-${blackboardId}`"
          style="width: 100%; height: 1; background-color: transparent; display: block;"
        ></canvas>
        <canvas :id="`background-canvas-${blackboardId}`"
          class="background-canvas"
        ></canvas>
        <v-btn v-show="overlay" @click="onOverlayClick()" large dark style="position: absolute; bottom: 45%; top: 45%; left: 45%; right: 45%">
          <v-icon>play_arrow</v-icon>
        </v-btn>
      </div>
    </div>
    <p v-if="isFetchingAudio" class="text-xs-center">
      Fetching audio...(this can take a while)
    </p>
    <AudioRecorder v-if="audioUrl || audio" v-show="hasFetchedAudio" ref="audioRecorder"
      :audioUrl="audioUrl || `${audio.ts}`" 
      :injectedAudio="audio"
      @loading="isFetchingAudio = true" 
      @loaded="isFetchingAudio = false; hasFetchedAudio = true;"
      @play="playVideo()" 
      @stop="stopSyncing()" 
      @ended="stopSyncing()"
      @seeking="handleSeeking()"
    />
  </div>
 </template>

<script>
import AudioRecorder from "@/components/AudioRecorder.vue";
import CanvasDrawMixin from "@/mixins/CanvasDrawMixin.js";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import _ from "lodash";

// TEST:
// 1. Onload, can directly slide the audio slider 
// 2. Play the video normally, and drag it forward and backward.
// 3. Skip to the end of the video.  Drag it forward and backward. 

export default {
  props: {
    injectedStrokes: Array,
    audio: Object,
    blackboardRef: Object,
    blackboardId: String,
    thumbnail: String, 
    imageUrl: String,
    image: { 
      type: Object,
      default () { return { file: null }; }
    },
    audioUrl: String
  },
  components: { AudioRecorder },
  mixins: [CanvasDrawMixin, DatabaseHelpersMixin],
  data: () => ({
    canvas: null,
    ctx: null,
    bgCanvas: null,
    bgCtx: null,
    isPlayingAudio: false,
    isFetchingAudio: false,
    hasFetchedStrokes: false,
    hasFetchedAudio: false,
    isStatic: false,
    allStrokes: [],
    isQuickplaying: false,
    mouseHover: false,
    nextFrameIdx: 0,
    recursiveSync: null,
    getCurrentAudioTime: null,
    thumbnailImage: null
  }),
  computed: {
    /* Converts our array of separate strokes into an array of continuous points
      sorted by timestamp. Frames are in a `[{strokeIndex, pointIndex}, ...]` format */
    allFrames () {
      const allPoints = [];
      for (let i = 0; i < this.allStrokes.length; i++) {
        for (let j = 1; j < this.allStrokes[i].points.length; j++) {
          allPoints.push({ strokeIndex: i, pointIndex: j }); 
        }
      }
      return allPoints.sort((p1, p2) => this.getStartTime(p1) - this.getStartTime(p2));
    },
    hasLoadedAvailableResources () {
      return (this.hasFetchedAudio || !this.audioUrl || this.audio)
        && (this.hasFetchedStrokes || !this.blackboardId)
    },
    hasVisualAndAudio () { 
      return (this.injectedStrokes || this.hasFetchedStrokes) && (this.audio || this.hasFetchedAudio); 
    },
    overlay () {
      return !this.isStatic && !this.isQuickplaying && this.recursiveSync === null;
    }
  },
  watch: {
    mouseHover () { this.$emit("mouse-change", this.mouseHover); },
    hasVisualAndAudio () { this.$emit("visual-audio-ready"); },
    hasLoadedAvailableResources () { 
      this.$nextTick(() => { // this waits for audioRecorder to be fully loaded
        this.$emit("available-resources-ready"); 
      });
    },
  },
  async created () {
    if (this.injectedStrokes) { this.allStrokes = this.injectedStrokes } 
    else if (!this.thumbnail) { this.fetchStrokes(); } 
    this.handleSeeking = _.debounce(this.handleSeeking, 0);
  },
  async mounted () {
    this.canvas = document.getElementById(`myCanvas-${this.blackboardId}`);
    this.bgCanvas = document.getElementById(`background-canvas-${this.blackboardId}`);
    this.ctx = this.canvas.getContext("2d");
    this.bgCtx = this.bgCanvas.getContext("2d");
    await this.setCanvasHeight(); // just for video: blackboard should fill space
    
    if (this.thumbnail) {
      this.thumbnailImage = new Image;
      this.thumbnailImage.src = this.thumbnail;
      this.$_rescaleCanvas(false); // don't redraw
      setTimeout(this.renderThumbnail, 1000);
      // this.$nextTick(this.renderThumbnail); // requires nextTick for some reason
      if (this.imageUrl) { // URL to the saved image on Firebase hosting
        this.$_displayImage(this.imageUrl);
      }
    } else {
      const willDisplayStrokes = this.injectedStrokes? true : false;
      this.$_rescaleCanvas(willDisplayStrokes);
      if (this.image.file) { // image uploaded locally by the user's device
        const imageSrc = URL.createObjectURL(this.image.file);
        this.$_displayImage(imageSrc);
      } 
    }
    window.addEventListener("resize", this.handleResize);
  },
  beforeDestroy () {
    window.removeEventListener("resize", this.handleResize);
  },
  methods: {
    onOverlayClick () {
      if (this.hasLoadedAvailableResources) { this.playGivenWhatIsAvailable(); }
      else { 
        this.fetchStrokes(); 
        if (this.audioUrl) { 
          this.$refs.audioRecorder.downloadAudioFile();
        }
      }
    },
    renderThumbnail () {
      if (!this.thumbnailImage) { return; } // necessary because switching between posts will trigger a resize before a destory event 
      this.ctx.drawImage(this.thumbnailImage, 0 , 0, this.canvas.width, this.canvas.height);
    },
    setCanvasHeight () {
      const setHeight = resolve => {
        const { scrollHeight, scrollWidth } = this.canvas;
        if (Math.round(scrollHeight) !== Math.round((0.6)*scrollWidth)) {
          this.canvas.height = 0.6 * scrollWidth;
          resolve();
        }
      }
      return new Promise(resolve => setTimeout(setHeight(resolve), 0));
    },
    handleResize () {
      if (this.recursiveSync) {
        this.$_rescaleCanvas(false); // redraw = false
        this.stopSyncing();
        this.nextFrameIdx = 0; // need to redraw previous progress 
        this.syncContinuously();
      }
      else { 
        if (!this.hasFetchedStrokes) { this.renderThumbnail(); }
        else { this.$_rescaleCanvas(true); } // redraw = true
      } 
    },
    async fetchStrokes () {
      return new Promise(async (resolve) => {
        if (this.hasFetchedStrokes) { return; }
        const blackboard = await this.$_getDoc(this.blackboardRef);
        const strokesRef = this.blackboardRef.collection("strokes").orderBy("strokeNumber", "asc");
        this.allStrokes = await this.$_getCollection(strokesRef);
        this.$nextTick(() => {
          if (this.allStrokes.length === 0) { 
            this.isStatic = true;
            this.$root.$emit("show-snackbar", "This is just a static image.")
          }
          this.hasFetchedStrokes = true;
          this.$emit("strokes-ready")
          this.$_rescaleCanvas(true);
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
      await this.$_quickplay();
      this.isQuickplaying = false;
    },
    playVideo () {
      this.isPlayingAudio;
      const { audioRecorder } = this.$refs;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); // video could already be rendered as an initial preview or completed video
      this.nextFrameIdx = 0;
      this.prepareForSync();
      audioRecorder.playAudio();
    },
    prepareForSync () {
      const { audioRecorder } = this.$refs;
      if (!this.getCurrentAudioTime) { this.getCurrentAudioTime = audioRecorder.getAudioTime; }
      if (!this.recursiveSync) { this.syncContinuously(); }
    },
    handleSeeking () {
      if (!this.recursiveSync) { 
        this.prepareForSync();
        this.nextFrameIdx = 0; 
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
      this.stopSyncing();
      const onlyOneFrame = true;
      this.syncContinuously(onlyOneFrame);
    },
    stopSyncing () {
      this.isPlayingAudio = false;
      clearTimeout(this.recursiveSync); // stop recursive call
      this.recursiveSync = null;
    },
    // Synchronize drawings with the audio on a point-by-point basis.
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
    getStartTime ({ strokeIndex, pointIndex }) {
      const stroke = this.allStrokes[strokeIndex];
      return stroke.startTime + (pointIndex - 1) * this.$_getPointDuration(stroke);
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
      this.$_setStyle(stroke.color, stroke.lineWidth); // since multiple strokes can be drawn simultaneously.
      this.$_connectTwoPoints(stroke.points, pointIndex, stroke.isErasing);
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
