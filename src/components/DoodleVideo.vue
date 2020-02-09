<template>
  <div style="height: 100%">
    <!-- VISUAL SECTION -->
    <div 
      @click="$emit('click')" 
      @mouseover="mouseHover = true" 
      @mouseleave="mouseHover = false" 
      style="height: 100%; width: 100%;"
    >
      <!-- https://dev.to/deepaksisodiya/working-with-dynamic-components-in-vue-js-56ag -->
      <!-- Even if overlays is permitted by the parent, only show it when the video is actually ready -->
      <template v-if="hasBetaOverlay">
        <DoodleVideoOverlay 
          :overlay="hasOverlay" 
          @play-click="playGivenWhatIsAvailable()"
        >
          <template v-if="thumbnail && strokes.length === 0">
            <v-img :src="thumbnail"></v-img>
          </template>
          <template v-else-if="strokes.length > 0">
            <DoodleVideoAnimation
              ref="animation"
              v-if="strokes.length > 0"
              :strokes="strokes"
              :canvasId="blackboardId"
              @animation-loaded="animationLoaded = true"
              @animation-finished="handleEvent()"
              @canvas-clicked="playGivenWhatIsAvailable()"
            />
          </template>
        </DoodleVideoOverlay>
      </template>
      <template v-else>
        <!-- TODO: obviously just use the "component" component -->
        <template v-if="thumbnail && strokes.length === 0">
          <v-img :src="thumbnail"></v-img>
        </template>
        <template v-else-if="strokes.length > 0">
          <DoodleVideoAnimation
            ref="animation"
            v-if="strokes.length > 0"
            :strokes="strokes"
            :canvasId="blackboardId"
            @animation-loaded="animationLoaded = true"
            @animation-finished="handleEvent()"
            @canvas-clicked="playGivenWhatIsAvailable()"
          />
        </template>
      </template>
    </div>
    <!-- AUDIO SECTION -->
    <audio-recorder
      v-if="audioUrl"
      ref="audioRecorder"
      :audioUrl="audioUrl"
      @recorder-loading="hasFetchedAudio = false"
      @play="handlePlay()"
      @stop="handleStop()"
      @seeking="handleSeeking()"
      @recorder-loaded="hasFetchedAudio = true"
    />
  </div>
</template>

<script>
import db from "@/database.js";
import DoodleVideoAnimation from "@/components/DoodleVideoAnimation.vue";
import DoodleVideoOverlay from "@/components/DoodleVideoOverlay.vue";
import AudioRecorder from "@/components/AudioRecorder.vue";
import firebase from "firebase/app";
import "firebase/storage";
import helpers from "@/helpers.js";

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
    DoodleVideoAnimation,
    DoodleVideoOverlay,
    AudioRecorder
  },
  data () {
    return {
      hasFetchedStrokes: false,
      hasFetchedAudio: false,
      strokes: [],
      hasPreparedFrames: false,
      isQuickplaying: false,
      animationLoaded: false,
      isSyncing: false,
      mouseHover: false,
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
  computed: {
    Animation () {
      return this.$refs.animation;
    },
    hasOverlay () {
      return this.hasLoadedAvailableResources && (!this.isSyncing && !this.isQuickplaying)
    },
    hasLoadedAvailableResources () {
      return (this.hasFetchedAudio || !this.audioUrl) 
        && (this.hasFetchedStrokes || !this.blackboardId)
    },
    hasVisualAndAudio () {
      return this.animationLoaded && this.hasFetchedAudio
    },
  },
  async created () {
    if (this.thumbnail) return;
    this.fetchStrokes();  // auto-fetch strokes if no thumbnail is available
  },
  mounted () {
    window.addEventListener("resize", this.resizeVideo);
  },
  destroyed () {
    window.removeEventListener("resize", this.resizeVideo);
  },
  methods: {
    async fetchStrokes () {
      const promise = new Promise(async resolve => {
        if (!this.blackboardId) { 
          resolve(); 
          return;
        }
        // blackboardRef
        const strokesRef = this.blackboardRef.collection("strokes").orderBy("strokeNumber", "asc");
        this.strokes = await helpers.getCollectionFromDB(strokesRef);
        this.hasFetchedStrokes = true;
        this.$nextTick(() => this.$emit("strokes-ready", this.strokes))
        resolve();
      });
      return promise;
    },
    playGivenWhatIsAvailable () { // called because the video is ready to play i.e. hasOverlay === true
      console.log("called()")
      if (!this.hasLoadedAvailableResources) return;
      else if (this.hasVisualAndAudio) this.handlePlay(); // silent animation
      else if (this.blackboardId) this.quickplay();
    },
    handlePlay () {
      // TODO: refactor - handle play is triggered twice because the audio player has an @play event
      const { animation, audioRecorder } = this.$refs;
      if (!this.hasPreparedFrames) { // create the frames and order them by time
        animation.prepareFrames(audioRecorder.getAudioTime); 
        this.hasPreparedFrames = true
      }
      animation.ctx.clearRect(0, 0, animation.canvas.width, animation.canvas.height); // Clear the initial preview or completed video.
      if (!this.isSyncing) { // now constantly sync against the audio player's progress
        animation.keepSyncing();
        this.isSyncing = true;
      }
      animation.sync = setTimeout(animation.keepSyncing, 0);
      audioRecorder.playAudio();
    },
    async quickplay () {
      if (!this.Animation) return;
      this.isQuickplaying = true;
      await this.Animation.quickplay();
      this.isQuickplaying = false;
    },
    handleStop () {
      // Stop sync.
      const { animation } = this.$refs;
      clearTimeout(animation.sync);
      animation.sync = undefined;
      this.isSyncing = false;
    },
    handleSeeking () {
      this.handleStop();
      this.$refs.animation.keepSyncing(true); // "true" means the function will be called only once
    },
    resizeVideo () {
      const { animation } = this.$refs;
      if (!animation) return;
      // If we are in playback, just resize, stop, reset, and play. This will re-render. Otherwise, redraw everything.
      if (animation.sync) {
        animation.rescaleCanvas(false);
        this.handleStop();
        animation.indexOfNextFrame = 0;
        this.handlePlay();
      } 
      else animation.rescaleCanvas(true); // redraw = true
    }
  }
}
</script>
