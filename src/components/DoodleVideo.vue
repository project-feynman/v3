<template >
  <!-- TODO: add video documentation link -->
  <div @mouseover="mouseHover = true" @mouseleave="mouseHover = false" style="height: 100%; width: 100%;">
    <template v-if="!thumbnail || this.strokes.length > 0">
      <DoodleVideoAnimation
        ref="animation"
        :strokes="strokes"
        :isFullscreen="false"
        :canvasID="whiteboardID"
        :height="height"
        @animation-loaded="handleAnimationLoaded()"
        @animation-finished="handleEvent()"
        @click="handleClick()"
      />
      <!-- <audio-recorder
        v-if="audioURL"
        ref="audioRecorder"
        :audioURL="audioURL"
         @recorder-loading="recorderLoaded=false"
        @play="syncAnimation()"
        @recorder-loaded="recorderLoaded=true" 
      /> -->

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
      <v-img :src="thumbnail">
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

export default {
  props: {
    thumbnail: String,
    whiteboardID: String,
    hasSubcollection: {
      type: Boolean,
      default() {
        return true;
      }
    },
    audioURL: String,
    canvasID: String,
    height: String
  },
  components: {
    DoodleVideoAnimation,
    AudioRecorder
  },
  data() {
    return {
      strokesFetched: false,
      strokes: [],
      isPlaying: true,
      recorderLoaded: false,
      animationLoaded: false,
      syncedVisualAndAudio: false,
      mouseHover: false,
      isQuickplaying: false
    };
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
    resourcesLoaded() {
      return this.animationLoaded && this.recorderLoaded;
    }
  },
  async created() {
    // fetch strokes if no thumbnail is available
    if (!this.thumbnail) { 
      console.log(":strokes not loaded =", this.strokes)
      await this.fetchStrokes(); 
      console.log(":strokes loaded =", this.strokes)
    }
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
    handleAnimationLoaded() {
      this.animationLoaded = true;
      // this.$emit("animation-loaded");
      // // this.$emit("strokes-ready");
      // console.log("animationLoaded")
    },
    async quickplay () {
      const { animation } = this.$refs;
      console.log("in quickplay",  this.strokesFetched);
      this.isQuickplaying = true;
      await animation.quickplay();
      this.isQuickplaying = false;
    },
    handleClick () {
      this.$emit("video-clicked");
    },
    async fetchStrokes() {
      const P = new Promise(async resolve => {
        if (!this.whiteboardID) resolve();
        const baseRef = db.collection("whiteboards").doc(this.whiteboardID);
        if (this.hasSubcollection === false) {
          const doc = await baseRef.get();
          this.strokes = doc.data().strokes;
          
        } else {
          const strokesRef = baseRef
            .collection("strokes")
            .orderBy("strokeNumber", "asc");
          const querySnapshot = await strokesRef.get();
          querySnapshot.forEach(doc => {
            this.strokes.push({ ".key": doc.id, ...doc.data() });
          });
        }
        this.strokesFetched = true
        console.log("about to emit event")
        this.$emit("strokes-ready", this.strokes)
        console.log("about to emit event2")
        resolve();
      });
      return P;
    },

/////////////////////////////////////


    handlePlay() {
      const animation = this.$refs.animation;
      animation.overlay = false;
      this.initializeAnimation();

      // Initialize playback synchronization if possible.
      if (this.syncInitialized) {
        animation.sync = setTimeout(animation.syncVisualWithAudio, 0);
      }
    },
    handleStop() {
      // Stop sync.
      const animation = this.$refs["animation"];
      clearTimeout(animation.sync);
      animation.sync = undefined;
    },
    handleSeeking() {
      // Stop first.
      this.handleStop();

      // Call once.
      const animation = this.$refs["animation"];
      animation.syncVisualWithAudio(true);
    },
    resizeVideo() {
      // Rescale canvas.
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
    initializeAnimation() {
      if (!this.syncInitialized && this.resourcesLoaded) {
        const audioRecorder = this.$refs.audioRecorder;
        const animation = this.$refs["animation"];
        animation.startSync(audioRecorder.getAudioTime);
        this.syncInitialized = true;
      }
    },
    // quickplay() {
    //   const animation = this.$refs["animation"];
    //   if (animation) animation.quickplay();
    // },
    // async bindVariables() {
    //   // TODO: just keep track of this.video so that I don't need to keep track of this.audioURL, this.audioPath explictly

    //   // initialize/reset variables
    //   this.syncInitialized = false;
    //   this.recorderLoaded = false;
    //   this.animationLoaded = false;
    //   this.audioURL = "";

    //   // retrieve video
    //   const classID = this.$route.params.class_id;
    //   let videoRef = null;
    //   if (!this.videoID) {
    //     const videoID = this.$route.params.video_id;
    //     videoRef = db.collection("whiteboards").doc(videoID);
    //   } else {
    //     videoRef = db.collection("whiteboards").doc(this.videoID);
    //   }
    //   let video = await videoRef.get();
    //   video = video.data();
    //   // fix delete button logic
    //   this.video = video;
    //   // this.thumbnail = video.thumbnail;
    //   // set audio and visual
    //   this.audioURL = video.audioURL;
    //   const strokesRef = videoRef.collection("strokes");
    //   if (video.audioPath)
    //     await this.$binding(
    //       "allStrokes",
    //       strokesRef.orderBy("startTime", "asc")
    //     );
    //   else
    //     await this.$binding(
    //       "allStrokes",
    //       strokesRef.orderBy("strokeNumber", "asc")
    //     );

    //   // bind references to make it easy to delete things
    //   const storageRef = firebase.storage().ref();
    //   if (video.audioPath) {
    //     this.audioFileRef = storageRef.child(`recordings/${video.audioPath}`);
    //   }
    // },
    async deleteVideo() {
      const recursiveDelete = firebase
        .functions()
        .httpsCallable("recursiveDelete");
      recursiveDelete({ path: `whiteboards/${this.$route.params.video_id}` });
      if (this.audioFileRef) this.audioFileRef.delete();
      // redirect
      this.$router.push(`/${this.$route.params.class_id}/ranking`);
    }
  }
};
</script>
