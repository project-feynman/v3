<template>
  <div>
    <the-app-bar/>

    <!-- SNACKBAR -->
    <v-snackbar v-model="snackbar">
      {{ snackbarMessage }}
      <v-btn @click="snackbar = false" color="pink" flat>
        CLOSE
      </v-btn>
    </v-snackbar>

    <v-content>

      <v-card class="mx-auto text-center" fluid>
        <v-card-text>
          <p class="display-2 text--primary">
            explain.mit.edu
          </p>
          <div class="headline text--primary">
            A place where everyone helps each other by sharing simple explanations
          </div>
        </v-card-text>
        <v-card-actions>
            <div style="margin: auto">
              <v-btn href="https://medium.com/@eltonlin1998/the-goal-of-explainmit-afd9df574c60" text class="mx-auto" color="deep-purple accent-4">
                Learn more 
              </v-btn>
              <v-btn href="https://github.com/eltonlin1998/ExplainMIT" text class="mx-auto" color="deep-purple accent-4">
                Github repo
              </v-btn>
            </div>
        </v-card-actions>
      </v-card>

      <transition 
        name="fade" 
        mode="out-in" 
        @after-leave="transitionFinished = true"
      >
        <div v-if="isFetchingUser" key="loading..."></div>
        <div v-else key="class-list">
          <CollegeClasses/>
        </div>
      </transition>

    </v-content>

  </div>
</template>

<script>
import { mapState } from 'vuex'
import firebase from 'firebase/app'
import 'firebase/auth'
import db from '@/database.js'
import Animation from '@/components/Animation.vue'
import LoginPopup from '@/components/LoginPopup.vue'
import CollegeClasses from '@/components/CollegeClasses.vue'
import TheAppBar from "@/components/TheAppBar.vue"


export default {
  components: {
    Animation,
    LoginPopup,
    CollegeClasses,
    TheAppBar
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
.cursor-pointer {
  cursor: pointer;
}
</style>