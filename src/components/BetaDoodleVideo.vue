<template>
  <div style="height: 100%; width: 100%;">
    <animation 
      v-if="strokes"
      ref="animation"
      :strokes="strokes"
      :isFullscreen="false"
      :canvasID="canvasID"
      @animation-loaded="animationLoaded=true"
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
  </div>
</template>

<script>
import db from "@/database.js";
import Animation from "@/components/Animation.vue";
import AudioRecorder from "@/components/AudioRecorder.vue";
import { mapState } from "vuex";
import firebase from "firebase/app";
import "firebase/storage";

export default {
  props: {
    strokes: Array,
    audioURL: String,
    canvasID: String
  },
  components: {
    Animation,
    AudioRecorder
  },
  data () {
    return {
      recorderLoaded: false,
      animationLoaded: false,
      syncedVisualAndAudio: false,
    }
  },
  computed: {
    ...mapState(["user"]),
    resourcesLoaded() {
      return this.recorderLoaded && this.animationLoaded;
    }
  },
  methods: {
    syncAnimation () {
      if (this.syncedVisualAndAudio) {
        return
      } else if (this.resourcesLoaded) {
        const audioRecorder = this.$refs['audio-recorder']
        const animation = this.$refs['animation']
        animation.startSync(audioRecorder.getAudioTime)
        this.syncedVisualAndAudio = true
      }
    },
    quickplay () {
      const animation = this.$refs["animation"]
      animation.quickplay()
    }
  }
};
</script>
