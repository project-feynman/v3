<template>
  <v-card>
    <v-navigation-drawer 
      v-if="$route.path != '/'"
      v-model="drawer"
      :mini-variant.sync="mini"
      permanent
      app
    >

      <!-- <v-list-item>
        <v-list-item-avatar>
          <v-img src="https://randomuser.me/api/portraits/men/85.jpg"></v-img>
        </v-list-item-avatar>

        <v-list-item-title>John Leider</v-list-item-title>

        <v-btn
          icon
          @click.stop="mini = !mini"
        >
          <v-icon>mdi-chevron-left</v-icon>
        </v-btn>
      </v-list-item> -->
      <v-divider></v-divider>

      <v-list>
        <v-list-item link to="/">
          <v-list-item-icon><v-icon>home</v-icon></v-list-item-icon>
          <v-list-item-content>Home</v-list-item-content>

          <v-btn
            icon
            @click.prevent="mini = !mini"
          >
          <v-icon>mdi-chevron-left</v-icon>
        </v-btn>
        </v-list-item>

        <v-list-item link :to="`/${this.$route.params.class_id}/gallery`">
          <v-list-item-icon><v-icon>video_library</v-icon></v-list-item-icon>
          <v-list-item-content>Videos</v-list-item-content>
        </v-list-item>

        <!-- <v-list-item link :to="`/${this.$route.params.class_id}/classmates`">
          <v-list-item-icon><v-icon>mdi-account</v-icon></v-list-item-icon>
          <v-list-item-content>Classmates</v-list-item-content>
        </v-list-item>    -->
        
        <v-divider></v-divider>

        <v-list-item>
        <v-list-item-content>
          <v-list-item-title class="title">
            Blackboards
          </v-list-item-title>
          <v-list-item-subtitle>
            Below is where you talk and draw
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>

      <v-divider></v-divider>

        <!-- BLACKBOARDS -->
        <v-list-item 
          v-for="(workspace, i) in workspaces" :key="workspace['.key']"
          :to="`/${$route.params.class_id}/workspace/${workspace['.key']}`"
        >
          <!-- <v-list-item-icon><v-icon>record_voice_over</v-icon></v-list-item-icon> -->
          <template v-if="workspace.members">
          
            <v-list-item-content>
              {{ i }}
              <template v-for="(member, i) in workspace.members">
                <div style="display: flex;" :key="i">
                  <v-icon color="pink">
                    person
                  </v-icon>
                  <p class="pl-4 pt-4">{{ workspace.members[i].email }}</p>
                </div>
              </template>
            </v-list-item-content>
          </template>
        </v-list-item>

        <v-list-item @click="addWorkspace()">
          <v-list-item-icon><v-icon>add</v-icon></v-list-item-icon>
          <v-list-item-content color="purple">
              NEW BLACKBOARD
            <!-- <v-btn @click="addWorkspace()">Add blackboard</v-btn> -->
          </v-list-item-content>
        </v-list-item>   

      </v-list>
    </v-navigation-drawer>
  </v-card>
</template>

<script>
import { mapState } from 'vuex'
import db from '@/database.js'
import firebase from 'firebase/app'
import "firebase/auth"
import NewClassPopup from '@/components/NewClassPopup.vue'
import LoginPopup from "@/components/LoginPopup.vue"
import VuetifyMenu from "@/components/VuetifyMenu.vue"

export default {
  data () {
    return {
      drawer: true,
      mini: false,
      prevClassID: "",
      workspaces: []
    }
  },
  watch: {
    $route: {
      handler: 'updateNavComponents',
      immediate: true
    },
  },
  methods: {
    async addWorkspace () {
      const ref = db.collection("classes").doc(this.prevClassID).collection("workspaces")
      // create an empty blackboard 
      const whiteboardRef = await db.collection("whiteboards").add({})
      console.log("whiteboardRef.id =", whiteboardRef.id)
      await ref.add({
        ownerUID: "123",
        whiteboardID: whiteboardRef.id
      })
      console.log("added a new workspace")
    },
    clickedButtonStateName () {
      const buttonState = this.clickedButtonStateName
      this[buttonState] = !this[buttonState]
      this.$root.$on('delete-whiteboard-strokes-success', () => (this[buttonState] = false))
      this.clickedButtonStateName = null
    },
    async updateNavComponents () {
      const classID = this.$route.params.class_id
      // sidenav content should not reload everytime the user navigates between the workspaces, but should update
      // everytime the user visits a different TA page
      if (classID && classID != this.prevClassID) {
        // update sidenav content
        const classRef = db.collection('classes').doc(classID)
        await this.$binding('workspaces', classRef.collection('workspaces'))
        this.prevClassID = classID
      }
    }
  },
}
</script>