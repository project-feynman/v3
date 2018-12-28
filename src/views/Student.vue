<template>
  <div class="student">
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
import firebase from 'firebase'
import db from '@/database'
import Chat from '@/components/Chat'
import Whiteboard from '@/components/Whiteboard'

export default {
  async created() {
    const ref = db.collection('students').doc('123')
    const firstStudent = await ref.get() 
    console.log('first student =', firstStudent.data())
  },
  components: {
    Chat,
    Whiteboard
  }
}
</script>