<template>
  <div class="video">
     <v-container fluid class="pa-0">
      <v-layout>
        <div v-if="video && user" style="margin: auto;">
          <p>{{ user }}</p>
          <template v-if="user.email == 'eltonlin1998@gmail.com'">
            <div class="text-xs-center">
              <v-btn @click="deleteVideo()" class="red white--text">
                DELETE VIDEO
              </v-btn>
            </div>
          </template>
        </div>
      </v-layout>
      <template>
        <!-- <animation v-if="strokes"
                   ref="animation" 
                   @animation-loaded="animationLoaded=true"
                   @animation-finished="handleEvent()"/> -->

        <!-- <animation v-else-if="workspaceId"
                   ref="animation" 
                   :workspaceId="workspaceId"
                   @animation-loading="animationLoaded=false"
                   @animation-loaded="animationLoaded=true"
                   @animation-finished="handleEvent()"/> -->

        <animation v-if="explanation"
                   ref="animation" 
                   :explanationId="explanationId"
                   @animation-loaded="animationLoaded=true"
                   @animation-finished="handleEvent()"/>
      </template>

      <template>
        <!-- QUICKFIX -->
        <audio-recorder v-if="audioURL"
                        ref="audio-recorder"
                        :audioURL="audioURL"
                        @recorder-loading="recorderLoaded=false"
                        @play="syncAnimation()"
                        @seeking="syncAnimation()"
                        @recorder-loaded="recorderLoaded=true"/>

        <!-- BACKWARDS COMPATIBILITY -->
        <audio-recorder v-else-if="explanation"
                        ref="audio-recorder"
                        @play="syncAnimation()"
                        @seeking="syncAnimation()"
                        :audioURL="explanation.audioURL"
                        @recorder-loaded="recorderLoaded=true"/>
      </template>
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
    ...mapState(['user']),
    resourcesLoaded() {
      return this.recorderLoaded && this.animationLoaded
    }
  },
  data() {
    return {
      video: null,
      explanationId: null,
      explanation: null, 
      recorderLoaded: false,
      animationLoaded: false,
      syncedVisualAndAudio: false,
      whiteboardRef: null,
      audioFileRef: null 
    }
  },
  watch: {
    $route: {
      handler: 'bindVariables',
      immediate: true
    }
  },
  destroyed () {
    console.log('destroyed')
  },
  methods: {
    syncAnimation() {
      if (this.syncedVisualAndAudio) {
        return 
      } else if (this.resourcesLoaded) {
        const audioRecorder = this.$refs['audio-recorder']
        const animation = this.$refs['animation']
        animation.startSync(audioRecorder.getAudioTime)
        this.syncedVisualAndAudio = true
      }
    },
    deleteVideo() {
      // delete the video document
      const classID = this.$route.params.teacher_id
      const videoRef = db.collection('classes').doc(classID).collection('videos').doc(this.$route.params.id)
      videoRef.delete()
      // delete the strokes (screw the subcolletions for who honestly cares)
      this.whiteboardRef.delete() 
      // delete the audio 
      this.audioFileRef.delete()
      console.log('successfully deleted master document, strokes and audio file')
      // 
      // const animation = this.$refs['animation']
      // if (animation) {
      //   animation.handleDeletion()
      // }
    },
    quickplay() {
      const animation = this.$refs['animation']
      animation.quickplay()
    },
    async bindVariables() {
      // this.$forceUpdate()
      this.syncedVisualAndAudio = false 
      this.recorderLoaded = false 
      this.animationLoaded = false 
      const classID = this.$route.params.teacher_id
      // fetch video doc 
      const ref = db.collection('classes').doc(classID).collection('videos').doc(this.$route.params.id)
      const videoDoc = await ref.get()
      this.video = videoDoc.data()
      this.explanationId = this.video.whiteboardID
      // now fetch whiteboard 
      const whiteboardRef = db.collection('whiteboards').doc(this.video.whiteboardID)
      this.whiteboardRef = whiteboardRef 
      const whiteboardDoc = await whiteboardRef.get() 
      if (whiteboardDoc.exists) {
        const storageRef = firebase.storage().ref()
        this.explanation = whiteboardDoc.data()
        this.audioFileRef = storageRef.child(`recordings/${this.explanation.audioPath}`)
      }
    }
  }
}
</script>
