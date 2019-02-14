<template>
  <div class="video">
     <v-container fluid class="pa-0">
      <v-layout>
        <div v-if="video" style="margin: auto;">
          <template v-if="user.name == 'Elton Lin'">
            <v-btn @click="deleteVideo()" class="red">DELETE VIDEO</v-btn>
          </template>
        </div>
      </v-layout>
      <template>
        <animation v-if="strokes"
                   ref="animation" 
                   @animation-loaded="animationLoaded=true"
                   @animation-finished="handleEvent()"/>

        <animation v-else-if="workspaceId"
                   ref="animation" 
                   :workspaceId="workspaceId"
                   @animation-loading="animationLoaded=false"
                   @animation-loaded="animationLoaded=true"
                   @animation-finished="handleEvent()"/>

        <animation v-else-if="explanation"
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
                        @recorder-loaded="recorderLoaded=true"/>

        <!-- BACKWARDS COMPATIBILITY -->
        <audio-recorder v-else-if="explanation"
                        ref="audio-recorder"
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
      animationLoaded: false
    }
  },
  watch: {
    $route: {
      handler: 'bindVariables',
      immediate: true
    },
    recorderLoaded() {
      this.syncAnimation()
    },
    animationLoaded() {
      this.syncAnimation()
    }
  },
  methods: {
    syncAnimation() {
      if (this.resourcesLoaded) {
        const audioRecorder = this.$refs['audio-recorder']
        const animation = this.$refs['animation']
        animation.playVisual(audioRecorder.getAudioTime)
      }
    },
    deleteVideo() {
      // delete the video document
      // delete the strokes
      // delete the audio 
      const animation = this.$refs['animation']
      if (animation) {
        animation.handleDeletion()
      }
    },
    quickplay() {
      const animation = this.$refs['animation']
      animation.quickplay()
    },
    async bindVariables() {
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
      const whiteboardDoc = await whiteboardRef.get() 
      if (whiteboardDoc.exists) {
        this.explanation = whiteboardDoc.data()
      }

    }
  }
}
</script>
