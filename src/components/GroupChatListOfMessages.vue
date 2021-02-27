<template>
   <v-list style="max-height: 500px" class="overflow-y-auto">
    <v-list-item v-for="(message, i) in allMessages" :key="message.id" :ref="i === allMessages.length - 1 ? 'NewestMessage' : ''">
      {{ message.author.firstName + " " + message.author.lastName }} ({{ displaySimpleTimestamp(message.timestamp) }}):
      {{ message.content }} 
    </v-list-item>
  </v-list>
</template>

<script>
export default {
  props: {
    allMessages: {
      type: Array,
      required: true
    }
  },
  watch: {
    async allMessages () {
      await this.$nextTick(); 
      this.scrollToBottom();
    }
  },
  async mounted () {
    setTimeout(this.scrollToBottom, 500);
  },
  methods: {
    scrollToBottom () {
      const { NewestMessage } = this.$refs; 
      if (NewestMessage) {
        NewestMessage[0].$el.scrollIntoView({ alignToTop: false, behavior: "smooth" });
      }
    },
    displaySimpleTimestamp (timestamp) {
      if (!timestamp) return ""; 
      return timestamp.toDate().toLocaleString(undefined, { 
        day: "numeric",
        month: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    }
  }
}

</script>