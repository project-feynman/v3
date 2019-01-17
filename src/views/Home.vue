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
            <template v-for="teacher in teachers">
              <v-layout :key="teacher.uid">
                <v-flex>
                  <v-card color="blue-grey darken-2" class="white--text">
                    <v-card-title primary-title>
                      <div>
                        <div class="headline">{{ teacher.name }}</div>
                        <!-- Below should be dynamic  -->
                        <span>{{ teacher.description }}</span>
                      </div>
                    </v-card-title>
                    <v-card-actions>
                      <v-btn flat dark @click="$router.push(teacher.uid)">Enter</v-btn>
                    </v-card-actions>
                  </v-card>
                </v-flex>
              </v-layout>
            </template>
          </div>
        </template>

        <template v-else>
          <v-layout align-center justify-center row fill-height wrap>
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
    </template>
      </transition> -->
    </div>
</template>

<script>
import { mapState } from 'vuex'
import firebase from 'firebase/app'
import 'firebase/auth'
import db from '@/database.js'
import Animation from '@/components/Animation.vue'

export default {
  components: {
    Animation
  },
  computed: {
    ...mapState(['user', 'isFetchingUser'])
  },
  methods: {
    async teacherSignIn() {
      this.$store.commit('SET_CREATING_TEACHER', true)
      const provider = new firebase.auth.GoogleAuthProvider() 
      await firebase.auth().signInWithRedirect(provider)
    },
    async studentSignIn() {
      const provider = new firebase.auth.GoogleAuthProvider()
      await firebase.auth().signInWithRedirect(provider)
      // then main.js's onAuthStateChanged listener will dispatch an action
    }
  },
  data() {
    return {
      teachers: null
    }
  },
  async created() {
    this.$binding('teachers', db.collection('users').where('isTeacher', '==', true))
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