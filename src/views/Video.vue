<template>
  <div class="answer">
     <v-container fluid class="pa-0">
      <v-layout id="whiteboard-buttons-layout">
        <div style="margin: auto;">
          <template v-if="user">
            <v-btn v-if="user.name == 'Elton Lin'" @click="deleteVideo()">DELETE VIDEO</v-btn>
          </template>
        </div>
      </v-layout>

      <!-- ANIMATION -->
      <animation ref="animation" 
                 :explanationId="explanationId"
                 @animation-loaded="animationLoaded=true"
                 @animation-finished="handleEvent()"/>

      <template v-if="explanation">
        <audio-recorder v-show="true"
                        ref="audio-recorder"
                        :audioURL="explanation.audioURL"
                        :audioPath="explanation.audioPath"
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
    resourcesLoaded: {
      handler: 'syncAnimation',
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
      const animation = this.$refs['animation']
      if (animation) {
        animation.handleDeletion()
      }
      // delete audio too
    },
    quickplay() {
      const animation = this.$refs['animation']
      animation.quickplay()
    },
    async bindVariables() {
      this.recorderLoaded = false 
      this.animationLoaded = false 
      this.explanationId = this.$route.params.id
      const ref = db.collection('explanations').doc(this.$route.params.id)
      const explanationDoc = await ref.get() 
      if (explanationDoc.exists) {
        this.explanation = explanationDoc.data()
      }
    }
  }
}
</script>
