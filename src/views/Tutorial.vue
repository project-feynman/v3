<template>
  <div>
    <div v-if="feedback">{{ feedback }}</div>
  </div>
</template>

<script>
import db from '@/database.js'
import { mapState } from 'vuex'

export default {
  computed: {
    ...mapState(['user', 'isFetchingUser'])
  },
  watch: {
    isFetchingUser: {
      handler: 'initWorkspace', 
      immediate: true
    }
  },
  data() {
    return {
      feedback: ''
    }
  },
  methods: {
    async initWorkspace() {
      if (!this.isFetchingUser && this.user) {
        const classID = this.$route.params.class_id 
        const ref = db.collection('classes').doc(classID).collection('workspaces').doc(this.user.uid)
        const workspace = await ref.get()
        if (!workspace.exists) {
          // create a whiteboard 
          const whiteboardRef = await db.collection('whiteboards').add({})
          let workspace = {
            ownerName: this.user.name,
            ownerUID: this.user.uid,
            whiteboardID: whiteboardRef.id 
          }
          await ref.set(workspace)
          this.feedback = 'successfully created a new workspace for you!'
        } else {
          console.log('redirecting to the user workspace')
        }
        this.$router.push(`/${classID}/workspace/${this.user.uid}`)
      }
    }
  }
}
</script>

<style>
</style>
