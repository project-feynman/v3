<template>
  <v-card>
    <v-navigation-drawer 
      v-if="$route.path != '/'"
      v-model="drawer"
      :mini-variant.sync="mini"
      permanent
      app
    >
      <v-list>
        <v-list-item link to="/">
          <v-list-item-icon>
              <v-icon>mdi-home-city</v-icon>

          </v-list-item-icon>
          <v-list-item-content>Home</v-list-item-content>
        </v-list-item>

           <v-list-item link :to="`/${this.$route.params.class_id}/classmates`">
          <v-list-item-icon><v-icon>mdi-account</v-icon></v-list-item-icon>
          <v-list-item-content>Classmates</v-list-item-content>
        </v-list-item>   
        
        <v-list-item link :to="`/${this.$route.params.class_id}/gallery`">
          <v-list-item-icon><v-icon>mdi-account-group-outline</v-icon></v-list-item-icon>
          <v-list-item-content>Gallery</v-list-item-content>
        </v-list-item>

        <v-divider></v-divider>
        <!-- WORKSPACES -->
        <v-list-item-group>
          <v-list-item 
            v-for="(workspace, i) in workspaces" :key="workspace['.key']"
            :to="`/${$route.params.class_id}/workspace/${workspace['.key']}`"
          >
            workspace {{ i }}
            <template v-if="workspace.members">
              <v-list-item-content>
                <v-icon 
                  v-for="i in workspace.members.length" 
                  :key="i"
                  color="pink"
                >
                  person
                </v-icon>
              </v-list-item-content>
            </template>
          </v-list-item>
        </v-list-item-group>
      </v-list>
    </v-navigation-drawer>
  </v-card>
</template>

<script>
import { mapState } from 'vuex'
import db from '@/database.js'
import firebase from 'firebase/app'
import 'firebase/auth'
import NewClassPopup from '@/components/NewClassPopup.vue'
import LoginPopup from "@/components/LoginPopup.vue"
import VuetifyMenu from "@/components/VuetifyMenu.vue"

export default {
  data () {
    return {
      drawer: true,
      mini: false,
      prevClassID: '',
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