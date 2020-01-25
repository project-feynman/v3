<template >
  <!-- TODO: add video documentation link -->
  <div style="height: 100%; width: 100%;">
    <template v-if="strokes.length !== 0">
      <DoodleVideoAnimation
        ref="animation"
        :strokes="strokes"
        :isFullscreen="false"
        :canvasID="canvasID"
        :height="height"
        @animation-loaded="handleAnimationLoaded()"
        @animation-finished="handleEvent()"
      />
      <audio-recorder 
        v-if="audioURL"
        ref="audio-recorder"
        :audioURL="audioURL"
        @recorder-loading="recorderLoaded=false"
        @play="syncAnimation()"
        @recorder-loaded="recorderLoaded=true"
      />
    </template>

    <template v-else-if="video">
      <v-img :src="video.thumbnail"  >
        <!-- <v-container fill-height fluid>
          <v-row align="center" justify="center">
            <div>
              <v-btn fab large dark>
                <v-icon>play_arrow</v-icon>
              </v-btn>
            </div>
          </v-row>
        </v-container>   -->
      </v-img>  
    </template>
  </div>
</template>

<script>
import db from "@/database.js"
import DoodleVideoAnimation from "@/components/DoodleVideoAnimation.vue"
import AudioRecorder from "@/components/AudioRecorder.vue"
import { mapState } from "vuex"
import firebase from "firebase/app"
import "firebase/storage"

export default {
  props: {
    video: Object,
    whiteboardID: String,
    hasSubcollection: {
      type: Boolean,
      default () {
        return true
      }
    },
    audioURL: String,
    canvasID: String,
    height: String,
  },
  components: {
    DoodleVideoAnimation,
    AudioRecorder,
  },
  data () {
    return {
      hasFetchedStrokes: false,
      strokes: [],
      isPlaying: true,
      recorderLoaded: false,
      animationLoaded: false,
      syncedVisualAndAudio: false,
    }
  },
  computed: {
    ...mapState(["user"]),
    resourcesLoaded () { return this.animationLoaded && this.recorderLoaded }
  },
  async created () {
    // fetch strokes if no thumbnail is available 
    if (this.video) {
      if (this.video.thumbnail) return;
      else this.fetchStrokes()
    } else if (this.whiteboardID) {
      this.fetchStrokes()
    }
  },
  methods: {
    async fetchStrokesThenQuickplay () {
      if (!this.hasFetchedStrokes) await this.fetchStrokes();
      this.quickplay()
    },
    syncAnimation () {
      if (this.syncedVisualAndAudio) return; 
      if (this.resourcesLoaded) {
        const audioRecorder = this.$refs['audio-recorder']
        const animation = this.$refs['animation']
        animation.startSync(audioRecorder.getAudioTime)
        this.syncedVisualAndAudio = true
      }
    },
    handleAnimationLoaded () {
      this.animationLoaded = true 
      this.$emit("animation-loaded")
    },
    async quickplay () {
      this.overlay = false
      const animation = this.$refs["animation"]
      await animation.quickplay()
      this.overlay = true
    },
    async fetchStrokes () {
      const P = new Promise(async resolve => {
        if (!this.whiteboardID) resolve();
        const baseRef = db.collection("whiteboards").doc(this.whiteboardID)
        if (this.hasSubcollection === false) {
          const doc = await baseRef.get()
          this.strokes = doc.data().strokes  
        } else {
          const strokesRef = baseRef.collection("strokes").orderBy("strokeNumber", "asc")
          const querySnapshot = await strokesRef.get()
          querySnapshot.forEach(doc => {
            this.strokes.push({".key": doc.id, ...doc.data()})
          })
          this.hasFetchedStrokes = true
        }
        resolve()
      })
      return P 
    }
  }
}
</script>
