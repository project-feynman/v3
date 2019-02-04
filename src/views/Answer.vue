<template>
  <div class="answer">
     <v-container fluid class="pa-0">
      <v-layout id="whiteboard-buttons-layout">
        <div style="margin: auto;">
          <template v-if="user">
            <v-btn v-if="user.name == 'Elton Lin'" @click="deleteVideo()">DELETE VIDEO</v-btn>
          </template>
          <!-- DIALOG -->
          <v-dialog v-model="dialog" max-width="290">
            <!-- SEE QUESTION -->
            <v-btn slot="activator" color="primary" dark>SEE QUESTION</v-btn>
            <v-card>
              <v-card-title class="headline">
                <slot name="title">
                  Question
                </slot>
              </v-card-title>

              <v-card-text>
                <slot name="text">
                  <p v-if="explanation">{{ explanation.question }}</p>
                </slot>
              </v-card-text>
              <v-card-actions>
                <v-spacer></v-spacer>
                <slot name="button">

                </slot>
                <v-btn color="green darken-1" flat @click="dialog = false">OK</v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
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
  created() {
    console.log('ANSWER CREATED')
  },
  data() {
    return {
      explanationId: null,
      explanation: null, 
      dialog: false,
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
        console.log('syncAnimation()')
        const audioRecorder = this.$refs['audio-recorder']
        const animation = this.$refs['animation']
        console.assert(audioRecorder) // We require audio playback -- it's how we control playback.
        animation.playVisual(audioRecorder.getAudioTime)
      }
    },
    deleteVideo() {
      const animation = this.$refs['animation']
      if (animation) {
        animation.handleDeletion()
      }
    },
    quickplay() {
      const animation = this.$refs['animation']
      if (animation) {
        animation.quickplay()
      }
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
