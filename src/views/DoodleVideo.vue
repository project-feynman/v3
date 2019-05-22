<template>
  <div class="video">
    <v-container fluid class="pa-0">
      <v-layout>
        <div v-if="video && user" style="margin: auto;">
          <template v-if="user.email == 'eltonlin1998@gmail.com'">
            <div class="text-xs-center">
              <v-btn @click="deleteVideo()" class="red white--text">DELETE VIDEO</v-btn>
            </div>
          </template>
        </div>
      </v-layout>

      <animation
        v-if="allStrokes"
        ref="animation"
        :strokes="allStrokes"
        @animation-loaded="animationLoaded=true"
        @animation-finished="handleEvent()"
      />

      <audio-recorder
        v-if="betaAudioURL"
        ref="audio-recorder"
        :audioURL="betaAudioURL"
        @play="syncAnimation()"
        @seeking="syncAnimation()"
        @recorder-loaded="recorderLoaded=true"
      />

        <!-- FUTURE FIX -->
        <!-- <audio-recorder
          v-if="audioURL"
          ref="audio-recorder"
          :audioURL="audioURL"
          @recorder-loading="recorderLoaded=false"
          @play="syncAnimation()"
          @seeking="syncAnimation()"
          @recorder-loaded="recorderLoaded=true"
        /> -->

    </v-container>
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
    workspaceId: String
  },
  components: {
    Animation,
    AudioRecorder
  },
  computed: {
    ...mapState(["user"]),
    resourcesLoaded() {
      return this.recorderLoaded && this.animationLoaded;
    }
  },
  data () {
    return {
      video: null,
      betaAudioURL: '',
      recorderLoaded: false,
      animationLoaded: false,
      syncedVisualAndAudio: false,
      whiteboardRef: null,
      audioFileRef: null,
      allStrokes: null
    }
  },
  watch: {
    $route: {
      handler: 'bindVariables',
      immediate: true
    }
  },
  methods: {
    syncAnimation() {
      if (this.syncedVisualAndAudio) {
        return
      } else if (this.resourcesLoaded) {
        const audioRecorder = this.$refs["audio-recorder"]
        const animation = this.$refs["animation"]
        animation.startSync(audioRecorder.getAudioTime)
        this.syncedVisualAndAudio = true
      }
    },
    quickplay() {
      const animation = this.$refs["animation"]
      animation.quickplay()
    },
    async bindVariables() {
      // initialize/reset variables
      this.syncedVisualAndAudio = false
      this.recorderLoaded = false
      this.animationLoaded = false
      const classID = this.$route.params.class_id

      // fetch video document
      const ref = db.collection("classes").doc(classID).collection("videos").doc(this.$route.params.video_id)
      const videoDoc = await ref.get()
      this.video = videoDoc.data()

      if (this.video.whiteboardID) {
        this.whiteboardRef = db.collection('whiteboards').doc(this.video.whiteboardID)
        const whiteboardDoc = await this.whiteboardRef.get()
      }  

      if (this.video.audioURL) {
        this.betaAudioURL = this.video.audioURL
      }
    
      // bind strokes
      const strokesRef = db.collection('whiteboards').doc(this.video.whiteboardID).collection('strokes')
      if (this.video.audioPath) {
        await this.$binding('allStrokes', strokesRef.orderBy('startTime', 'asc'))
      } else {
        await this.$binding('allStrokes', strokesRef.orderBy('strokeNumber', 'asc'))
      }

      // other setup
      this.$root.$on('replay-silent-animation', this.quickplay)

      // now bind references to make it easy to delete things
      const storageRef = firebase.storage().ref()
      this.audioFileRef = storageRef.child(`recordings/${this.video.audioPath}`)
    },
    deleteVideo() {
      const classID = this.$route.params.class_id
      const videoRef = db.collection('classes').doc(classID).collection('videos').doc(this.$route.params.video_id)
      videoRef.delete()
      // delete the strokes (screw the subcollections for who honestly cares)
      if (this.whiteboardRef) {
        this.whiteboardRef.delete()
      }
      if (this.audioFileRef) {
        this.audioFileRef.delete()
      }
    }
  }
};
</script>
