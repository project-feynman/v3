<template>
  <div style="height: 90%;">
    <v-snackbar v-model="snackbar">
      {{ snackbarMessage }}
      <v-btn @click="snackbar = false" 
             color="pink" flat>
        CLOSE
      </v-btn>
    </v-snackbar>

    <transition name="fade" mode="out-in" 
                @after-leave="transitionFinished = true">
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