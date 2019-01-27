<template>
  <nav>  
    <!-- NAVBAR  --> 
    <v-toolbar app extended extension-height="2">

      <!-- open navbar button -->
      <v-toolbar-side-icon v-if="user && $route.path != '/'" @click="drawerOpen = !drawerOpen"/>

      <!-- fix this section -->
      <v-toolbar-title v-if="!$route.params.teacher_id" @click="$router.push('/')" class="headline text-uppercase">
        Feynman
      </v-toolbar-title>
      <v-toolbar-title v-else @click="$router.push('/')" class="headline text-uppercase">
        Feynman
      </v-toolbar-title>
      <v-spacer></v-spacer>

      <v-btn v-if="user && $route.path == '/'" @click="signOut()">
        LOG OUT
      </v-btn>

      <!-- loading indicator -->
      <v-progress-linear v-if="isLoading" 
                         slot="extension" 
                         :indeterminate="true" 
                         height="2" 
                         class="ma-0"/>

    </v-toolbar>

    <!-- NAVIGATION DRAWER -->
    <v-navigation-drawer v-if="user && $route.path != '/'" 
                         v-model="drawerOpen" 
                         width="200"
                         app 
                         class="white">
      <v-list>
        <v-subheader class="black--text subheading text-uppercase font-weight-black">
          Workspaces
        </v-subheader>
     
        <!-- workspaces -->
        <v-list-tile v-for="workspace in workspaces" :key="workspace['.key']" router :to="`/${$route.params.teacher_id}/workspace/${workspace['.key']}`">
          <v-list-tile-content>
            <span v-if="workspace.isOffice">{{ workspace.ownerName }}'s Office</span>
            <template v-else>
              <v-badge v-if="workspace.question && !workspace.isAnswered" color="red">
                <v-icon slot="badge" dark small>priority_high</v-icon>
                <span>{{ workspace.ownerName }}</span>
              </v-badge>
              <v-badge v-else-if="workspace.isAnswered" color="green">
                <v-icon slot="badge" dark small>priority_high</v-icon>
                <span>{{ workspace.ownerName }}</span>
              </v-badge>
              <span v-else>{{ workspace.ownerName }}</span>
            </template>
          </v-list-tile-content>
        </v-list-tile>

        <v-divider></v-divider>

        <!-- saved content -->
        <v-subheader class="subheading black--text text-uppercase font-weight-black">
          Concepts
        </v-subheader>
        <v-list-tile v-for="explanation in teacherExplanations" 
                     :key="explanation.text" 
                     router :to="`/${teacherUid}/answer/${explanation['.key']}`">
          <v-list-tile-content>
            {{ explanation.title }}
          </v-list-tile-content>
        </v-list-tile>
        <v-divider/>
        <v-subheader class="subheading black--text text-uppercase font-weight-black">
          Examples
        </v-subheader>
        <v-list-tile>
          <v-list-tile-content>
            <span class="grey--text text--darken--3 mx-1">
              (There are no examples)
            </span>
          </v-list-tile-content>
        </v-list-tile>
      </v-list>
    </v-navigation-drawer>
  </nav>
</template>

<script>
import { mapState } from 'vuex'
import db from '@/database.js'
import PopupButton from '@/components/PopupButton.vue'
import firebase from 'firebase/app'

export default {
  components: {
    PopupButton
  },
  computed: {
    ...mapState(['user']),
    isLoading() {
      return this.loadingAnimation
    },
    teacherUid() {
      return this.$route.params.teacher_id
    }
  },
  data() {
    return {
      prev_teacherUid: null,
      workspaces: null,
      teacherExplanations: null,
      newTitle: '',
      isExplanationPage: false,
      drawerOpen: false,
      clickedButtonStateName: null,
      loading: false,
      loading2: false,
      loading3: false,
      loadingAnimation: true
    }
  },
  watch: {
    $route: {
      handler: 'updateNavbarButtons',
      immediate: true 
    },
    clickedButtonStateName () {
      const buttonState = this.clickedButtonStateName 
      this[buttonState] = !this[buttonState]
      this.$root.$on('delete-whiteboard-strokes-success', () => this[buttonState] = false)
      this.clickedButtonStateName = null
    }
  },
  methods: {
    async signOut() {
      await firebase.auth().signOut()
    },
    updateNavbarButtons() {
      // update workspaces and teacher explanations
      const path = this.$route.path
      const pathParts = path.split('/')
      const teacher_id = this.$route.params.teacher_id
      // the navbar content should not reload everytime the user navigates between the workspaces, but should update
      // everytime the user visits a different TA page
      if (teacher_id) { // TA's office page 
        if (teacher_id != this.prev_teacherUid) {
          this.$binding('workspaces', db.collection('workspaces').where('teacherUid', '==', teacher_id))
          this.$binding('teacherExplanations', db.collection('explanations').where('teacherUid', '==', teacher_id))
          this.prev_teacherUid = teacher_id 
          setTimeout(() => this.drawerOpen = true, 0)
        }
      }
      if (pathParts[2] == 'answer') {
        this.loadingAnimation = true 
        this.$root.$on('finish-loading-animation', () => this.loadingAnimation = false) 
      } else if (pathParts[2] == 'workspace') {
        this.loadingAnimation = false 
      } else {
        this.loadingAnimation = false 
      }
    }
  }
}
</script>
