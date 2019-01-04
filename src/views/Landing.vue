<template>
    <!-- <v-layout align-center justify-center row fill-height>
      <blockquote class="blockquote text-md-center">"If you can't explain it simply, you don't understand it." - Richard Feynman</blockquote>
    </v-layout> -->
  
  <!-- <h3 class="text-md-center">HOW TO USE</h3>
  <p class="text-md-center">
    The layout is analogous to Office Hours. The TA visits each student with questions, and the interactions are live. <br>
    Precious explanations can be saved as animations to benefit future students and teachers. 
  </p>
  <h3 class="text-md-center">For TAs</h3>
  <p class="text-md-center">
    Students with questions have red badges next to their names. Visit their rooms to see their questions. <br>
    You can write directly on the whiteboard, type out an answer, or do both. 
  </p>
  <h3 class="text-md-center">For students</h3>
  <p class="text-md-center">
    When you submit a question in your "workspace", a red badge will appear next to your name to alert the TA. <br>
    While the TA is helping, you may ask follow-up questions.
  </p> -->
  <v-layout align-center justify-center row fill-height wrap>
    <blockquote class="my-quote blockquote text-md-center">"If you can't explain it simply, you don't understand it." - Richard Feynman</blockquote>
    <v-btn v-if="!user" @click="signIn()" color="pink darken--1 white--text">Sign in with Google</v-btn>
    <v-btn v-else @click="signOut()">Log out</v-btn>
  </v-layout>

</template>

<script>
import { mapState } from 'vuex'
import firebase from 'firebase/app'
import 'firebase/auth'

export default {
  computed: {
    ...mapState(['user'])
  },
  methods: {
    async signIn() {
      const provider = new firebase.auth.GoogleAuthProvider()
      const result = await firebase.auth().signInWithPopup(provider)
      // then main.js's onAuthStateChanged listener will dispatch the action
    },
    async signOut() {
      await firebase.auth().signOut()
    }
  }
}
</script>

<style>
.my-quote {
  font-size: 2.4em
}
</style>