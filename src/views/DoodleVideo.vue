<template>
  <div class="video">
    <v-container fluid class="pa-0">
      <v-layout>
        <div v-if="video && user" style="margin: auto;">
          <div v-if="user.email == 'eltonlin1998@gmail.com'" class="text-xs-center">
            <v-btn @click="deleteVideo()" class="red white--text">
              DELETE VIDEO
            </v-btn>
          </div>
        </div>
      </v-layout>

      <animation v-if="allStrokes"
                 ref="animation"
                 :strokes="allStrokes"
                 @animation-loaded="animationLoaded=true"
                 @animation-finished="handleEvent()"/>

      <audio-recorder v-if="audioURL"
                      ref="audio-recorder"
                      :audioURL="audioURL"
                      @recorder-loading="recorderLoaded=false"
                      @play="syncAnimation()"
                      @seeking="syncAnimation()"
                      @recorder-loaded="recorderLoaded=true"/>

    </v-container>
  </div>
</template>

<script>
import db from '@/database.js'
import Animation from '@/components/Animation.vue'
import AudioRecorder from '@/components/AudioRecorder.vue'
import { mapState } from 'vuex'
import firebase from 'firebase/app'
import 'firebase/storage'
import 'firebase/functions'

export default {
  props: {
    strokes: Array
  },
  components: {
    Animation,
    AudioRecorder
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
      // initialize/reset variables
      this.syncedVisualAndAudio = false
      this.recorderLoaded = false
      this.animationLoaded = false
      const classID = this.$route.params.class_id
      this.audioURL = '' 

      // fetch everything associated with the video
      const ref = db.collection('classes').doc(classID).collection('videos').doc(this.$route.params.video_id)
      const videoDoc = await ref.get()
      this.video = videoDoc.data()
      console.log('this.video =', this.video)
      if (this.video.whiteboardID) {
        this.whiteboardRef = db.collection('whiteboards').doc(this.video.whiteboardID)
        const whiteboardDoc = await this.whiteboardRef.get()
      }  
      if (this.video.audioURL) {
        this.audioURL = this.video.audioURL
      }
    
      // bind strokes
      const strokesRef = db.collection('whiteboards').doc(this.video.whiteboardID).collection('strokes')
      if (this.video.audioPath) {
        await this.$binding('allStrokes', strokesRef.orderBy('startTime', 'asc'))
      } else {
        await this.$binding('allStrokes', strokesRef.orderBy('strokeNumber', 'asc'))
      }

      // other setup 
      // TODO: stop using root listeners and instead use a navcomponent directly here
      this.$root.$on('replay-silent-animation', this.quickplay) // when pressing the replay icon, the whiteboard will replay

      // now bind references to make it easy to delete things
      const storageRef = firebase.storage().ref()
      if (this.video.audioPath) {
        this.audioFileRef = storageRef.child(`recordings/${this.video.audioPath}`)
      }
    },
    async deleteVideo () {
      const classID = this.$route.params.class_id
      const videoID = this.$route.params.video_id
      const videoRef = db.collection('classes').doc(classID).collection('videos').doc(videoID)
      const recursiveDelete = firebase.functions().httpsCallable('recursiveDelete')
      
      // delete video, whiteboard, strokes, and audio
      recursiveDelete({ path: `whiteboards/${this.video.whiteboardID}` })
      videoRef.delete()
      if (this.audioFileRef) {
        this.audioFileRef.delete()
      }

      this.$router.push(`/${classID}/ranking`)
    }
  }
}
</script>
