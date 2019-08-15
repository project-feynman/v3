<template>
  <div style="height: 90%;">
    <!-- SNACKBAR -->
    <v-snackbar v-model="snackbar">
      {{ snackbarMessage }}
      <v-btn @click="snackbar = false" color="pink" flat>
        CLOSE
      </v-btn>
    </v-snackbar>

    <transition name="fade" 
                mode="out-in" 
                @after-leave="transitionFinished = true">

      <div v-if="isFetchingUser" key="loading..."></div>

      <!-- LIST OF CLASSES -->
      <!-- <div v-else-if="!isFetchingUser && user" key="class-list"> -->
      <div v-else key="class-list">
        <!-- <p class="display-1 text-xs-center mt-5 font-weight-thin">
          A place where students help each other and share their favorite explanations
        </p> -->
        <playground/>
      </div>

      <!-- LOGIN BUTTON -->
      <!-- <div v-else key="landing"> -->
        <!-- <p class="text-xs-center mt-4 headline font-weight-light">
          A place where students help each other and share their favorite explanations
        </p> -->
        <!-- <v-layout row justify-center class="mb-4">
          <v-btn @click="createAccountPopup = true" dark color="grey" :depressed="true">
            CREATE ACCOUNT
          </v-btn>
          <v-btn @click="loginPopup = true" dark color="grey" :depressed="true">
            LOG IN
          </v-btn>
        </v-layout>
         -->
         
        <!-- ANIMATED TUTORIAL -->
        <!-- <animation v-if="strokes"
                   :strokes="strokes"
                   :autoplay="true"/> -->

      <!-- </div> -->
    </transition>

  </div>
</template>

<script>
import { mapState } from 'vuex'
import firebase from 'firebase/app'
import 'firebase/auth'
import db from '@/database.js'
import Animation from '@/components/Animation.vue'
import LoginPopup from '@/components/LoginPopup.vue'
import Playground from '@/components/Playground.vue'

export default {
  components: {
    Animation,
    LoginPopup,
    Playground
  },
  computed: {
    ...mapState(['user', 'isFetchingUser'])
  },
  data () {
    return {
      transitionFinished: false,
      snackbar: false,
      snackbarMessage: ''
    }
  }
}
</script>

<style>
.fade-enter-active, .fade-leave-active {
  transition: opacity .7s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}

.responsive-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(250px, 0.97fr));
	grid-gap: 30px;
	max-width: 90%;
	margin: 0 auto 30px;
}

.cursor-pointer {
  cursor: pointer;
}
</style>