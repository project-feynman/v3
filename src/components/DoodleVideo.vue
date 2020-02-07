<template>
  <div style="height: 100%">
    <div @click="$emit('click')" @mouseover="mouseHover = true" @mouseleave="mouseHover = false" style="height: 100%; width: 100%;">
      <template v-if="thumbnail && strokes.length === 0">
        <v-img :src="thumbnail"></v-img>
      </template>
      <template v-else-if="strokes.length > 0">
        <DoodleVideoAnimation
          ref="animation"
          v-if="strokes.length > 0"
          :strokes="strokes"
          :canvasId="blackboardId"
          :height="height"
          @animation-loaded="animationLoaded = true"
          @animation-finished="handleEvent()"
          @canvas-clicked="handleClick()"
        />
      </template>
    </div>
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
          <!-- <v-container fill-height fluid>
          <v-row align="center" justify="center">
            <div>
              <v-btn fab large dark>
                <v-icon>play_arrow</v-icon>
              </v-btn>
            </div>
          </v-row>
        </v-container>-->
  </div>
</template>

<script>
import db from "@/database.js";
import DoodleVideoAnimation from "@/components/DoodleVideoAnimation.vue";
import AudioRecorder from "@/components/AudioRecorder.vue";
import firebase from "firebase/app";
import "firebase/storage";
import helpers from "@/helpers.js";

export default {
  props: {
    thumbnail: String,
    blackboardId: String,
    audioUrl: String,
    canvasId: String,
    height: String
  },
  components: {
    DoodleVideoAnimation,
    AudioRecorder
  },
  data () {
    return {
      hasFetchedStrokes: false,
      hasFetchedAudio: false,
      strokes: [],
      hasPreparedFrames: false,
      isPlaying: false,
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
    handlePlay () {
      const { animation, audioRecorder } = this.$refs;
      if (!this.hasPreparedFrames) { // create the frames and order them by time
        animation.prepareFrames(audioRecorder.getAudioTime); 
        this.hasPreparedFrames = true
      }
      if (!this.isSyncing) { // now constantly sync against the audio player's progress
        animation.keepSyncing();
        this.isSyncing = true;
      }
      animation.sync = setTimeout(animation.keepSyncing, 0);
      audioRecorder.playAudio();
    },
    async quickplay () {
      this.isQuickplaying = true;
      await this.$refs.animation.quickplay();
      this.isQuickplaying = false;
    },
    handleClick () {
      this.$emit("video-click");
    },
    async fetchStrokes () {
      const promise = new Promise(async resolve => {
        if (!this.blackboardId) { 
          resolve(); 
          return;
        }
        const classId = this.$route.params.class_id;
        const boardRef = db.collection("classes").doc(classId).collection("blackboards").doc(this.blackboardId);
        const strokesRef = boardRef.collection("strokes").orderBy("strokeNumber", "asc");
        this.strokes = await helpers.getCollectionFromDB(strokesRef);
        this.hasFetchedStrokes = true;
        this.$nextTick(() => this.$emit("strokes-ready", this.strokes))
        resolve();
      });
      return promise;
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
      // If we are in playback, just resize, stop, reset, and play. This will re-render. Otherwise, redraw everything.
      if (animation.sync) {
        animation.rescaleCanvas(false);
        this.handleStop();
        animation.indexOfNextFrame = 0;
        this.handlePlay();
      } else animation.rescaleCanvas(true); // redraw = true
    }
  }
}
</script>
