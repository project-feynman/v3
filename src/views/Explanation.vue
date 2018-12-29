<template>
  <div class="about">
     <v-container fluid>
      <v-layout wrap>
        <v-flex md4>
          <chat-log/>
        </v-flex>
        <v-flex md8>
          <whiteboard/>
        </v-flex>
      </v-layout>
    </v-container>
  </div>
</template>

<script>
import ChatLog from '@/components/ChatLog.vue'
import Whiteboard from '@/components/Whiteboard'

export default {
  components: {
    ChatLog,
    Whiteboard
  }
}
</script>
