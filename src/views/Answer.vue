<template>
  <div class="about">
     <v-container fluid>
      <v-layout wrap>
        <p v-if="explanation">{{ explanation.question }}</p>
        <v-flex md12>
          <animation :explanationId="explanationId"/>
        </v-flex>
      </v-layout>
    </v-container>
  </div>
</template>

<script>
import db from '@/database.js'
import Animation from '@/components/Animation.vue'

export default {
  components: {
    Animation
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
    bindVariables() {
      this.explanationId = this.$route.params.id
      this.$binding('explanation', db.collection('explanations').doc(this.$route.params.id))
    },
  }
}
</script>
