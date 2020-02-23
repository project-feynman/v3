<template>
  <div style="height: 100%; position: relative; z-index: 5">
    <div @mouseover="mouseHover = true" @mouseleave="mouseHover = false" style="height: 100%; width: 100%;">
      <div id="blackboard-wrapper" style="position: relative;">
        
        <canvas
          :id="`myCanvas-${blackboardId}`"
          style="width: 100%; height: 1; background-color: transparent; display: block;"
        ></canvas>
        
        <canvas 
          :id="`background-canvas-${blackboardId}`"
          class="background-canvas"
        ></canvas>

          <v-btn  v-show="overlay" @click="onOverlayClick()" large dark style="position: absolute; bottom: 45%; top: 45%; left: 45%; right: 45%">
            <v-icon>play_arrow</v-icon>
          </v-btn>
          
      </div>
    </div>
    <p class="text-xs-center" v-if="hasFetchedStrokes && audioUrl && !hasFetchedAudio">Fetching audio...(this can take a while)</p>
    <AudioRecorder
      v-if="( audioUrl || audio ) && this.hasFetchedStrokes" 
      v-show="hasFetchedAudio" 
      ref="audioRecorder"
      :audioUrl="audioUrl || `${audio.ts}`" 
      :injectedAudio="audio"
      @loading="hasFetchedAudio = false" 
      @loaded="hasFetchedAudio = true"
      @play="playVideo()" 
      @stop="stopSyncing()" 
      @seeking="handleSeeking()"
    />
  </div>
 </template>



<script>
import AudioRecorder from "@/components/AudioRecorder.vue";
import CanvasDrawMixin from "@/mixins/CanvasDrawMixin.js";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";

// TEST:
// 1. Onload, can directly slide the audio slider 
// 2. Play the video normally, and drag it forward and backward.
// 3. Skip to the end of the video.  Drag it forward and backward. 

export default {
  props: {
    strokes: Array,
    audio: Object,
    blackboardRef: Object,
    blackboardId: String,
    thumbnail: String, 
    imageUrl: String,
    image: { 
      type: Object,
      default () { return { file: null }; }
    },
    audioUrl: String,
    hasBetaOverlay: {
      type: Boolean,
      default () { return false; }
    }
  },
  components: { AudioRecorder },
  mixins: [CanvasDrawMixin, DatabaseHelpersMixin],
  data: () => ({
    canvas: null,
    ctx: null,
    bgCanvas: null,
    bgCtx: null,
    hasFetchedStrokes: false,
    hasFetchedAudio: false,
    allStrokes: [],
    isQuickplaying: false,
    mouseHover: false,
    nextFrameIdx: 0,
    recursiveSync: null,
    getCurrentAudioTime: null,
    thumbnailImage: null,
    // overlay: true
  }),
  computed: {
    // hasOverlay () {
    //   return this.hasLoadedAvailableResources && (!this.recursiveSync && !this.isQuickplaying)
    // },
    /* Converts our array of separate strokes into an array of continuous points
      sorted by timestamp. Frames are in a `[{strokeIndex, pointIndex}, ...]` format
      @params: "this.allStrokes"
      @returns: mutates "this.allFrames" 
    */
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
    hasVisualAndAudio () { return this.hasFetchedStrokes && this.hasFetchedAudio; },
    overlay () {return !this.isQuickplaying && this.recursiveSync === null}
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
    if (this.strokes) { this.allStrokes = this.strokes } 
    else if (!this.thumbnail) { this.fetchStrokes(); } 
  },
  async mounted () {
    this.canvas = document.getElementById(`myCanvas-${this.blackboardId}`);
    this.bgCanvas = document.getElementById(`background-canvas-${this.blackboardId}`);
    this.ctx = this.canvas.getContext("2d");
    this.bgCtx = this.bgCanvas.getContext("2d");
    await this.setCanvasHeight(); // just for video: blackboard should fill space
    const willDisplayStrokes = this.strokes? true : false;
    this.$_rescaleCanvas(willDisplayStrokes);
    if (this.image.file) {
      const imageSrc = URL.createObjectURL(this.image.file);
      this.$_displayImage(imageSrc);
    } else if (this.imageUrl) {
      this.$_displayImage(this.imageUrl);
    }
    window.addEventListener("resize", this.handleResize);
    if (this.thumbnail) {
      this.thumbnailImage = new Image;
      this.thumbnailImage.src = this.thumbnail;
      this.$_drawMixin_rescaleCanvas(true);
      this.renderThumbnail();
    }
  },
  destroyed () {
    window.removeEventListener("resize", this.handleResize);
  },
  methods: {
    async onOverlayClick(){
      console.log("Clicked");
      // this.overlay = false;
      if (this.hasLoadedAvailableResources){
        this.playGivenWhatIsAvailable();
      }
      else {
        await this.fetchStrokes();
      }
    },
    renderThumbnail () {
      // this.$_drawMixin_rescaleCanvas(true);
      this.ctx.drawImage(this.thumbnailImage,0,0,this.canvas.width,this.canvas.height);
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
    async fetchStrokes () {
      return new Promise(async (resolve) => {
        if (this.hasFetchedStrokes) { return; }
        const blackboard = await this.$_getDoc(this.blackboardRef);
        // console.log("blackboard =", blackboard);
        const strokesRef = this.blackboardRef.collection("strokes").orderBy("strokeNumber", "asc");
        this.allStrokes = await this.$_getCollection(strokesRef);
        this.$nextTick(() => {
          this.hasFetchedStrokes = true;
          this.$emit("strokes-ready")
          this.$_rescaleCanvas(true);
        });
        resolve();
      });
    },
    playGivenWhatIsAvailable () { 
      if (this.hasVisualAndAudio) { this.$refs.audioRecorder.playAudio(); }
      else { this.playSilentAnimation(); } // silent animation
    },
    async playSilentAnimation () {
      this.isQuickplaying = true;
      await this.$_quickplay();
      this.isQuickplaying = false;
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
        else { this.$_drawMixin_rescaleCanvas(true); } // redraw = true
      } 
    },
    playVideo () {
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
    stopSyncing () {
      clearTimeout(this.recursiveSync); // stop recursive call
      this.recursiveSync = null;
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
    getStartTime ({ strokeIndex, pointIndex }) {
      const stroke = this.allStrokes[strokeIndex];
      return stroke.startTime + (pointIndex - 1) * this.$_getPointDuration(stroke);
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

/* canvas {
  position: relative;
} */
</style>
