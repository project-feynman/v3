<template>
  <div style="height: 90%;">
    <v-snackbar v-model="snackbar">
      {{ snackbarMessage }}
      <v-btn color="pink"
             flat
             @click="snackbar = false">
        CLOSE
      </v-btn>
    </v-snackbar>
    <transition name="fade" mode="out-in" @after-leave="transitionFinished = true">

      <!-- RICHARD FEYNMAN'S QUOTE -->
      <v-layout v-if="isFetchingUser" key="quote" align-center justify-center row fill-height wrap>
        <blockquote class="my-quote blockquote text-md-center">"If you can't explain it simply, you don't understand it." - Richard Feynman</blockquote>
      </v-layout>

      <!-- LIST OF CLASSES -->
      <div v-else-if="user" key="class-list" class="responsive-grid mt-5">
        <v-layout v-for="teacher in teachers" :key="teacher.uid">
          <v-flex>
            <v-card color="blue-grey darken-2" class="white--text">
              <v-card-title primary-title>
                <div class="headline">{{ teacher.courseNumber }}</div>
              </v-card-title>
              <v-card-actions>
                <v-btn flat dark @click="$router.push(teacher.courseNumber)">Enter</v-btn>
              </v-card-actions>
            </v-card>
          </v-flex>
        </v-layout>
      </div>

      <div v-else>
        <v-layout align-center justify-center row fill-height wrap>
          <p>
            Existing solutions are hard to understand because:
          </p> 
          <ul>
            <li>Text-based: even though a diagram is desperately needed</li>
            <li>Brief: omits crucial steps in the thought process, because the staff assumes the students know as much as they do</li> 
            <li>Formal: rigorous, but complicated and unintuitive</li> 
          </ul>
          <ul>
            <li>Visual: a picture is worth a thousand words</li>
            <li>Process-oriented: it's about learning how to derive that x = 2, and not simply copying that x = 2</li> 
            <li>Informal: with a focus on the intuition and the Why of a question</li> 
          </ul>
          <v-btn @click="loginPopup = !loginPopup">LOGIN</v-btn>
          <login-popup v-model="loginPopup" 
                       @sign-up="payload => signUp(payload)"
                       @sign-in="payload => signIn(payload)">
          </login-popup>
        </v-layout>
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

export default {
  components: {
    Animation,
    LoginPopup
  },
  computed: {
    ...mapState(['user', 'isFetchingUser'])
  },
  methods: {
    signIn({ email, password }) {
      firebase.auth().signInWithEmailAndPassword(email, password)
        .then(user => {
          this.snackbarMessage = `Welcome to Feynman!`
          this.snackbar = true 
          this.loginPopup = false 
        })
      .catch(error => {
          this.snackbarMessage = error.message
          this.snackbar = true 
        })
    },
    signUp({ email, password }) {
      firebase.auth().createUserWithEmailAndPassword(email, password)
        .then(user => {
          this.snackbarMessage = `Welcome to Feynman!`
          this.snackbar = true 
          this.loginPopup = false
        })
        .catch(error => {
          this.snackbarMessage = error.message
          this.snackbar = true 
        })
    }
  },
  data() {
    return {
      teachers: null,
      transitionFinished: false,
      loginPopup: false,
      snackbar: false,
      snackbarMessage: ''
    }
  },
  async created() {
    this.$binding('teachers', db.collection('classes'))
  }
}
</script>

<style>
.my-quote {
  font-size: 2em
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s;
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
</style>