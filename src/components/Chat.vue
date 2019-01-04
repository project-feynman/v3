<template>
  <div class="chat">
    <v-card>

        <v-card-title>
          <v-layout>
            <template v-if="table && user">
              <template v-if="table.owner">
                <template v-if="user.uid != $route.params.id"> 
                  <h3 v-if="user.uid != $route.params.id">{{ table.owner.name }}</h3>
                  <v-icon right small color="green" class="mx-2">fiber_manual_record</v-icon>
                </template>
                <h3 v-else>Your workspace</h3>
              </template> 
            </template>
          </v-layout>
        </v-card-title>

        <ul v-if="table" v-for="message in messages" :key="message['.key']" v-chat-scroll class="messages">
          <v-card-text>
            <v-layout>
              <template v-if="table">
                <span class="teal--text">{{ firstName(message.author.name) }}</span>
                <!-- <span v-else class="teal--text">(This is your room)</span> -->
              </template>
              <span class="grey--text text--darken--3 mx-1">{{ message.content }}</span>
            </v-layout>
            <span class="grey--text time">6:00 pm, January 1st</span>
          </v-card-text>
        </ul>

        <v-divider></v-divider>

        <v-card-actions>
          <v-layout>
            <v-flex>
              <v-textarea
                name="input-7-1"
                label="Text area"
                v-model="newMessage"
                :hint="getHint()"
                class="mb-2"
              ></v-textarea>
              <template v-if="user">
                <v-btn v-if="user.uid === $route.params.id" block @click="submitQuestion()">Submit Question</v-btn>
                <v-btn v-else @click="addMessage()" block>Submit Answer</v-btn>
              </template>
            </v-flex>
          </v-layout>
        </v-card-actions>

    </v-card>
  </div>
</template>


<script>
import db from '@/database.js'
import { mapState } from 'vuex'

export default {
  props: ['ownerUid'],
  data() {
    return {
      newMessage: null,
      marker: true,
      messages: null,
      table: null
    }
  },
  computed: {
    ...mapState(['user']),
    author() {
      return {
        name: this.user.displayName,
        uid: this.user.uid 
      }
    }
  },
  created() {
    this.$root.$on('clear-chat', this.clearMessages)
    this.$root.$on('save-explanation', docId => this.saveMessages(docId))
  },
  watch: {
    ownerUid: {
      handler: 'bindVariables',
      immediate: true
    }
  },
  methods: {
    getHint() {
      if (this.user.uid == this.$route.params.id) {
        return 'After submitting the question, your TA will be notified to answer ASAP'
      } else {
        return 'Write an answer - aim for simplicity and elegance'
      }
    },
    submitQuestion() {
      this.updateTableStatus(true)
      this.addMessage()
    },
    async updateTableStatus(isAskingQuestion) {
      const tableId = this.$route.params.id
      console.log('tableId =', tableId)
      const tableRef = db.collection('tables').doc(tableId)
      await tableRef.update({
        isAskingQuestion
      })
      console.log('successfully updated table status')
    },
    saveMessages(explanationId) {
      const explanationRef = db.collection('explanations').doc(explanationId).collection('messages')
      this.messages.forEach(message => {
        explanationRef.doc(`${message['.key']}`).set({
          author: message.author,
          content: message.content
        })
      })
    },
    bindVariables() {
      const ownerRef = db.collection('tables').doc(this.ownerUid)
      this.$binding('table', ownerRef)
      this.$binding('messages', ownerRef.collection('messages'))
    },
    firstName(fullName) {
      const names = fullName.split(' ')
      return names[0]
    },
    async addMessage() {
      if (!this.newMessage) {
        return 
      }
      const content = this.newMessage
      this.newMessage = null
      const messagesRef = db.collection('tables').doc(this.ownerUid).collection('messages')
      await messagesRef.doc(`${this.messages.length + 1}`).set({
        content,
        author: this.author
      })
    },
    async clearMessages() {
      const messagesRef = db.collection('tables').doc(this.ownerUid).collection('messages')
      for (let i=1; i < this.messages.length +1; i++) {
        messagesRef.doc(`${i}`).delete()
      }
    }
  }
}
</script>

<style>
.time {
	display: block;
	font-size: 0.8em;
}

.messages {
	max-height: 300px;
	overflow: auto;
}
.messages::-webkit-scrollbar {
	width: 3px;
}
.messages::-webkit-scrollbar-track {
	background: #ddd;
}
.messages::-webkit-scrollbar-thumb {
	background: #aaa;
}

</style>
