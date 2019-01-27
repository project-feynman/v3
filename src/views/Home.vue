<template>
    <div style="height: 80%;">
        
        <!-- RICHARD FEYNMAN'S QUOTE -->
        <transition name="fade" @after-leave="showTeachers = true">
          <template v-if="isFetchingUser">
            <v-layout align-center justify-center row fill-height wrap>
              <blockquote class="my-quote blockquote text-md-center">"If you can't explain it simply, you don't understand it." - Richard Feynman</blockquote>
            </v-layout>
          </template>
        </transition>

        <!-- LIST OF TEACHERS -->
        <template v-if="!isFetchingUser && user">
          <div class="responsive-grid mt-5">
            <template v-for="teacher in teachers">
              <v-layout :key="teacher.uid">
                <v-flex>
                  <v-card color="blue-grey darken-2" class="white--text">
                    <v-card-title primary-title>
                      <div>
                        <div class="headline">{{ teacher.name }}</div>
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

          <v-btn @click="becomeTeacher()"
                 absolute
                 dark
                 fab
                 bot
                 right
                 color="pink">
            <v-icon>add</v-icon>
          </v-btn>
        </template>

        <!-- SIGN-IN BUTTONS -->
        <template v-else-if="!isFetchingUser && !user">
          <v-layout align-center justify-center row fill-height wrap>
             <v-btn @click="studentSignIn()" color="error" dark large>SIGN IN</v-btn>
          </v-layout>
        </template>

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
    async becomeTeacher() {
      const ref = db.collection('users').doc(this.user.uid)
      await ref.update({
        isTeacher: true,
        description: 'You will be able to edit this soon!'
      })
    },
    async studentSignIn() {
      const provider = new firebase.auth.GoogleAuthProvider()
      await firebase.auth().signInWithRedirect(provider)
      // then main.js's onAuthStateChanged listener will dispatch an action
    }
  },
  data() {
    return {
      teachers: null,
      showTeachers: false 
    }
  },
  async created() {
    this.$binding('teachers', db.collection('users').where('isTeacher', '==', true))
  }
}
</script>

<style>
.my-quote {
  font-size: 2em
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