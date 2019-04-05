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
      <!-- EINSTEIN'S QUOTE -->
      <!-- <v-layout v-if="isFetchingUser" key="quote" align-center justify-center row fill-height wrap>
        <blockquote class="my-quote blockquote text-md white--text">"It should be possible to explain the laws of physics to a barmaid." - Albert Einstein</blockquote>
      </v-layout> -->
      <div v-if="isFetchingUser" key="quote">
      </div>

      <!-- LIST OF CLASSES -->
      <div v-if="user" key="class-list" class="responsive-grid mt-5">
        <v-layout v-for="subject in teachers" :key="subject.uid">
          <v-flex>
            <v-card flat @click="$router.push(subject.courseNumber)"
                    color="white" 
                    class="black--text bordered">
              <v-card-title primary-title>
                <div class="headline">
                  {{ subject.courseNumber }}
                </div>
              </v-card-title>
              <v-card-actions>
                <v-btn flat dark class="black--text" @click="$router.push(subject.courseNumber)">
                  ENTER
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-flex>
        </v-layout>
      </div>
      <!-- LOGIN BUTTON -->
      <div v-else>
        <div class="text-xs-center mt-3">
          <p>Here, friends and strangers alike explain concepts simply to help each other</p>
          <v-btn bottom large @click="loginPopup = !loginPopup">
            LOGIN
          </v-btn>
        </div>
        <login-popup v-model="loginPopup" 
                     @sign-up="payload => signUp(payload)"
                     @sign-in="payload => signIn(payload)">
        </login-popup>
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
  transition: opacity .25s;
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

.bordered {
  border-color: black;
}
</style>