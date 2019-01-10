<template>
    <div style="height: 100%;">

        <transition name="fade">
          <template v-if="isFetchingUser">
            <v-layout align-center justify-center row fill-height wrap>
              <blockquote class="my-quote blockquote text-md-center">"If you can't explain it simply, you don't understand it." - Richard Feynman</blockquote>
            </v-layout>
          </template>
        </transition>

        <template v-if="user">
          <div class="responsive-grid mt-5">
            <template v-for="TA in teachers">
              <v-layout :key="TA.uid">
                
                <v-flex>
                   <v-card color="blue-grey darken-2" class="white--text">
              <v-card-title primary-title>
                <div>
                  <div class="headline">{{ TA.name }}</div>
                  <span>Enlist in the 6.006 Adventure, where you learn all about the best algorithms on the planet.</span>
                </div>
              </v-card-title>
              <v-card-actions>
                <v-btn flat dark @click="$router.push(TA.uid)">Enter</v-btn>
              </v-card-actions>
            </v-card>
<!--             
                  <v-card>
                    <v-card-title primary-title>
                      <div>
                        <h3 class="headline mb-0">{{ TA.name }}, 6.006</h3>
           
                      </div>
                    </v-card-title>
                    <v-card-actions>
                      <v-btn flat color="orange" @click="$router.push(TA.uid)">Enter</v-btn>
                    </v-card-actions>
                  </v-card> -->
                </v-flex>
              </v-layout>
            </template>
          </div>
          <!-- LOGOUT -->
          <!-- <v-btn @click="signOut()">Log out</v-btn> -->
        </template>
        <template v-else>
          <v-layout align-center justify-center row fill-height wrap>
            <!-- <v-btn @click="teacherSignIn()" color="pink darken--1 white--text">TA Sign-In</v-btn>
            <v-btn @click="studentSignIn()" color="pink darken--1 white--text">Student Sign-In</v-btn> -->
             <v-btn @click="teacherSignIn()" color="error" dark large>SIGN UP AS A TEACHER</v-btn>
             <v-btn @click="studentSignIn()" color="error" dark large>SIGN UP AS A STUDENT</v-btn>
          </v-layout>
        </template>
        <!-- <transition name="fade">
          <template v-if="!isFetchingUser">
                <p>
          The most elegant explanations are often made by TAs while they are helping their students. However, year after year, these explanations are lost<br>
          meaning other students don't benefit, and other TAs have to re-invent the wheel to explain recurring concepts.<br>

          Feynman is a place where elegant explanations from TAs can be harnessed to evolve the world's academic content. 
        </p>
        <h3>How it works</h3>
        <p>
          Sal Khan wanted to help his nephew study, despite that she was in a different country. The videos he made formed the basis of KhanAcademy<br>
          Here, each TA is a "Sal Khan", and each recitation student is a "nephew". The explanations TAs make will form the basis of Feynman.
        </p>
          </template>
        </transition> -->
        <!-- <transition name="fade">
          <template v-if="!isFetchingUser">
       <template v-if="user">
        <h3>Introduction</h3>
        <p>
          The most elegant explanations are often made by TAs while they are helping their students. However, year after year, these explanations are lost<br>
          meaning other students don't benefit, and other TAs have to re-invent the wheel to explain recurring concepts.<br>

          Feynman is a place where elegant explanations from TAs can be harnessed to evolve the world's academic content. 
        </p>
        <h3>How it works</h3>
        <p>
          Sal Khan wanted to help his nephew study, despite that she was in a different country. The videos he made formed the basis of KhanAcademy<br>
          Here, each TA is a "Sal Khan", and each recitation student is a "nephew". The explanations TAs make will form the basis of Feynman.
        </p>
        <h3>Teachers</h3>
        <div class="responsive-grid">
          <template v-for="TA in teachers">
            <v-layout :key="TA.uid">
              <v-flex>
                <v-card>
                  <v-card-title primary-title>
                    <div>
                      <h3 class="headline mb-0">{{ TA.name }}</h3>
                      <div>You can write a sentence here</div>
                    </div>
                  </v-card-title>
                  <v-card-actions>
                    <v-btn flat color="orange" @click="$router.push(TA.uid)">Enter</v-btn>
                  </v-card-actions>
                </v-card>
              </v-flex>
            </v-layout>
          </template>
        </div>
        <v-btn @click="signOut()">Log out</v-btn>
      </template>


      <template v-else>
        <v-layout align-center justify-center row fill-height wrap>
          <v-flex>
            <template v-if="showcases">
              <animation :explanationId="showcases[0]['.key']"/>
            </template>
          </v-flex>
          <v-btn @click="teacherSignIn()" color="pink darken--1 white--text">TA Sign-In</v-btn>
          <v-btn @click="studentSignIn()" color="pink darken--1 white--text">Student Sign-In</v-btn>
        </v-layout>
      </template>
    </template>

        </transition> -->


    </div>
</template>

<script>
import { mapState } from 'vuex'
import firebase from 'firebase/app'
import 'firebase/auth'
import Showcase from '@/components/Showcase.vue'
import db from '@/database.js'
import Animation from '@/components/Animation.vue'

export default {
  components: {
    Showcase,
    Animation
  },
  computed: {
    ...mapState(['user', 'isFetchingUser'])
  },
  methods: {
    async teacherSignIn() {
      this.$store.commit('SET_CREATING_TEACHER', true)
      const provider = new firebase.auth.GoogleAuthProvider() 
      const result = await firebase.auth().signInWithPopup(provider) 
    },
    async studentSignIn() {
      const provider = new firebase.auth.GoogleAuthProvider()
      const result = await firebase.auth().signInWithPopup(provider)
      // then main.js's onAuthStateChanged listener will dispatch an action
    },
    // async signOut() {
    //   await firebase.auth().signOut()
    // }
  },
  data() {
    return {
      teachers: null,
      showcases: null
    }
  },
  async created() {
    // this is indeed very costly, so route level code-splitting does matter
    this.$binding('teachers', db.collection('users').where('isTeacher', '==', true))
    console.log('teachers =', this.teachers)
    // a binding is not necessary - why not just do ref.once? 
    await this.$binding('showcases', db.collection('explanations').limit(3)) // using a carousel 
  }
}
</script>

<style>
.my-quote {
  font-size: 2.4em
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 1.0s;
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