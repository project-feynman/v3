<template>
  <div v-if="feedback">{{ feedback }}</div>
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
        const teacherUid = this.$route.params.teacher_id
        const workspaceId = this.user.uid + '-' + teacherUid 
        const ref = db.collection('workspaces').doc(workspaceId)
          
        const workspace = await ref.get()
        if (!workspace.exists) {
          let workspace = {
            ownerName: this.user.name,
            ownerUid: this.user.uid,
            teacherUid: this.$route.params.teacher_id,
            isOffice: false,
          }
          console.log('this.user =', this.user)
          this.feedback = this.user 
          if (this.user.isTeacher) {
            workspace.isOffice = true 
          }
          await ref.set(workspace)
          console.log('successfully created new workspace')
          this.feedback = 'successfully created a new workspace for you!'
        }
        this.$router.push(`/${teacherUid}/workspace/${teacherUid}-${this.user.uid}`)
      }
    }
  }
}
</script>

<style>
</style>
