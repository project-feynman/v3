<template>
  <div style="height: 100%">
    <v-app-bar clipped-left app color="white">
      <v-list-item-avatar @click="$router.push('/get-started')" tile :width="`${40+3}px`" style="cursor: pointer;" :style="`margin-right: ${16-3}px`">
        <img src="/logo.png">
      </v-list-item-avatar>      
      <v-list-item-title style="opacity: 100%; font-size: 1.45rem;">
        Explain
      </v-list-item-title>
      <v-spacer/>
      <v-btn v-if="user" @click="signOut()">
        Sign Out
      </v-btn>
    </v-app-bar>

    <v-navigation-drawer app clipped permanent width="285" touchless height="100%"> 
      <v-list>
        <div class="d-flex align-center pt-2 pb-0" style="padding-left: 18px;">
          <p class="text-uppercase font-weight-bold mb-0" style="margin-top: 2px; opacity: 50%; font-size: 0.8rem;">
            Your Communities
          </p>
          <v-spacer/>
          <!-- Plus icon for joining/creating a community -->
          <v-dialog v-model="isAddCommunityPopupOpen" max-width="800">
            <template v-slot:activator="{ on }">
              <v-btn class="mr-2" icon v-on="on">
                <v-icon color="secondary">mdi-plus</v-icon>
              </v-btn>
            </template>
            <v-card>
              <v-card-title class="headline">Communities</v-card-title>
              <v-card-text>
                <v-row>
                  <v-col cols="3" class="pr-0">
                    <v-subheader class="px-0">Join an existing community</v-subheader>
                  </v-col>
                  <v-col cols="7" class="pa-0 d-flex align-center"> 
                    <TheSearchBar 
                      :items="mitClasses"
                      @submit="newVal => join({ mitClass: newVal })" 
                      color="accent"
                    />
                  </v-col>
                  <v-col cols="2">
                    <v-btn @click="isAddCommunityPopupOpen = false" color="secondary" text>DONE</v-btn>
                  </v-col>
                </v-row>
                
                <v-row>
                  <v-col cols="3" class="pr-0">
                    <v-subheader class="px-0">Or create a new community</v-subheader>
                  </v-col>
                  <v-col cols="7">
                    <v-text-field v-model="nameOfNewCommunity" label="Name" placeholder="e.g. TSR^2, GIRs, 6.036"/>
                    <v-text-field v-model="descriptionOfNewCommunity" label="Description" placeholder="e.g. Intro to Machine Learning"/>
                  </v-col>
                  <v-col cols="2">
                    <v-btn @click="createNewClass()" text color="secondary">CREATE</v-btn>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-dialog>
        </div>

        <v-list-item v-for="c in user.enrolledClasses" :key="c.id" 
          @click="$router.push(`class/${c.id}`)"
          two-line style="padding-left: 30px; padding-right: 24px" 
        >
          <v-list-item-content style="font-size: 1rem; font-weight: 400; color: #424242; opacity: 70%;">
            <v-list-item-title>{{ c.name }}</v-list-item-title>
            <v-list-item-subtitle>{{ c.description }}</v-list-item-subtitle>
          </v-list-item-content>
          <v-list-item-action>
            <v-btn @click.stop="remove({ mitClass: c })" text>L</v-btn> 
          </v-list-item-action>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <v-container fluid class="ma-5">
        <p>
          Welcome to Explain! To get started, press the <u>purple plus icon</u> near the top left.
        </p>
        <a href="https://github.com/feynman-project/explain-mit">Explain is open source</a>
        <p>For help with any issues, email <u>eltonlin@mit.edu</u></p>
      </v-container>
    </v-main>
  </div>
</template>

<script>
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js"; 
import db from "@/database.js"; 
import TheSearchBar from "@/components/TheSearchBar.vue"; 
import BasePopupButton from "@/components/BasePopupButton.vue";
import TheAppBar from "@/components/TheAppBar.vue";
import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/auth";
import { mapState } from "vuex";

export default {
  name: "GetStarted",
  mixins: [
    DatabaseHelpersMixin
  ],
  components: {
    BasePopupButton,
    TheSearchBar,
    TheAppBar
  },
  data () {
    return {
      mitClasses: [],
      isAddCommunityPopupOpen: false,
      nameOfNewCommunity: "",
      descriptionOfNewCommunity: ""
    };
  },
  computed: {
    ...mapState([
      "user",
      "isAdmin"
    ]),
    userRef () {
      return db.doc(`/users/${this.user.uid}`); 
    }
  },
  async created () {
    this.mitClasses = await this.$_getCollection(db.collection("classes")); 
  },
  methods: {
    // fundamentally create a new class, by the way that could be why there is no growth, because
    // there is no ability for people to open new classes and lounges
    async createNewClass () {
      if (!this.nameOfNewCommunity || !this.descriptionOfNewCommunity) {
        this.$root.$emit("show-snackbar", "You must enter both a name and a description.");
        return;
      }
      for (const c of this.mitClasses) {
        if (c.name === this.nameOfNewCommunity) {
          this.$root.$emit("show-snackbar", `Can't create ${this.nameOfNewCommunity} because it already exists.`)
          return; 
        }
      }

      // TODO: parallelize with Promise.all() or use getRandomId(); 
      const classDoc = await db.collection("classes").add({
        name: this.nameOfNewCommunity,
        description: this.descriptionOfNewCommunity,
        roomTypes: ["Blackboard Rooms"]
      });
      await this.userRef.update({
        enrolledClasses: firebase.firestore.FieldValue.arrayUnion({
          id: classDoc.id,
          name: this.nameOfNewCommunity,
          description: this.descriptionOfNewCommunity
        })
      });

      // now update again
      this.mitClasses = await this.$_getCollection(db.collection("classes")); 

      this.$root.$emit("show-snackbar", `${this.nameOfNewCommunity} has been created.`)
      this.nameOfNewCommunity = "";
      this.descriptionOfNewCommunity = ""; 
    },
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
