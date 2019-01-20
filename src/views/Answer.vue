<template>
  <div class="about">
     <v-container fluid>
      <v-layout wrap>
        <v-btn @click="playVideo()">PLAY VIDEO</v-btn>
        <p v-if="explanation">{{ explanation.question }}</p>
        <v-flex md12>
          <animation ref="animation" :explanationId="explanationId"/>
        </v-flex>
      </v-layout>
    </v-container>
    <template v-if="explanation">
      <audio-recorder v-show="false" 
                      ref="audio-recorder"
                      :audioURL="explanation.audioURL"
                      :audioPath="explanation.audioPath"/>
    </template>
  </div>
</template>

<script>
import db from '@/database.js'
import Animation from '@/components/Animation.vue'
import AudioRecorder from '@/components/AudioRecorder.vue'

export default {
  components: {
    Animation,
    AudioRecorder
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
      console.log('animation and audioRecorder =', audioRecorder, animation)
      if (animation) { animation.playVisual() }
      if (audioRecorder) { audioRecorder.playAudio() } 
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
