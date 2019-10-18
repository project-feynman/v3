<template>
  <div style="height: 90%;">
    <v-snackbar v-model="snackbar">
      {{ snackbarMessage }}
      <v-btn @click="snackbar = false" 
             color="pink" flat>
        CLOSE
      </v-btn>
    </v-snackbar>
  <v-card
    class="mx-auto text-center"
    fluid
  >
    <v-card-text>
      <!-- <div text-center>Word of the Day</div> -->
      <p class="display-2 text--primary">
        explain.mit.edu
      </p>
      <!-- <p>adjective</p> -->
      <div class="headline text--primary">
        A place where people share blackboard explanations for<br>
        fundamental concepts and difficult problems<br>
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
        <communities/>
      </div>
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
import Communities from '@/components/Communities.vue'
export default {
  components: {
    Animation,
    LoginPopup,
    Communities
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