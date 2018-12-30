<template>
  <div class="chat">
    <v-card>
        <v-card-title>
          <v-layout>
            <h3 v-if="owner">{{ owner.name }}</h3>
            <v-icon right small color="green" class="mx-2">fiber_manual_record</v-icon>
          </v-layout>
        </v-card-title>
        <ul v-if="owner" v-for="message in messages" :key="message['.key']" v-chat-scroll class="messages">
          <v-card-text>
            <v-layout>
              <span v-if="owner.name" class="teal--text">{{ firstName(owner.name) }}:</span>
              <span class="grey--text text--darken--3 mx-1">{{ message.content }}</span>
            </v-layout>
            <span class="grey--text time">6:00 pm, January 1st</span>
          </v-card-text>
        </ul>

        <v-divider></v-divider>
        <v-card-actions>
          <v-form @submit.prevent="addMessage" style="width: 100%">
            <v-text-field
              v-model="newMessage"
              box
              clear-icon="mdi-close-circle"
              clearable
              label="Write a message..."
              type="text"
            ></v-text-field>
          </v-form>
        </v-card-actions>
    </v-card>
  </div>
</template>


<script>
import db from '@/database.js'
import { mapState } from 'vuex'

export default {
  props: ['ownerUid'],
  data: () => ({
    newMessage: null,
    marker: true,
    iconIndex: 0,
  }),
  computed: {
    ...mapState(['user']),
    icon () {
      return this.icons[this.iconIndex]
    }
  },
  watch: {
    ownerUid: {
      handler: 'bindVariables',
      immediate: true
    }
  },
  methods: {
    bindVariables() {
      const ownerRef = db.collection('students').doc(this.ownerUid)
      this.$binding('owner', ownerRef)
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
      const author = {
        displayName: this.user.displayName,
        uid: this.user.uid
      }
      const messagesRef = db.collection('students').doc(this.ownerUid).collection('messages')
      // now, you need IDs to be added, remember that. That's a very important clarification to make. 
      await messagesRef.doc(`${this.messages.length + 1}`).set({
        content, 
        author,
      })
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
