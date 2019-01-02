<template>
  <v-layout align-center justify-center row fill-height>
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