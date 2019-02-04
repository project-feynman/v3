<template>
  <nav>  
    <!-- NAVBAR  --> 
    <v-toolbar app v-if="showNavbar" extended extension-height="2" id="navbar">

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

      <!-- NAVBAR -->
      <v-dialog v-model="dialog" max-width="290">
        <v-btn slot="activator"
              color="blue-grey"
              class="white--text"
              @click="showNumber = true">
          Report Error
        </v-btn>

        <v-card>
          <v-card-title class="headline">
            eltonlin@mit.edu
          </v-card-title>

          <v-card-text>
            For very professional help :].
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <slot name="button">

            </slot>
            <v-btn color="green darken-1" flat @click="dialog = false">OK</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-btn v-if="user && $route.path == '/'" 
             @click="signOut()">
        LOG OUT
      </v-btn>

      <!-- loading indicator -->
      <v-progress-linear v-if="isLoading" 
                         slot="extension" 
                         :indeterminate="true" 
                         height="2" 
                         class="ma-0"/>
    </v-toolbar>

    <v-navigation-drawer
      app
      stateless
      v-if="user && $route.path != '/'"
      v-model="drawerOpen"
    >
    <v-list>
      <v-list-tile router to="/">
        <v-list-tile-action>
          <v-icon>home</v-icon>
        </v-list-tile-action>
        <v-list-tile-title>Home</v-list-tile-title>
      </v-list-tile>


      


      <v-list-group
        prepend-icon="account_circle"
        value="true"
      >
        <v-list-tile slot="activator">
          <v-list-tile-title>Workspaces</v-list-tile-title>
        </v-list-tile>
        
        <!-- FIRST SUBLIST -->
        <!-- <v-list-group
          sub-group
          no-action
        >
          <v-list-tile slot="activator">
            <v-list-tile-title>Students</v-list-tile-title>
          </v-list-tile>

          <v-list-tile
            v-for="workspace in studentWorkspaces"
            :key="workspace['.key']"
            router :to="`/${$route.params.teacher_id}/workspace/${workspace['.key']}`"
          >
            <v-badge v-if="workspace.isAskingQuestion" color="red">
              <v-list-tile-title>{{ workspace.ownerName }}</v-list-tile-title>
              <v-icon slot="badge" dark small>priority_high</v-icon>
            </v-badge>
            <v-list-tile-title v-else>{{ workspace.ownerName }}</v-list-tile-title>
          </v-list-tile>

        </v-list-group> -->

        <!-- TEACHER LIST -->
        <v-list-group
          no-action
          sub-group
          value="true"
        >

         <v-list-tile slot="activator">
            <v-list-tile-title>Teachers</v-list-tile-title>
          </v-list-tile>

          <v-list-tile
            v-for="workspace in teacherWorkspaces"
            :key="workspace['.key']"
            router :to="`/${$route.params.teacher_id}/workspace/${workspace['.key']}`"
          >
            <v-badge v-if="workspace.isAskingQuestion" color="red">
              <v-list-tile-title>{{ workspace.ownerName }}</v-list-tile-title>
              <v-icon slot="badge" dark small>priority_high</v-icon>
            </v-badge>
            <v-list-tile-title v-else>{{ workspace.ownerName }}</v-list-tile-title>
          </v-list-tile>

        </v-list-group>

  

      </v-list-group>



      <v-list-group
        prepend-icon="library_books"
        value="true"
      >
        <v-list-tile slot="activator">
          <v-list-tile-title>Shared Content</v-list-tile-title>
        </v-list-tile>

        <v-list-group
          no-action
          sub-group
          value="true"
        >
          <v-list-tile slot="activator">
            <v-list-tile-title>Concepts</v-list-tile-title>
          </v-list-tile>

          <v-list-tile
            v-for="explanation in teacherExplanations"
            :key="explanation['.key']"
            router :to="`/${teacherUid}/answer/${explanation['.key']}`">
            <v-list-tile-title>{{ explanation.title }}</v-list-tile-title>
          </v-list-tile>
        </v-list-group>

        <!-- <v-list-group
          sub-group
          no-action
        >
          <v-list-tile slot="activator">
            <v-list-tile-title>Solutions</v-list-tile-title>
          </v-list-tile>

          <v-list-tile
            v-for="(crud, i) in cruds"
            :key="i"
            @click=""
          >
            <v-list-tile-title v-text="crud[0]"></v-list-tile-title>
            <v-list-tile-action>
              <v-icon v-text="crud[1]"></v-icon>
            </v-list-tile-action>
          </v-list-tile>
        </v-list-group> -->

      </v-list-group>


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
  data () {
    return {
      showNavbar: true,
      prev_teacherUid: null,
      teacherWorkspaces: null,
      studentWorkspaces: null,
      workspaces: null,
      teacherExplanations: null,
      newTitle: '',
      isExplanationPage: false,
      drawerOpen: false,
      clickedButtonStateName: null,
      loading: false,
      loading2: false,
      loading3: false,
      loadingAnimation: true,
      dialog: false,
       admins: [
        ['Management', 'people_outline'],
        ['Settings', 'settings']
      ],
      cruds: [
        ['Create', 'add'],
        ['Read', 'insert_drive_file'],
        ['Update', 'update'],
        ['Delete', 'delete']
      ]
    }
  },
  watch: {
    $route: {
      handler: 'updateNavComponents',
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
    updateNavComponents() {
      const path = this.$route.path
      const pathParts = path.split('/')
      const teacher_id = this.$route.params.teacher_id
      // sidenav content should not reload everytime the user navigates between the workspaces, but should update
      // everytime the user visits a different TA page
      if (teacher_id) { // TA's office page 
        if (teacher_id != this.prev_teacherUid) {
          // update workspaces and teacher explanations
          this.$binding('teacherWorkspaces', db.collection('workspaces').where('teacherUid', '==', teacher_id).where('isOffice', '==', true))
          this.$binding('studentWorkspaces', db.collection('workspaces').where('teacherUid', '==', teacher_id).where('isOffice', '==', false).orderBy('isAskingQuestion', 'desc'))
          this.$binding('teacherExplanations', db.collection('explanations').where('teacherUid', '==', teacher_id))
          this.prev_teacherUid = teacher_id 
          setTimeout(() => this.drawerOpen = true, 0) // quick-fix for whiteboard touch detection offset bug 
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


