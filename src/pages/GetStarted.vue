<template>
  <v-container fluid>
    <h1>Get Started</h1>

    <v-col cols="12" sm="6">
      <TheSearchBar 
        :items="mitClasses"
        @submit="newVal => join({ mitClass: newVal })" 
        color="accent"
      />
    </v-col>

    <!-- Ability to create new classes -->
    <h3>Classes enrolled in...</h3>
    <p v-for="c in user.enrolledClasses" :key="c.id">
      {{ c.name }}
      {{ c.description }}
      <v-btn @click="$router.push(`class/${c.id}`)">Go</v-btn>
      <v-btn @click="remove({ mitClass: c })">Remove</v-btn> 
    </p>
    
    <v-btn v-if="user.enrolledClasses.length > 0"
      @click="$router.push(`/`)">
      Home page
    </v-btn>

    <v-btn v-if="user"
      @click="signOut()">
      Sign Out
    </v-btn>
  </v-container>
</template>

<script>
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js"; 
import db from "@/database.js"; 
import TheSearchBar from "@/components/TheSearchBar.vue"; 
import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/auth";

export default {
  name: "GetStarted",
  mixins: [
    DatabaseHelpersMixin
  ],
  components: {
    TheSearchBar
  },
  data () {
    return {
      mitClasses: []
    };
  },
  computed: {
    user () {
      return this.$store.state.user; 
    },
    userRef () {
      return db.doc(`/users/${this.user.uid}`); 
    }
  },
  async created () {
    this.mitClasses = await this.$_getCollection(db.collection("classes")); 
  },
  methods: {
    async join ({ mitClass }) {    
      this.userRef.update({
        enrolledClasses: firebase.firestore.FieldValue.arrayUnion(mitClass),
        mostRecentClassID: mitClass.id
      });
    },
    async remove ({ mitClass }) {
      this.userRef.update({
        enrolledClasses: firebase.firestore.FieldValue.arrayRemove(mitClass)
      });
    },
    signOut () {
      this.$router.push("/");
      firebase.auth().signOut(); 
    }
  }
}
</script>
