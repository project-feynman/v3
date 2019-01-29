<template>
  <div class="answer">
     <v-container fluid class="pa-0">
        <template v-if="explanation">
          <audio-recorder v-show="false" 
                          ref="audio-recorder"
                          :audioURL="explanation.audioURL"
                          :audioPath="explanation.audioPath"
                          @audio-finished="isPlayingAudio = false"/>
        </template>

      <v-layout id="whiteboard-buttons-layout">
        <div style="margin: auto;">

          <!-- PREVIEW REPLAY -->
          <v-btn :loading="isPlayingVideo"
                 :disabled="isPlayingVideo"
                 @click="playVideo()">
            <span>PLAY VIDEO</span>
            <span slot="loader">Replaying...</span>
          </v-btn>

          <!-- <v-btn @click="playVideo()">PLAY VIDEO</v-btn> -->
          <template v-if="user">
            <v-btn v-if="user.name == 'Elton Lin'" @click="deleteVideo()">DELETE VIDEO</v-btn>
          </template>
          <v-btn @click="quickplay()">QUICKPLAY</v-btn>
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
                 @animation-finished="handleEvent()"/>
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
    isPlayingVideo: {
      get() {
        return this.isPlayingVisual || this.isPlayingAudio
      },
      set(isPlayingVideo) {
        if (isPlayingVideo) {
          this.isPlayingVisual = true 
          this.isPlayingAudio = true 
        }
      }
    }
  },
  data() {
    return {
      explanationId: null,
      explanation: null, 
      dialog: false,
      isPlayingAudio: false,
      isPlayingVisual: false,
    }
  },
  watch: {
    $route: {
      handler: 'bindVariables',
      immediate: true
    }
  },
  methods: {
    handleEvent() {
      this.isPlayingVisual = false 
    },
    playVideo() {
      this.isPlayingVideo = true
      const audioRecorder = this.$refs['audio-recorder']
      const animation = this.$refs['animation']
      if (animation) { animation.playVisual() }
      if (audioRecorder) { audioRecorder.playAudio() } 
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
      this.explanationId = this.$route.params.id
      const ref = db.collection('explanations').doc(this.$route.params.id)
      const explanationDoc = await ref.get() 
      if (explanationDoc.exists) {
        this.explanation = explanationDoc.data()
      }
      // this.$binding('explanation', db.collection('explanations').doc(this.$route.params.id))
      // console.log('explanation document =', this.explanation.title)
    },
  }
}
</script>
