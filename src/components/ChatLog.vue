<template>
  <div class="chat">
    <!-- <v-card v-if="messages">
      <ul v-for="message in messages" :key="message['.key']" v-chat-scroll class="messages">
        <v-card-text>
          <v-layout>
            <span class="teal--text">{{ firstName(message.author.name) }}:</span>
            <span class="grey--text text--darken--3 mx-1">{{ message.content }}</span>
          </v-layout>
          <span class="grey--text time">6:00 pm, January 1st</span>
        </v-card-text>
      </ul>
    </v-card> -->
  </div>
</template>

// <script>
// import db from '@/database.js'

// export default {
//   props: ['explanationUid'],
//   data() {
//     return {
//       messages: null
//     }
//   },
//   watch: {
//     explanationUid: {
//       handler: 'bindVariables',
//       immediate: true
//     }
//   },
//   methods: {
//     async bindVariables() {
//       const explanationRef = db.collection('explanations').doc(this.explanationUid)
//       await this.$binding('messages', explanationRef.collection('messages'))
//       this.$root.$emit('finish-loading-chat-log')
//     },
//     firstName(fullName) {
//       const names = fullName.split(' ')
//       return names[0]
//     },
//   }
// }
// </script>