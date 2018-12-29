<template>
  <v-layout align-center justify-center row fill-height>
    <v-btn v-if="!user" @click="signIn()" color="pink darken--1 white--text">Sign in with Google</v-btn>
    <v-btn v-else @click="signOut()">Log out</v-btn>
  </v-layout>
</template>

<script>
import { mapState } from 'vuex'

export default {
  computed: {
    ...mapState(['user'])
  },
  methods: {
    signIn() {
      this.$store.dispatch('signIn')
    },
    signOut() {
      this.$store.dispatch('signOut')
    }
  }
}
</script>