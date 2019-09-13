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
    <v-app-bar v-if="showNavbar" app color="white" id="navbar">
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

        <v-btn 
          v-else-if="!user"  
          @click="handleSignIn()" 
          class="grey--text text--darken-2"
          flat
        >
          SIGN IN
        </v-btn>
      </template>

      <!-- <div v-if="showTabs"> -->
        <template v-slot:extension>

          <v-tabs
            v-if="showTabs"
            centered
            slider-color="yellow"
            background-color="transparent"
          >
    
            <v-tab
              v-for="i in 3"
              :key="i"
              :href="`#tab-${i}`"
            >
              Item {{ i }}
            </v-tab>
          </v-tabs>
        </template>
      <!-- </div> -->

    </v-app-bar>
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
import { truncate } from 'fs';


export default {
  components: {
    NewClassPopup,
    LoginPopup,
    VuetifyMenu
  },
  computed: {
    ...mapState(["user", "isFetchingUser"]),
    classID () {
      return this.$route.params.class_id
    },
     isGallery () {
      const path = this.$route.path
      const pathParts = path.split('/')
      return pathParts[2] == "gallery"
      // if (pathParts[2])
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
      menu: false,
      showTabs: false
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
      // everytime the user visits a different commmunity
      if (classID && classID != this.prevClassID) {
        // update sidenav content
        const classRef = db.collection('classes').doc(classID)
        this.$binding('workspaces', classRef.collection('workspaces'))
        this.$binding('explanations', db.collection("whiteboards").where("fromClass", "==", classID))
        this.prevClassID = classID 
      }
      const path = this.$route.path
      const pathParts = path.split('/')
      if (pathParts[2] == "gallery") {
        console.log("showTabs =", true)
        this.showTabs = true
      } else {
        console.log("showTAbs =", false)
        this.showTabs = false 
      }
    }
  }
};
</script>


