<template>
  <div class="about">
     <v-container fluid>
      <v-layout wrap>
        <!-- <v-flex md4>
          <chatlog :explanationUid="explanationId"/>
        </v-flex> -->
        <p v-if="explanation">{{ explanation.question }}</p>
        <v-flex md12 mx-2>
          <animation :explanationId="explanationId"/>
        </v-flex>
      </v-layout>
    </v-container>
  </div>
</template>

<script>
import db from '@/database.js'
import Chatlog from '@/components/Chatlog.vue'
import Animation from '@/components/Animation.vue'

export default {
  components: {
    Chatlog,
    Animation
  },
  data() {
    return {
      explanationId: null,
      explanation: null, 
    }
  },
  // created() {
  //   this.explanationId = this.$route.params.id
  //   this.$root.$on('delete-explanation', this.deleteExplanation)
  //   this.$binding('explanation', db.collection('explanations').doc(this.$route.params.id))
  // },
  watch: {
    $route: {
      handler: 'bindVariables',
      immediate: true
    }
  },
  methods: {
    bindVariables() {
      this.explanationId = this.$route.params.id
      this.$root.$on('delete-explanation', this.deleteExplanation)
      this.$binding('explanation', db.collection('explanations').doc(this.$route.params.id))
    },
    async deleteExplanation() {
      await db.collection('explanations').doc(this.explanationId).delete()
      console.log('deletion finished')
    }
  }
}
</script>
