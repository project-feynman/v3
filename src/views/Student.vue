<template>
  <h2>This is the student page</h2>
</template>

<script>
import firebase from 'firebase'
import db from '@/database'

export default {
  async created() {
    const ref = db.collection('students').doc('123')
    const firstStudent = await ref.get() 
    console.log('first student =', firstStudent.data())
  }
}
</script>