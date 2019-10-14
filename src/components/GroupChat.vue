<template>
  <v-card
    class="mx-auto"
    max-width="800"
  >
    <v-card-text>
      <p class="display-1 text--primary">
        Example of how to use: 
      </p>
      <p>"I still don't understand Singular Value Decomposition and am lost - requesting an explanation :]"</p>
      <v-divider/>
      <v-divider/>

      <ul class="messages" v-chat-scroll>
        <li v-for="message in messages" :key="message['.key']">
          <span class="teal-text">{{ message.author }}: </span>
          <span class="grey-text">{{ message.content }}</span>
          <span class="grey-text time">{{ prettifyDate(message.timestamp) }}</span>
        </li>
      </ul>
    
    </v-card-text>
    <v-card-actions>
      <v-textarea
        name="input-7-1"
        label="New message"
        v-model="newMessage"
        hint="Type your message above :]"
        @keydown="event => handleKeydown(event)"
      ></v-textarea>

    </v-card-actions>
  </v-card>
</template>

<script>
import db from "@/database.js"
import moment from "moment"

export default {
  props: {
    classID: String
  },
  data () {
    return {
      messages: [],
      newMessage: ""
    }
  },
  computed: {
    ref () {
      return db.collection("classes").doc(this.classID).collection("messages").orderBy("timestamp")
    }
  },
  created () {
    this.$binding("messages", this.ref)
  },
  methods: {
    prettifyDate (timestamp) {
      return moment(timestamp).format('lll')
    },
    async handleKeydown (event) {
      if (event.key != "Enter") {
        return
      }
      const ref = db.collection("classes").doc(this.classID).collection("messages").orderBy("timestamp")
      const newMessage = this.newMessage
      this.newMessage = ""
      if (this.user) {
        ref.add({ 
          content: newMessage,
          timesetamp: Date.now(),
          author: this.user.email
        })
      } else {
        ref.add({ 
          content: newMessage,
          timestamp: Date.now(),
          author: "Anonymous"
        })
      }
    }
  }
}
</script>

<style scoped>
input {
  color: black;
}
span {
  font-size: 1.4em;
}
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