<template>
  <div style="height: 90%;">
    <!-- SNACKBAR -->
    <v-snackbar v-model="snackbar">
      {{ snackbarMessage }}
      <v-btn 
        color="pink"
        flat
        @click="snackbar = false"
      >
        CLOSE
      </v-btn>
    </v-snackbar>

    <transition name="fade" mode="out-in" @after-leave="transitionFinished = true">
      <div v-if="isFetchingUser" key="quote">
      </div>

      <!-- LIST OF CLASSES -->
      <div v-if="user" key="class-list" class="responsive-grid mt-5">
        <v-layout v-for="subject in teachers" :key="subject.uid">
          <v-flex>
            <v-card flat @click="$router.push(subject.courseNumber)"
                    color="white" 
                    class="black--text cursor-pointer">
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
        <p class="text-xs-center mt-4 headline font-weight-light">
          Here, friends and strangers alike explain concepts to help each other.
        </p>
        <v-layout row justify-center class="mb-4">
          <v-btn @click="createAccountPopup = true" dark color="grey" :depressed="true">
            CREATE ACCOUNT
          </v-btn>
          <v-btn @click="loginPopup = true" dark color="grey" :depressed="true">
            LOG IN
          </v-btn>
        </v-layout>
        
        <animation 
          v-if="strokes"
          :strokes="strokes"
          :autoplay="true">
        </animation>

        <login-popup 
          v-model="loginPopup" 
          :newAccount="false"
          @sign-in="payload => signIn(payload)"
        />
        <!-- CREATE ACCOUNT -->
        <login-popup 
          v-model="createAccountPopup" 
          :newAccount="true"
          @create-account="payload => createAccount(payload)"
        />

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
import DoodleAnimation from '@/components/DoodleAnimation.vue'

export default {
  components: {
    Animation,
    LoginPopup,
    DoodleAnimation
  },
  computed: {
    ...mapState(['user', 'isFetchingUser'])
  },
  data() {
    return {
      newAccount: false,
      teachers: null,
      transitionFinished: false,
      loginPopup: false,
      createAccountPopup: false,
      snackbar: false,
      snackbarMessage: '',
      demoDoodle: null,
      strokes: null
    }
  },
  methods: {
    createNewAccount() {
      this.newAccount = true 
      this.loginPopup = true
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
    }
  },
  async created () {
    this.$binding('teachers', db.collection('classes'))
    const demoRef = db.collection('whiteboards').where('isSaved', '==', true)
    await this.$binding('demoDoodle', demoRef)
    const randomNumber = Math.floor(Math.random() * this.demoDoodle.length);
    const strokesRef = db.collection('whiteboards').doc(this.demoDoodle[randomNumber]['.key']).collection('strokes').orderBy('strokeNumber', 'asc')
    this.$binding('strokes', strokesRef) 
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