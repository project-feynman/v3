<template>
  <div></div>
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
      handler: 'initTable', 
      immediate: true
    }
  },
  methods: {
    async initTable() {
      if (!this.isFetchingUser && this.user) {
        const userUid = this.user.uid
        const teacherUid = this.$route.params.teacher_id 

        const workspaceId = userUid + '-' + teacherUid 
        const ref = db.collection('workspaces').doc(workspaceId)

        const workspace = await ref.get()
        if (!workspace.exists) {
          await ref.set({
            ownerName: this.user.displayName,
            ownerUid: this.user.uid,
            teacherUid: this.$route.params.teacher_id 
          })
          console.log('successfully created new workspace')
        }
      }
    }
  }
}
</script>

<style>
</style>
