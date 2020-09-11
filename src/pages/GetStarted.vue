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
    
    <v-container>
      <!-- Ability to create new classes -->
      <v-card v-for="c in user.enrolledClasses" :key="c.id" width="500">
        <v-card-title>{{ c.name }}</v-card-title>
        <v-card-subtitle>{{ c.description }}</v-card-subtitle>
        <v-card-actions>
          <v-spacer/>
          <v-btn @click="remove({ mitClass: c })" text>Remove</v-btn> 
          <v-btn @click="$router.push(`class/${c.id}`)" text color="secondary">ENTER</v-btn>
        </v-card-actions>
      </v-card>
      
    </v-container>
  
    <v-btn v-if="user"
      @click="signOut()">
      Sign Out
    </v-btn>

    <p>For any issues big or small, email <u>eltonlin@mit.edu</u></p>
    <p>To report issues, visit <a href="https://github.com/feynman-project/explain-mit/issues" target="_blank">https://github.com/feynman-project/explain-mit/issues</a></p>

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
    async signOut () {
      await firebase.auth().signOut(); // will trigger `onAuthStateChanged` in router.js
      this.$router.push("/");
    }
  }
}
</script>
