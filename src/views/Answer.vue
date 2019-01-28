<template>
  <div class="answer">
     <v-container fluid class="pa-0">
        <!-- <div style="text-align: center;">
          <p v-if="explanation" class="body-2">{{ explanation.question }}</p>
        </div> -->
    <!-- <p v-if="explanation">{{ explanation }}</p> -->
    <template v-if="explanation">
      <audio-recorder v-show="false" 
                      ref="audio-recorder"
                      :audioURL="explanation.audioURL"
                      :audioPath="explanation.audioPath"/>
    </template>

      <v-layout id="whiteboard-buttons-layout">
        <div style="margin: auto;">
          <v-btn @click="playVideo()">PLAY VIDEO</v-btn>
          <template v-if="user">
            <v-btn v-if="user.name == 'Elton Lin'" @click="deleteVideo()">DELETE VIDEO</v-btn>
          </template>
          <v-btn @click="quickplay()">QUICKPLAY</v-btn>
          <v-btn>SHOW QUESTION</v-btn>
        </div>
      </v-layout>

      <animation ref="animation" :explanationId="explanationId"/>
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
    ...mapState(['user'])
  },
  data() {
    return {
      explanationId: null,
      explanation: null, 
    }
  },
  watch: {
    $route: {
      handler: 'bindVariables',
      immediate: true
    }
  },
  methods: {
    playVideo() {
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
