<template>
  <div class="chat">
    <v-card>
        <v-card-title>
          <v-layout>
            <h3 v-if="owner">{{ owner.name }}</h3>
            <v-icon right small color="green" class="mx-2">fiber_manual_record</v-icon>
          </v-layout>
        </v-card-title>

        <v-card-text v-if="owner" v-for="message in messages" :key="message['.key']">
          <v-layout>
            <span v-if="owner.name" class="teal--text">{{ firstName(owner.name) }}:</span>
            <span class="grey--text text--darken--3 mx-1">{{ message.content }}</span>
          </v-layout>
          <span class="grey--text time">6:00 pm, January 1st</span>
        </v-card-text>
        
        <v-divider></v-divider>
        <v-card-actions>
          <v-form style="width: 100%">
            <v-text-field
              v-model="message"
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

export default {
  props: ['ownerUid'],
  data: () => ({
    message: 'Hey!',
    marker: true,
    iconIndex: 0,
  }),
  computed: {
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
    sendMessage () {
      this.resetIcon()
      this.clearMessage()
    }
  }
}
</script>

<style>
.time {
	display: block;
	font-size: 0.8em;
}

</style>
