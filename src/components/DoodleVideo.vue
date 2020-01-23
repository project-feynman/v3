<template >
  <div @click="fetchStrokesAndQuickplay()" style="height: 100%; width: 100%;">
    <template v-if="videoClicked || !video || !video.thumbnail">
      <DoodleVideoAnimation
        
        ref="animation"
        :strokes="strokes"
        :isFullscreen="false"
        :canvasID="canvasID"
        :height="height"
        :overlay="overlay"
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

    <template v-else>
      
      <v-img  :src="video.thumbnail"  >
        <v-container fill-height fluid>
          <v-row align="center" justify="center">
              <div>
              <v-btn fab large dark>
                <v-icon>play_arrow</v-icon>
              </v-btn>
              </div>
          </v-row>
        </v-container>  
      </v-img>  
      
    </template>

  </div>
</template>

<script>
import db from "@/database.js"
import DoodleVideoAnimation from "@/components/DoodleVideoAnimation.vue"
import BaseOverlay from "@/components/BaseOverlay.vue"
import AudioRecorder from "@/components/AudioRecorder.vue"
import { mapState } from "vuex"
import firebase from "firebase/app"
import "firebase/storage"

export default {
  props: {
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
    video: {
      type: Object,
      default () {
        return null
      }
    }
  },
  components: {
    DoodleVideoAnimation,
    AudioRecorder,
    BaseOverlay
  },
  data () {
    return {
      strokes: [],
      recorderLoaded: false,
      animationLoaded: false,
      syncedVisualAndAudio: false,
      videoClicked: false,
      strokesFetched: false,
      overlay: true
    }
  },
  computed: {
    ...mapState(["user"]),
    resourcesLoaded() {
      return this.animationLoaded && this.recorderLoaded
    }
  },
  methods: {
    async fetchStrokesAndQuickplay () {
      this.videoClicked = true
      if (!this.strokesFetched){
        await this.fetchStrokes()
      }
      this.quickplay()
    },
    syncAnimation () {
      if (this.syncedVisualAndAudio) { return } 
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
        if (!this.whiteboardID) {
          resolve()
        }
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
          this.strokesFetched = true
        }
        resolve()
      })
      return P 
    }
  }
}
</script>
