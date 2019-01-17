<template>
  <nav>    
    <v-toolbar app extended extension-height="2">

      <v-toolbar-side-icon v-if="user && $route.path != '/'" @click="drawerOpen = !drawerOpen"></v-toolbar-side-icon>
        <v-toolbar-title v-if="!$route.params.teacher_id" @click="$router.push('/')" class="headline text-uppercase">
          Feynman Project
        </v-toolbar-title>
        <v-toolbar-title v-else @click="$router.push('/')" class="headline text-uppercase">
          Feynman Project (6.006)
        </v-toolbar-title>
      <v-spacer></v-spacer>
      <!-- LOGOUT -->
      <v-btn v-if="user && $route.path == '/'" @click="signOut()">Log out</v-btn>
      <!-- LOADING INDICATOR -->
      <v-progress-linear slot="extension" v-if="isLoading" :indeterminate="true" height="2" class="ma-0"></v-progress-linear>
    </v-toolbar>

    <!-- NAVIGATION DRAWER -->
    <v-navigation-drawer v-if="user && $route.path != '/'" v-model="drawerOpen" app class="white">
      <v-list>
        <v-subheader class="black--text subheading text-uppercase font-weight-black">
          Workspaces
        </v-subheader>
     
        <v-list-tile v-for="workspace in workspaces" :key="workspace['.key']" router :to="`/${$route.params.teacher_id}/workspace/${workspace['.key']}`">
          <v-list-tile-content>
            <template v-if="workspace.isOffice">
              <span>{{ workspace.ownerName }}'s Office</span>
            </template>
            <template v-else>
              <!-- new question asked -->
              <v-badge v-if="workspace.isAskingQuestion && !workspace.isAnswered" color="red">
                <v-icon slot="badge" dark small>priority_high</v-icon>
                <span>{{ workspace.ownerName }}</span>
              </v-badge>
              <!-- new answer received -->
              <v-badge v-else-if="workspace.isAnswered" color="green">
                <v-icon slot="badge" dark small>priority_high</v-icon>
                <span>{{ workspace.ownerName }}</span>
              </v-badge>
              <!-- empty -->
              <span v-else>{{ workspace.ownerName }}</span>
            </template>
          </v-list-tile-content>
        </v-list-tile>

        <v-divider></v-divider>

        <v-subheader class="subheading black--text text-uppercase font-weight-black">
          Concepts
        </v-subheader>

        <v-list-tile v-for="explanation in teacherExplanations" :key="explanation.text" router :to="`/${teacherUid}/answer/${explanation['.key']}`">
          <v-list-tile-content>
            {{ explanation.title }}
          </v-list-tile-content>
        </v-list-tile>

        <v-divider></v-divider>

        <v-subheader class="subheading black--text text-uppercase font-weight-black">
          Examples
        </v-subheader>
        <v-list-tile>
          <v-list-tile-content>
            <span class="grey--text text--darken--3 mx-1">
              (There are no examples yet)
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
      const path = this.$route.path
      const pathParts = path.split('/')
      const params = this.$route.params 
      if (params.teacher_id && !this.workspaces && !this.teacherExplanations) { // TA's Office Page 
        this.$binding('workspaces', db.collection('workspaces').where('teacherUid', '==', params.teacher_id))
        this.$binding('teacherExplanations', db.collection('explanations').where('teacherUid', '==', params.teacher_id))
        console.log('this.teacherExplanations =', this.teacherExplanations)
        setTimeout(() => this.drawerOpen = true, 0)
      }
      if (pathParts[2] == 'answer') {
        this.isExplanationPage = true 
        this.loadingAnimation = true 
        this.$root.$on('finish-loading-animation', () => this.loadingAnimation = false) 
      } else if (pathParts[2] == 'workspace') {
        this.isExplanationPage = false 
        this.loadingAnimation = false 
      } else {
        this.isExplanationPage = false 
        this.loadingAnimation = false 
      }
    }
  }
}
</script>
