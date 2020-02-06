<template >
  <!-- TODO: add video documentation link -->
  <div @mouseover="mouseHover = true" @mouseleave="mouseHover = false" style="height: 100%; width: 100%;">
    <template v-if="!thumbnail || strokes.length > 0">
      <DoodleVideoAnimation
        ref="animation"
        v-if="strokes.length > 0"
        :strokes="strokes"
        :isFullscreen="false"
        :canvasID="blackboardId"
        :height="height"
        @animation-loaded="animationLoaded = true"
        @animation-finished="handleEvent()"
        @canvas-clicked="handleClick()"
      />
      <audio-recorder
        v-if="audioURL"
        ref="audioRecorder"
        :audioURL="audioURL"
        @recorder-loading="recorderLoaded=false"
        @play="handlePlay()"
        @stop="handleStop()"
        @seeking="handleSeeking()"
        @recorder-loaded="recorderLoaded=true"
      />
    </template>
    <template v-else-if="thumbnail">
      <v-img @click="handleClick()"
      :src="thumbnail">
        <!-- <v-container fill-height fluid>
          <v-row align="center" justify="center">
            <div>
              <v-btn fab large dark>
                <v-icon>play_arrow</v-icon>
              </v-btn>
            </div>
          </v-row>
        </v-container>-->
      </v-img>
    </template>
  </div>
</template>

<script>
import db from "@/database.js";
import DoodleVideoAnimation from "@/components/DoodleVideoAnimation.vue";
import AudioRecorder from "@/components/AudioRecorder.vue";
import { mapState } from "vuex";
import firebase from "firebase/app";
import "firebase/storage";
import helpers from "@/helpers.js"

export default {
  props: {
    thumbnail: String,
    blackboardId: String,
    audioURL: String,
    canvasID: String,
    height: String
  },
  components: {
    DoodleVideoAnimation,
    AudioRecorder
  },
  data () {
    return {
      hasFetchedStrokes: false,
      strokes: [],
      isPlaying: true,
      recorderLoaded: false,
      animationLoaded: false,
      syncedVisualAndAudio: false,
      mouseHover: false,
      isQuickplaying: false
    }
  },
  watch: {
    mouseHover () {
      this.$emit("mouse-change", this.mouseHover);
    },
    resourcesLoaded () {
      this.$emit("full-video-ready");
    }
  },
  computed: {
    ...mapState(["user"]),
    resourcesLoaded () {
      return this.animationLoaded && this.recorderLoaded;
    }
  },
  async created() {
    if (!this.thumbnail) { this.fetchStrokes(); } // fetch strokes if no thumbnail is available
  },
  // check if this breaks
  mounted () {
    window.addEventListener("resize", this.resizeVideo);
  },
  destroyed () {
    window.removeEventListener("resize", this.resizeVideo);
  },
  methods: {
    syncAnimation() {
      if (this.syncedVisualAndAudio) return;
      if (this.resourcesLoaded) {
        const { animation, audioRecorder } = this.$refs;
        animation.startSync(audioRecorder.getAudioTime);
        this.syncedVisualAndAudio = true;
      }
    },
    async quickplay () {
      const { animation } = this.$refs;
      this.isQuickplaying = true;
      await animation.quickplay();
      this.isQuickplaying = false;
    },
    handleClick () {
      this.$emit("video-clicked");
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
        this.hasFetchedStrokes = true
        this.$nextTick(() => this.$emit("strokes-ready", this.strokes))
        resolve();
      });
      return promise;
    },
    handlePlay () {
      const animation = this.$refs.animation;
      animation.overlay = false;
      this.initializeAnimation();

      // Initialize playback synchronization if possible.
      if (this.syncInitialized) {
        animation.sync = setTimeout(animation.syncVisualWithAudio, 0);
      }
    },
    handleStop () {
      // Stop sync.
      const animation = this.$refs["animation"];
      clearTimeout(animation.sync);
      animation.sync = undefined;
    },
    handleSeeking () {
      // Stop first.
      this.handleStop();

      // Call once.
      const animation = this.$refs["animation"];
      animation.syncVisualWithAudio(true);
    },
    resizeVideo () {
      // Rescale canvas.
      //TODO error being thrown here by video gallery when thumbnail only is displayed
      const animation = this.$refs["animation"];
      animation.rescaleCanvas(false);

      // If we are in playback, just resize, stop, reset, and play. This will re-render. Otherwise, redraw everything.
      if (animation.sync) {
        this.handleStop();
        animation.indexOfNextFrame = 0;
        this.handlePlay();
      } else {
        animation.drawStrokesInstantly();
      }
    },
    startVideo() {
      this.$nextTick(() => {
        const audioRecorder = this.$refs.audioRecorder;
        audioRecorder.playAudio();
      })
    },
    initializeAnimation () {
      if (!this.syncInitialized && this.resourcesLoaded) {
        const { audioRecorder, animation } = this.$refs;
        animation.startSync(audioRecorder.getAudioTime);
        this.syncInitialized = true;
      }
    },
    // async deleteVideo() {
    //   const recursiveDelete = firebase
    //     .functions()
    //     .httpsCallable("recursiveDelete");
    //   recursiveDelete({ path: `whiteboards/${this.$route.params.video_id}` });
    //   if (this.audioFileRef) this.audioFileRef.delete();
    //   // redirect
    //   this.$router.push(`/${this.$route.params.class_id}/ranking`);
    // }
  }
}
</script>
