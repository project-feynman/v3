<template>
  <div class="video">
    
    <BaseAppBar :loading="!resourcesLoaded">
      <v-btn v-if="animationLoaded" @click="quickplay()">
        QUICKPLAY
      </v-btn>
    </BaseAppBar>

    <v-content>
      <v-container fluid class="pa-0">
        <DoodleVideoAnimation 
          v-if="allStrokes"
          ref="animation"
          :strokes="allStrokes"
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
      </v-container>
    </v-content>
  </div>
</template>

<script>
import db from '@/database.js'
import DoodleVideoAnimation from '@/components/DoodleVideoAnimation.vue'
import AudioRecorder from '@/components/AudioRecorder.vue'
import BaseAppBar from "@/components/BaseAppBar.vue"
import { mapState } from 'vuex'
import firebase from 'firebase/app'
import 'firebase/storage'
import 'firebase/functions'

export default {
  props: {
    strokes: Array,
    videoID: String
  },
  components: {
    DoodleVideoAnimation,
    AudioRecorder,
    BaseAppBar
  },
  computed: {
    ...mapState(['user']),
    resourcesLoaded () {
      return this.recorderLoaded && this.animationLoaded
    }
  },
  data () {
    return {
      video: null,
      audioURL: '',
      recorderLoaded: false,
      animationLoaded: false,
      syncedVisualAndAudio: false,
      audioFileRef: null,
      allStrokes: null,
      thumbnail: ''
    }
  },
  watch: {
    $route: {
      handler: "bindVariables",
      immediate: true
    },
    videoID: {
      handler: "bindVariables", 
      immediate: true
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
      const animation = this.$refs['animation']
      if (animation) {
        animation.quickplay()
      }
    },
    async bindVariables () {
      // TODO: just keep track of this.video so that I don't need to keep track of this.audioURL, this.audioPath explictly

      // initialize/reset variables
      this.syncedVisualAndAudio = false
      this.recorderLoaded = false
      this.animationLoaded = false
      this.audioURL = '' 
      
      // retrieve video
      const classID = this.$route.params.class_id
      let videoRef = null
      if (!this.videoID) {
        const videoID = this.$route.params.video_id 
        videoRef = db.collection('whiteboards').doc(videoID)
      } else {
        videoRef = db.collection("whiteboards").doc(this.videoID)
      }
      let video = await videoRef.get()
      video = video.data()
      // fix delete button logic
      this.video = video
      console.log("video =", video)
      this.thumbnail = video.thumbnail
      // audio 
      this.audioURL = video.audioURL
      // visual 
      const strokesRef = videoRef.collection('strokes')
      if (video.audioPath) {
        await this.$binding('allStrokes', strokesRef.orderBy('startTime', 'asc'))
      } else {
        await this.$binding('allStrokes', strokesRef.orderBy('strokeNumber', 'asc'))
      }
      // other setup 
      // TODO: stop using root listeners and instead use a navcomponent directly here
      this.$root.$on('replay-silent-animation', this.quickplay) // when pressing the replay icon, the whiteboard will replay

      // now bind references to make it easy to delete things
      const storageRef = firebase.storage().ref()
      if (video.audioPath) {
        this.audioFileRef = storageRef.child(`recordings/${video.audioPath}`)
      }
    },
    async deleteVideo () {
      const classID = this.$route.params.class_id
      const videoID = this.$route.params.video_id
      // const videoRef = db.collection('classes').doc(classID).collection('videos').doc(videoID)
      const recursiveDelete = firebase.functions().httpsCallable('recursiveDelete')
      // delete video, whiteboard, strokes, and audio
      // recursiveDelete({ path: `whiteboards/${this.video.whiteboardID}` })
      recursiveDelete({ path: `whiteboards/${videoID}` })
      // videoRef.delete()
      if (this.audioFileRef) {
        this.audioFileRef.delete()
      }
      this.$router.push(`/${classID}/ranking`)
    }
  }
}
</script>
