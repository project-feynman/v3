<template>
  <nav>

    <!-- SNACKBAR -->
    <v-snackbar v-model="snackbar">
      {{ snackbarMessage }}
      <v-btn @click="snackbar = false" color="pink" flat>
        CLOSE
      </v-btn>
    </v-snackbar>

    <!-- LOGIN / SIGNUP -->
    <login-popup v-model="loginPopup" 
                  :newAccount="false"
                  @sign-in="payload => signIn(payload)"
                  @create-account="payload => createAccount(payload)"/>
    <!-- NAVBAR  -->
    <v-toolbar v-if="showNavbar" app color="white" extended extension-height="2" id="navbar">
      <img src="favicon.ico">
      <v-toolbar-title class="headline font-weight-regular ml-2">
        {{ $route.params.class_id ? $route.params.class_id : "ExplainMIT" }}
      </v-toolbar-title>

      <v-spacer></v-spacer>

      <template v-if="user && $route.path == '/'">
        <new-class-popup
          v-model="newClassPopup"
          @create-class="courseNumber => createClass(courseNumber)"
        />

        <!-- <v-btn @click="newClassPopup = true" dark color="grey">
          CREATE CLASS
        </v-btn> -->
        
          <!-- <v-btn icon>
            <v-icon color="grey darken-2">notifications</v-icon>
          </v-btn> -->

         <!-- <v-btn icon @click="newClassPopup = true">
          <v-icon color="grey darken-2">
            library_add
          </v-icon>
         </v-btn> -->

      </template>
    
      <v-btn 
        v-if="$route.params.video_id" 
        @click="replaySilentAnimation()"    
        icon
      >
        <v-icon medium>replay</v-icon>
      </v-btn>

      <v-btn 
        v-else-if="$route.params.id " 
        @click="toggleFullscreen()"
        icon
      >
        <v-icon medium>fullscreen</v-icon>
      </v-btn>

      <template v-if="!isFetchingUser">
        
        <vuetify-menu v-if="user"
                      :user="user"
                      @save="payload => updateUser(payload)"
                      @sign-out="signOut()">
          <template v-slot:default="{ on }"> 
            <v-btn 
              v-on="on"
              icon class="ml-4"
            >
              <v-icon large :color="user.color">
                account_circle
              </v-icon>
            </v-btn>
          </template>
        </vuetify-menu>
<!-- 
        <v-btn 
          v-if="user"  
          @click="signOut()" 
          icon class="ml-4"
        >
          <v-icon large color="pink">
            account_circle
          </v-icon>
        </v-btn> -->

        <v-btn 
          v-else-if="!user"  
          @click="handleSignIn()" 
          class="grey--text text--darken-2"
          flat
        >
          SIGN IN
        </v-btn>
      </template>

      <!-- LOADING INDICATOR -->
      <!-- <v-progress-linear
        v-if="isLoading"
        slot="extension"
        :indeterminate="true"
        height="2"
        class="ma-0"
      /> -->

    </v-toolbar>
    <v-navigation-drawer v-if="$route.path != '/'" v-model="drawerOpen" app stateless >
      <v-list class="pb-0">
        <!-- HOME -->
        <v-list-tile router to="/">
          <v-list-tile-action>
            <v-icon>home</v-icon>
          </v-list-tile-action>
          <v-list-tile-title>Home</v-list-tile-title>
        </v-list-tile>
        <v-divider/>

        <!-- DOODLES -->
        <v-list-tile router :to="`/${$route.params.class_id}/doodles`">
          <v-list-tile-action>
            <v-icon>video_library</v-icon>
          </v-list-tile-action>
          <v-list-tile-title>Doodles</v-list-tile-title>
        </v-list-tile>
   
      <v-divider/>

      <!-- CLASSMATES -->
      <v-list-tile router :to="`/${$route.params.class_id}/ranking`">
        <v-list-tile-action>
          <v-icon>group</v-icon>
        </v-list-tile-action>
        <v-list-tile-title>Classmates</v-list-tile-title>
      </v-list-tile>

      <v-divider/>

      </v-list>

      <v-list three-line subheader>

        <!-- WORKSPACES -->
        <v-list-group prepend-icon="phone_in_talk" value="true">
          <v-list-tile slot="activator">
          <!-- <v-list-tile> -->
            <v-list-tile-title>Workspaces ({{ workspaces.length }})</v-list-tile-title>
          </v-list-tile>

          <v-list-tile
            v-for="(workspace, idx) in workspaces"
            :key="workspace['.key']"
            router
            :to="`/${$route.params.class_id}/workspace/${workspace['.key']}`"
          >
            <v-list-tile-content>
            <!-- TITLE -->
            <template v-if="workspace.members">
              <v-list-tile-title>
                Workspace {{ idx }}
              </v-list-tile-title>
              <!-- <v-icon 
                v-for="idx in workspace.members.length" 
                :key="idx"
                color="pink"
              >
                person
              </v-icon> -->
            </template>
            <div v-else class="text-xs-center">Workspace {{ idx }}</div>
              <!-- SUBTITLE  -->
              <v-list-tile-sub-title>
                <template v-if="workspace.members">
                  <v-icon v-for="member in workspace.members" :key="member.email" 
                          :color="member.color" class="ml-3">
                    person
                  </v-icon>
                  <!-- <div v-for="member in workspace.members" :key="member.email" class="ml-3">
                    {{ member.email }}
                  </div> -->
                </template>
              </v-list-tile-sub-title>

            </v-list-tile-content>
          </v-list-tile>
          
        </v-list-group>

        <!-- <v-list-group prepend-icon="file_copy" value="true">
          <v-list-tile slot="activator">
            <v-list-tile-title>Explanations</v-list-tile-title>
          </v-list-tile>
          <v-list-tile
            v-for="explanation in explanations"
            :key="explanation['.key']"
            router
            :to="`/${classID}/${explanation['.key']}`"
          >
            <v-list-tile-title>{{ explanation.title }}</v-list-tile-title>
          </v-list-tile>
        </v-list-group> -->
      </v-list>
    </v-navigation-drawer>
  </nav>
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
  components: {
    NewClassPopup,
    LoginPopup,
    VuetifyMenu
  },
  computed: {
    ...mapState(['user', "isFetchingUser"]),
    classID () {
      return this.$route.params.class_id
    },
    // isLoading () {
    //   return this.loadingAnimation
    // }
  },
  data () {
    return {
      loginPopup: false,
      newClassPopup: false,
      showNavbar: true,
      prevClassID: '',
      workspaces: [],
      explanations: [],
      isExplanationPage: false,
      drawerOpen: false,
      clickedButtonStateName: null,
      loadingAnimation: true,
      snackbar: false,
      snackbarMessage: '',
      menu: false
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
      this.$root.$on('delete-whiteboard-strokes-success', () => (this[buttonState] = false))
      this.clickedButtonStateName = null
    },
    user () {
      if (!this.user) {
        this.$router.push(`${this.$route.params.class_id}/ranking`)
      }
    }
  },
  methods: {
    async updateUser({ name, useDarkMode, color }) {
      const ref = db.collection("users").doc(this.user.uid)
      await ref.update({
        name,
        useDarkMode
      })
    },
    signIn({ email, password }) {
      firebase.auth().signInWithEmailAndPassword(email, password)
        .then(user => {
          this.$store.dispatch('handleUserLogic', user)
          this.snackbarMessage = `Welcome to ExplainMIT!`
          this.snackbar = true 
          this.loginPopup = false 
        })
      .catch(error => {
          this.snackbarMessage = error.message
          this.snackbar = true 
        })
    },
    createAccount({ email, password }) {
      firebase.auth().createUserWithEmailAndPassword(email, password)
        .then(user => {
          this.snackbarMessage = `Welcome to ExplainMIT!`
          this.snackbar = true 
          this.loginPopup = false
        })
        .catch(error => {
          this.snackbarMessage = error.message
          this.snackbar = true 
        })
    },
    handleSignIn () {
      this.loginPopup = true
    },
    replaySilentAnimation () {
      this.$root.$emit('replay-silent-animation')
    },
    toggleFullscreen () {
      this.$root.$emit('open-whiteboard')
    },
    createClass (courseNumber) {
      const ref = db.collection('classes').doc(courseNumber)
      ref.set({ courseNumber })
    },
    signOut () {
      firebase.auth().signOut()
    },
    loginWithGoogle () {
      var provider = new firebase.auth.GoogleAuthProvider()
      firebase.auth().signInWithPopup(provider)
    },
    updateNavComponents () {
      const classID = this.$route.params.class_id
      // sidenav content should not reload everytime the user navigates between the workspaces, but should update
      // everytime the user visits a different TA page
      if (classID && classID != this.prevClassID) {
        // update sidenav content
        const classRef = db.collection('classes').doc(classID)
        this.$binding('workspaces', classRef.collection('workspaces'))
        // this.$binding('explanations', classRef.collection('videos'))
        this.$binding('explanations', db.collection("whiteboards").where("fromClass", "==", classID))
        this.prevClassID = classID
        setTimeout(() => (this.drawerOpen = true), 0) // quick-fix for whiteboard touch detection offset bug
      }

      // CODE BELOW IS FOR DISPLAYING LOADING STATUS WHEN FETCHING WHITEBOARDS
      
      // const path = this.$route.path
      // const pathParts = path.split('/')


      // if (pathParts[2] == "answer") {
      //   this.loadingAnimation = true;
      //   this.$root.$on(
      //     "finish-loading-animation",
      //     () => (this.loadingAnimation = false)
      //   );
      // } else if (pathParts[2] == "workspace") {
      //   this.loadingAnimation = false;
      // } else {
      //   this.loadingAnimation = false;
      // }
    }
  }
};
</script>


