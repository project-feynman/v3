<template>
  <div>
    <the-app-bar></the-app-bar>

    <!-- SNACKBAR -->
    <v-snackbar v-model="snackbar">
      {{ snackbarMessage }}
      <v-btn @click="snackbar = false" color="pink" flat>
        CLOSE
      </v-btn>
    </v-snackbar>

    <v-content>

      <v-card
        class="mx-auto text-center"
        fluid
      >
        <v-card-text>
          <p class="display-2 text--primary">
            explain.mit.edu
          </p>
          <div class="headline text--primary">
            A place where people share blackboard explanations
          </div>
        </v-card-text>
        <!-- <v-card-actions>
            <v-btn
              text
              class="mx-auto"
              color="deep-purple accent-4"
              href="https://medium.com/@eltonlin1998/why-explainmit-c0cab5617d4d"
            >
              LEARN MORE
            </v-btn>
        </v-card-actions> -->
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