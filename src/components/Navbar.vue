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

      <template v-if="user">
        <template v-if="isExplanationPage && this.user.displayName == 'Elton Lin'">
          <!-- DELETE -->
          <v-btn @click="$root.$emit('delete-explanation')" class="red darken-2">
            <span class="white--text">Delete</span>
          </v-btn>
          <!-- REPLAY -->
          <v-btn @click="$root.$emit('play-explanation')" class="pink">
            <span class="white--text">Replay</span>
          </v-btn>
        </template>
        <!-- Logout Button -->
        <v-btn v-else-if="$route.path == '/'" @click="signOut()">Log out</v-btn>
      </template>
      <v-progress-linear slot="extension" v-if="isLoading" :indeterminate="true" height="2" class="ma-0"></v-progress-linear>
    </v-toolbar>

    <!-- NAVIGATION DRAWER -->
    <!-- quickfix -->
    <template v-if="$route.path != '/'">
    <v-navigation-drawer v-if="user" v-model="drawerOpen" app class="white">
      <v-list>
<!-- 
        <v-subheader class="subheading black--text text-uppercase font-weight-black">
          TA
        </v-subheader>
 

        <v-list-tile>
          <v-list-tile-content>
            <span class="grey--text text--darken--3 mx-1">
              Visesh is offline
            </span>
          </v-list-tile-content>
        </v-list-tile>

        <v-divider></v-divider> -->

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
              <!-- new answer received-->
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
    </template>

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
      users: null,
      newTitle: '',
      students: null,
      tables: null,
      isStudentPage: false, 
      isExplanationPage: false,
      drawerOpen: false,
      clickedButtonStateName: null,
      loading: false,
      loading2: false,
      loading3: false,
      loading4: false,
      loadingChatLog: true, 
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
    clearQuestion() {
      this.updateTableStatus(false)
      this.$root.$emit('clear-chat')
    },
    async updateTableStatus(isAskingQuestion) {
      const tableId = this.$route.params.id
      const tableRef = db.collection('tables').doc(tableId)
      await tableRef.update({
        isAskingQuestion
      })
    },
    initClearBoardLogic() {
      this.clickedButtonStateName = 'loading2'
      this.$root.$emit('clear-whiteboard')
    },
    updateNavbarButtons() {
      const path = this.$route.path
      const pathParts = path.split('/')
      const params = this.$route.params 
      if (params.teacher_id && !this.workspaces && !this.teacherExplanations) { // TA's Office Page 
        this.$binding('workspaces', db.collection('workspaces').where('teacherUid', '==', params.teacher_id))
        this.$binding('teacherExplanations', db.collection('explanations').where('teacherUid', '==', params.teacher_id))
        setTimeout(() => this.drawerOpen = true, 0)
      }
      if (pathParts[2] == 'answer') {
        this.isExplanationPage = true 
        this.isStudentPage = false 
        this.loadingChatLog = true
        this.loadingAnimation = true 
        this.$root.$on('finish-loading-chat-log', () => this.loadingChatLog = false )
        this.$root.$on('finish-loading-animation', () => this.loadingAnimation = false) 
      } else if (pathParts[2] == 'workspace') {
        this.isExplanationPage = false 
        this.isStudentPage = true
        // quick-fix
        this.loadingChatLog = false 
        this.loadingAnimation = false 
      } else {
        this.isExplanationPage = false 
        this.isStudentPage = false
        // quick-fix 
        this.loadingChatLog = false 
        this.loadingAnimation = false 
      }
    },
    async handleSaving() {
      console.log('handleSaving called in Navbar.vue')

      const docRef = await db.collection('explanations').add({
        title: this.newTitle,
        author: 'Richard Feynman',
        teacherUid: this.$route.params.teacher_id
      })
      this.$root.$emit('save-explanation', docRef.id)
    }
  }
}
</script>
