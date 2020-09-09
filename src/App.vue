<template>
  <v-app>
    <router-view v-if="!isFetchingUser"/>
    
    <v-snackbar v-model="snackbar">
      {{ snackbarMessage }}
      <v-btn @click="snackbar = false" color="pink" text>CLOSE</v-btn>
    </v-snackbar>
  </v-app>
</template>

<script>
import firebase from "firebase/app";
import "firebase/auth";
import { mapState } from "vuex"; 

export default {
  data: () => ({
    snackbar: false,
    snackbarMessage: ""
  }),
  computed: {
    ...mapState([
      "user",
      "isFetchingUser"
    ])
  },
  created () {
    firebase.auth().onAuthStateChanged(async user => {
      if (!user) {
        this.$store.commit('SET_USER', null);
      } 
      else {
        // fetches or creates a user account
        await this.$store.dispatch("fetchUser", { uid: user.uid }); 
        const { mostRecentClassID } = this.user; 
        if (!mostRecentClassID) {
          this.$router.push("/get-started");
        } else {
          this.$router.push(`/class/${mostRecentClassID}`);
        }
      }
    });

    this.$root.$on("show-snackbar", message => {
      this.snackbar = true;
      this.snackbarMessage = message;
    });
  }
}
</script>
<style>
/* Global styles */
a {
  text-decoration: none;
}
/*
::-webkit-scrollbar {
    width: 12px;
}
::-webkit-scrollbar-track {
    -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.3); 
    border-radius: 10px;
    background-color: rgba(0,0,0,0.15);
}
 
::-webkit-scrollbar-thumb {
    border-radius: 10px;
    -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.5); 
    background-color: orange;
}*/
</style>