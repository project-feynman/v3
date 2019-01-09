<template>
  <div class="student">
    <v-container fluid>
      <v-layout wrap>
        <v-flex md4>
          <chat v-if="ownerUid" :ownerUid="ownerUid"/>
        </v-flex>
        <v-flex md8>
          <whiteboard v-if="ownerUid" :ownerUid="ownerUid"/>
        </v-flex>
      </v-layout>
    </v-container>
  </div>
</template>

<script>
import firebase from 'firebase/app'
import 'firebase/firestore'
import db from '@/database'
import Chat from '@/components/Chat'
import Whiteboard from '@/components/Whiteboard'

export default {
  components: {
    Chat,
    Whiteboard
  },
  data() {
    return {
      ownerUid: null 
    }
  },
  created() {
    this.ownerUid = this.$route.params.id
  },
  watch: {
    $route(to, from) {
      this.ownerUid = this.$route.params.id
    }
  }
}
</script>