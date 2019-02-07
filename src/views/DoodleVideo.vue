<template>
  <div class="video">
     <v-container fluid class="pa-0">
      <v-layout>
        <div style="margin: auto;">
          <!-- <template v-if="user">
            <v-btn @click="deleteVideo()">DELETE VIDEO</v-btn>
          </template> -->
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

        <animation v-else
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
        console.log('playVisual)')
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
