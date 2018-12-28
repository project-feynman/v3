<template>
  <div class="student">
    <v-container fluid>
      <v-layout wrap>
        <v-flex md4>
          <template v-if="firstStudent">
            <chat :owner="firstStudent.name"/>
          </template>
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
  components: {
    Chat,
    Whiteboard
  },
  data() {
    return {
      firstStudent: null
    }
  },
  async created() {
    const ref = db.collection('students').doc('123')
    this.firstStudent = await ref.get() 
    this.firstStudent = this.firstStudent.data() 
    console.log('first student =', this.firstStudent)
  },
}
</script>