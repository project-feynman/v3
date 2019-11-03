<template>
  <v-card>
    <v-navigation-drawer 
      app
      v-model="value"
      clipped
    >
      <v-divider/>

      <v-list>
        <v-list-item link to="/">
          <v-list-item-icon><v-icon>home</v-icon></v-list-item-icon>
          <v-list-item-content>Home</v-list-item-content>
        </v-list-item>

        <v-list-item link :to="`/${this.$route.params.class_id}/videos`">
          <v-list-item-icon><v-icon>video_library</v-icon></v-list-item-icon>
          <v-list-item-content>Videos</v-list-item-content>
        </v-list-item>
        
        <v-divider/>

        <v-list-item>
          <v-list-item-content>
            <v-list-item-title class="title">
              Blackboards
            </v-list-item-title>
            <!-- <v-list-item-subtitle>
              Below is where you talk and draw
            </v-list-item-subtitle> -->
          </v-list-item-content>
        </v-list-item>

        <v-divider/>

        <!-- BLACKBOARDS -->
        <v-list-item 
          v-for="(workspace, i) in workspaces" :key="workspace['.key']"
          :to="`/${$route.params.class_id}/workspace/${workspace['.key']}`"
        >
          <template v-if="workspace.members">
            <v-list-item-content>
              Board {{ i }}
              <template v-for="(member, i) in workspace.members">
                <div style="display: flex;" :key="i">
                  <v-icon color="pink">person</v-icon>
                  <p class="pl-4 pt-4">{{ workspace.members[i].email }}</p>
                </div>
              </template>
            </v-list-item-content>
          </template>
        </v-list-item>

         <v-list-item
            class="mt-4"
            link
            @click="addWorkspace()"
          >
            <v-list-item-action>
              <v-icon color="grey darken-1">add</v-icon>
            </v-list-item-action>
            <v-list-item-title class="grey--text text--darken-1">NEW BLACKBOARD</v-list-item-title>
          </v-list-item>

        <!-- <v-list-item @click="addWorkspace()">
          <v-list-item-icon><v-icon>add</v-icon></v-list-item-icon>
          <v-list-item-content color="purple">
            NEW BLACKBOARD
          </v-list-item-content>
        </v-list-item>    -->

        

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
  // model: {
  //   prop: 'drawer',
  //   event: 'change'
  // },
  props: {
    value: Boolean
  },
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
    handleInput () {
      console.log("handleInput()")
    },
    async addWorkspace () {
      const ref = db.collection("classes").doc(this.prevClassID).collection("workspaces")
      // create an empty whiteboard
      const whiteboardRef = await db.collection("whiteboards").add({})
      ref.add({
        ownerUID: "123",
        whiteboardID: whiteboardRef.id
      })
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