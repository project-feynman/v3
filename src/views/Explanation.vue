<template>
  <div class="about">
     <v-container fluid>
      <v-layout wrap>
        <v-flex md4>
          <chat/>
        </v-flex>
        <v-flex md8>
          <whiteboard/>
        </v-flex>
      </v-layout>
    </v-container>
  </div>
</template>

<script>
import Chat from '@/components/Chat'
import Whiteboard from '@/components/Whiteboard'

export default {
  components: {
    Chat,
    Whiteboard
  }
}
</script>
