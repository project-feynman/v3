<template >
  <!-- TODO: add video documentation link -->
  <div @click="handleClick()" @mouseover="mouseHover = true" @mouseleave="mouseHover = false" style="height: 100%; width: 100%;">
    <template v-if="!thumbnail || this.strokes.length > 0">
      <DoodleVideoAnimation
        ref="animation"
        :strokes="strokes"
        :isFullscreen="false"
        :canvasID="whiteboardID"
        :height="height"
        @animation-loaded="handleAnimationLoaded()"
        @animation-finished="handleEvent()"
      />
      <audio-recorder
        v-if="audioURL"
        ref="audioRecorder"
        :audioURL="audioURL"
        @recorder-loading="recorderLoaded=false"
        @play="syncAnimation()"
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
      mouseHover: false
    };
  },
  watch: {
    mouseHover: {
      handler: "handleMouseOver"
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
    if (this.thumbnail) {
        console.log("this.video.thumbnail succeeded!");
        return;
    } 
    else {
      await this.fetchStrokes();
    }
  },
  methods: {
    // async fetchStrokesThenQuickplay() {
    //   if (!this.hasFetchedStrokes) {
    //     await this.fetchStrokes();
    //   }
    //   else {

    //   }
    //   this.quickplay();
    // },
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
      this.$emit("strokes-ready");
      console.log("animationLoaded")
    },
    async quickplay() {
      const { animation } = this.$refs;
      console.log("in quickplay",  this.strokesFetched);
      await animation.quickplay();
    },
    handleClick () {
      // if(thumbnail) {
        this.$emit("video-clicked");
      // }
      
    },
    async handleMouseOver () {
      console.log("in mouse over", this.mouseHover)
      if (this.mouseHover){
        
        if (this.animationLoaded){
            this.$emit("strokes-ready");
        }
        else {
          if (this.thumbnail){
            console.log("herer", this.strokesFetched)
            await this.fetchStrokes();
          }
        }
      }
      else{


      }
      


      
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
          this.strokesFetched = true
        }
        resolve();
      });
      return P;
    }
  }
};
</script>
