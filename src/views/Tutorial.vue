<template>
  <div>
    <div v-if="feedback">{{ feedback }}</div>
          <!-- <transition name="fade">
          <template v-if="!isFetchingUser">
                <p>
          The most elegant explanations are often made by TAs while they are helping their students. However, year after year, these explanations are lost<br>
          meaning other students don't benefit, and other TAs have to re-invent the wheel to explain recurring concepts.<br>

          Feynman is a place where elegant explanations from TAs can be harnessed to evolve the world's academic content. 
        </p>
        <h3>How it works</h3>
        <p>
          Sal Khan wanted to help his nephew study, despite that she was in a different country. The videos he made formed the basis of KhanAcademy<br>
          Here, each TA is a "Sal Khan", and each recitation student is a "nephew". The explanations TAs make will form the basis of Feynman.
        </p>
          </template>
        </transition> -->
        <!-- <transition name="fade">
          <template v-if="!isFetchingUser">
       <template v-if="user">
        <h3>Introduction</h3>
        <p>
          The most elegant explanations are often made by TAs while they are helping their students. However, year after year, these explanations are lost<br>
          meaning other students don't benefit, and other TAs have to re-invent the wheel to explain recurring concepts.<br>

          Feynman is a place where elegant explanations from TAs can be harnessed to evolve the world's academic content. 
        </p>
        <h3>How it works</h3>
        <p>
          Sal Khan wanted to help his nephew study, despite that she was in a different country. The videos he made formed the basis of KhanAcademy<br>
          Here, each TA is a "Sal Khan", and each recitation student is a "nephew". The explanations TAs make will form the basis of Feynman.
        </p>
        <h3>Teachers</h3>
        <div class="responsive-grid">
          <template v-for="TA in teachers">
            <v-layout :key="TA.uid">
              <v-flex>
                <v-card>
                  <v-card-title primary-title>
                    <div>
                      <h3 class="headline mb-0">{{ TA.name }}</h3>
                      <div>You can write a sentence here</div>
                    </div>
                  </v-card-title>
                  <v-card-actions>
                    <v-btn flat color="orange" @click="$router.push(TA.uid)">Enter</v-btn>
                  </v-card-actions>
                </v-card>
              </v-flex>
            </v-layout>
          </template>
        </div>
        <v-btn @click="signOut()">Log out</v-btn>
      </template>
    </template>
      </transition> -->
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
