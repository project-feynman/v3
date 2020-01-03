<template>
  <div>
    <!-- SNACKBAR -->
    <v-snackbar v-model="snackbar">
      {{ snackbarMessage }}
      <v-btn @click="snackbar = false" color="pink" text>
        CLOSE
      </v-btn>
    </v-snackbar>

    <!-- LOGIN / SIGNUP -->
    <PopupLogin 
      v-model="loginPopup" 
      :newAccount="false"
      @sign-in="payload => signIn(payload)"
      @create-account="payload => createAccount(payload)"
    />
           
    <!-- NAVBAR  -->
    <v-app-bar app color="white">
      <img class="home-logo" src="/favicon.ico">
      <v-toolbar-title class="home-logo headline font-weight-regular ml-2">
        ExplainMIT
      </v-toolbar-title>

      <v-spacer></v-spacer>

      <template v-if="user && $route.path == '/'">
        <PopupNewClass
          v-model="newClassPopup"
          @create-class="courseNumber => $emit('create-class', courseNumber)"
        />

        <v-btn @click="newClassPopup = true" dark color="grey">
          CREATE CLASS
        </v-btn>
          <!-- <v-btn icon>
            <v-icon color="grey darken-2">notifications</v-icon>
          </v-btn> -->
      </template>

      <template v-if="!isFetchingUser">
        
        <BaseMenu 
          v-if="user"
          :user="user"
          @save="payload => updateUser(payload)"
          @sign-out="signOut()"
        >
          <template v-slot:default="{ on }"> 
            <v-btn v-on="on" icon class="ml-4">
              <v-icon large :color="user.color">
                account_circle
              </v-icon>
            </v-btn>
          </template>
        </BaseMenu>

        <v-btn 
          v-else-if="!user"  
          @click="loginPopup = true" 
          class="grey--text text--darken-2"
          text
        >
          SIGN IN
        </v-btn>
      </template>

    </v-app-bar>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import db from '@/database.js'
import firebase from 'firebase/app'
import 'firebase/auth'
import PopupNewClass from '@/components/PopupNewClass.vue'
import PopupLogin from "@/components/PopupLogin.vue"
import BaseMenu from "@/components/BaseMenu.vue"

export default {
  components: {
    PopupNewClass,
    PopupLogin,
    BaseMenu
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
      loadingAnimation: true,
      snackbar: false,
      snackbarMessage: '',
      menu: false,
      showTabs: false
    }
  },
  methods: {
    async updateUser({ name, color }) {
      const ref = db.collection("users").doc(this.user.uid)
      ref.update({
        name
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
    signOut () {
      firebase.auth().signOut()
    }
  }
};
</script>

<style>
.home-logo:hover {
  cursor: pointer;
}
</style>

