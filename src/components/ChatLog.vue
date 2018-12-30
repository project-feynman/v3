<template>
  <div class="chat-log">
    <v-card>
      <v-card-title v-if="explanation">
        <h3>{{ explanation.title }}</h3>
      </v-card-title>

      <v-card-text v-if="messages" v-for="message in messages" :key="message['.key']">
        <v-layout>
          <span class="teal--text">Vishesh:</span>
          <span class="grey--text text--darken--3 mx-1">{{ message.content }}</span>
        </v-layout>
        <span class="grey--text time">6:05 pm, January 1st</span>
      </v-card-text>

    </v-card>
  </div>
</template>

<script>
import db from '@/database.js'

export default {
  props: ['explanationUid'],
  data() {
    return {
      explanation: null,
      messages: null
    }
  },
  watch: {
    explanationUid: {
      handler: 'bindVariables',
      immediate: true
    }
  },
  methods: {
    bindVariables() {
      const explanationRef = db.collection('explanations').doc(this.explanationUid)
      this.$binding('explanation', explanationRef)
      this.$binding('messages', explanationRef.collection('messages'))
    }
  }
}
</script>