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
        const teacherUid = this.$route.params.teacher_id
        const userWorkspaceId = this.user.uid + '-' + teacherUid 
        const ref = db.collection('workspaces').doc(userWorkspaceId)
        const workspace = await ref.get()
        if (!workspace.exists) {
          let workspace = {
            ownerName: this.user.name,
            ownerUid: this.user.uid,
            teacherUid: this.$route.params.teacher_id,
            isOffice: false,
          }
          this.feedback = this.user 
          if (this.user.isTeacher && this.user.uid == this.$route.params.teacher_id) {
            workspace.isOffice = true 
          }
          await ref.set(workspace)
          console.log('successfully created new workspace')
          this.feedback = 'successfully created a new workspace for you!'
        } else {
          console.log('redirecting to the user workspace')
        }
        this.$router.push(`/${teacherUid}/workspace/${userWorkspaceId}`)
      }
    }
  }
}
</script>

<style>
</style>
