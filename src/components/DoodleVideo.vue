<template>
  <!-- <DoodleVideoOverlay 
    :overlay="hasBetaOverlay"
    @play-click="onOverlayClick()"> -->
  <div style="height: 100%">
    <!-- <template v-if="!thumbnail || hasLoadedAvailableResources"> -->
      <!-- @click="$emit('click'); hasBetaOverlay=false, onClic()" -->

    <div @click="onOverlayClick()" align="center" justify="center" style="height: 100%">
    <v-card style="height: 100%; width: 100%">


      <div  @mouseover="mouseHover = true" @mouseleave="mouseHover = false" style="height: 100%; width: 100%;">
      <img v-show="false" :src="thumbnail" id="Thumbnail" :key="thumbnail">
      <canvas
        :id="`myCanvas-${blackboardId}`"
        style="width: 100%; height: 1; background-color: rgb(62, 66, 66)"
      >
      
      </canvas>
    </div>

      <v-row justify="center">
        <v-overlay absolute :value="overlay" :opacity="0.1">
          <!-- @click="e => playVideo(e)" -->
          <v-btn @click="onOverlayClick()" large dark>
            <v-icon>play_arrow</v-icon>
          </v-btn>
        </v-overlay>
      </v-row>
    </v-card>
  </div>



    
    <AudioRecorder
      v-if="audioUrl && this.hasFetchedStrokes" :audioUrl="audioUrl" ref="audioRecorder"
      @loading="hasFetchedAudio = false" @loaded="hasFetchedAudio = true"
      @play="playVideo()" @stop="stopSyncing()" @seeking="handleSeeking()"
    />
    <!-- </template> -->
    
  </div>
  <!-- </DoodleVideoOverlay> -->
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
    isQuickplaying: false,
    mouseHover: false,
    nextFrameIdx: 0,
    recursiveSync: null,
    getCurrentAudioTime: null,
    thumbnailImage: null,
    overlay: true
  }),
  computed: {
    // hasOverlay () {
    //   return this.hasLoadedAvailableResources && (!this.recursiveSync && !this.isQuickplaying)
    // },
    hasLoadedAvailableResources () {
      return (this.hasFetchedAudio || !this.audioUrl)
        && (this.hasFetchedStrokes || !this.blackboardId)
    },
    hasVisualAndAudio () { return this.hasFetchedStrokes && this.hasFetchedAudio; },
  },
  watch: {
    mouseHover () { this.$emit("mouse-change", this.mouseHover); },
    hasVisualAndAudio () { this.$emit("visual-audio-ready"); },
    hasLoadedAvailableResources () { 
      this.$nextTick(() => { // this waits for audioRecorder to be fully loaded
        this.$emit("available-resources-ready"); 
      });
    },
    // Uncomment below for painless debugging
    // nextFrameIdx () { console.log(`nextFrameIdx = ${this.nextFrameIdx}`)}
  },
  async created () {
    if (!this.thumbnail) {
      this.fetchStrokes();
    } 
    this.overlay = this.hasBetaOverlay;
  },
  async mounted () {
    this.canvas = document.getElementById(`myCanvas-${this.blackboardId}`);
    this.ctx = this.canvas.getContext("2d");
    await this.setCanvasHeight(); // just for video: blackboard should fill space
    this.$_drawMixin_rescaleCanvas(false);
    window.addEventListener("resize", this.handleResize);
    if (this.thumbnail) {
      this.thumbnailImage = document.getElementById(`Thumbnail`);
      this.thumbnailImage.src = this.thumbnail;
      this.$_drawMixin_rescaleCanvas(true);
      this.renderThumbnail();
    }
  },
  destroyed () {
    window.removeEventListener("resize", this.handleResize);
  },
  methods: {
    onOverlayClick(){
      console.log("Clicked");
      this.overlay = false;
      this.$emit("click")
    },
    renderThumbnail () {
      this.ctx.drawImage(this.thumbnailImage,0,0);
    },
    setCanvasHeight () {
      const setHeight = resolve => {
        const { scrollHeight, scrollWidth } = this.canvas;
        if (Math.round(scrollHeight) !== Math.round(0.6*scrollWidth)) {
          this.canvas.height = 9/16 * scrollWidth;
          resolve();
        }
      }
      return new Promise(resolve => setTimeout(setHeight(resolve), 0));
    },
    async fetchStrokes () {
      return new Promise(async resolve => {
        if(!this.hasFetchedStrokes){
          const strokesRef = this.blackboardRef.collection("strokes").orderBy("strokeNumber", "asc");
          this.allStrokes = await helpers.getCollectionFromDB(strokesRef);
          this.$nextTick(() => {
            this.hasFetchedStrokes = true;
            this.$_drawMixin_rescaleCanvas(true);
            this.$emit("strokes-ready")
          });
        }
        resolve();
      });
    },
    playGivenWhatIsAvailable () { 
      if (this.hasVisualAndAudio) { this.$refs.audioRecorder.playAudio(); }
      else { this.$_drawMixin_quickplay(); } // silent animation
    },
    async playSilentAnimation () {
      this.isQuickplaying = true;
      await this.$_drawMixin_quickplay();
      this.isQuickplaying = false;
    },
    handleResize () {
      // if (this.hasFetchedStrokes){ // only rerender if there are actually strokes, protects thumbnail
        if (this.recursiveSync) {
          this.$_drawMixin_rescaleCanvas(false); // redraw = false
          this.stopSyncing();
          this.nextFrameIdx = 0; // need to redraw previous progress 
          this.syncContinuously();
        }
        else { 
          if (!this.hasFetchedStrokes){
            this.renderThumbnail();
          }
          else {
            this.$_drawMixin_rescaleCanvas(true); 
          }
        } // redraw = true
      // }
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
    sorted by timestamp. Frames are in a `[[strokeIndex, pointIndex], ...]` format
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
