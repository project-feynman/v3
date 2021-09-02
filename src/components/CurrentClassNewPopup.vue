<template>
  <v-dialog 
    :value="isAddClassPopupOpen" 
    @input="(newVal) => $emit('input', newVal)"
    max-width="800"
  >
    <v-card v-if="user.email">
      <v-card-title class="headline">Manage Classes</v-card-title>
      <v-card-text>
        <v-row>
          <v-col>
            <v-subheader class="px-0" style="font-size: 1rem">Classes you're currently in:</v-subheader>
          </v-col> 
        </v-row>
        
        <v-list-item v-for="mitClass of user.enrolledClasses" :key="mitClass.id" style="margin-left: 30px; margin-bottom: 5px; font-size: 1rem">
          <b style="margin-right: 15px">{{ mitClass.name }}</b> 
          {{ mitClass.description }} 
          <v-spacer/>
          <v-btn v-if="user.enrolledClasses.length > 1" @click="leaveClass(mitClass.id)">
            LEAVE
          </v-btn>
        </v-list-item>
        <v-row>
          <v-col class="mx-5 my-3 d-flex align-center"> 
            <CurrentClassNewPopupSearchBar 
              :items="mitClasses"
              @submit="newVal => join({ mitClass: newVal })" 
              color="accent"
            />
          </v-col>
        </v-row>
        
        <v-row>
          <v-col cols="3" class="pr-0">
            <v-subheader class="px-0">Or create a new class</v-subheader>
          </v-col>
          <v-col cols="7">
            <v-text-field v-model="nameOfNewCommunity" label="Name" placeholder="e.g. 6.036"/>
            <v-text-field v-model="descriptionOfNewCommunity" label="Description" placeholder="e.g. Intro to Machine Learning"/>
          </v-col>
          <v-col cols="2">
            <v-btn @click="createNewClass()" text color="secondary">CREATE</v-btn>
          </v-col>
        </v-row>   
      </v-card-text>
    </v-card>

    <!-- Alternative if the user does not exist -->
    <v-card v-else>
      <v-card-title>Manage Classes</v-card-title>
      <v-card-text>
        <v-btn @click="$_logInWithTouchstone()" large class="green darken-1 white--text">
          <v-icon class="mr-2">mdi-school</v-icon>
          MIT LOGIN
        </v-btn>

        <v-btn @click="$_logInWithGoogle()" large class="cyan--text ml-2">
          <v-icon class="mr-2" color="cyan">mdi-google</v-icon>
          Google Login
        </v-btn>

        <!-- Email Sign Up -->
        <BasePopupButton actionName="Sign up with email" 
          :inputFields="['first name', 'last name', 'email', 'password']" 
          @action-do="user => $_signUp(user)"
        >
          <template v-slot:activator-button="{ on }">
            <v-btn v-on="on" large class="ml-5 mr-2 grey darken-1 white--text">
              <v-icon class="mr-2">mdi-email</v-icon>
              EMAIL SIGNUP
            </v-btn>
          </template>

          <template v-slot:message-to-user>
            Email sign-up is a back-up option if you have trouble with MIT Touchstone. 
            To prevent unexpected behavior, use a <u>non-MIT</u> email address to sign up. 
          </template>
        </BasePopupButton>

        <!-- Email Log In -->
        <BasePopupButton actionName="Log in with email" 
          :inputFields="['email', 'password']" 
          @action-do="user => $_logIn(user)"
        >
          <template v-slot:activator-button="{ on }">
            <v-btn v-on="on" large class="grey darken-1 white--text">
              <v-icon class="mr-2">mdi-email</v-icon>
              EMAIL LOGIN
            </v-btn>
          </template>
        </BasePopupButton>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
import AuthHelpers from "@/mixins/AuthHelpers.js";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import CurrentClassNewPopupSearchBar from "@/components/CurrentClassNewPopupSearchBar.vue";
import db from "@/database.js";
import firebase from "firebase/app";
import BasePopupButton from "@/components/BasePopupButton.vue"; 
import BaseButton from "@/components/BaseButton.vue"; 
import { getRandomId } from "@/helpers.js"; 

export default {
  props: {
    isAddClassPopupOpen: {
      type: Boolean,
      required: true
    }
  },
  mixins: [
    AuthHelpers,
    DatabaseHelpersMixin
  ],
  components: {
    CurrentClassNewPopupSearchBar,
    BasePopupButton,
    BaseButton
  },
  data () {
    return {
      mitClasses: [],
      nameOfNewCommunity: "",
      descriptionOfNewCommunity: ""
    }
  },
  computed: {
    user () { return this.$store.state.user; },
    userRef () { return db.doc(`/users/${this.$store.state.user.uid}`); }
  },
  async created () {
    this.mitClasses = await this.$_getCollection(db.collection("classes")); 
  },
  methods: {
    async join ({ mitClass }) {    
      this.userRef.update({
        enrolledClasses: firebase.firestore.FieldValue.arrayUnion(mitClass),
        mostRecentClassID: mitClass.id,
        emailOnNewQuestion: firebase.firestore.FieldValue.arrayUnion(mitClass.id),
        emailOnNewReply: firebase.firestore.FieldValue.arrayUnion(mitClass.id)
      });
      this.$root.$emit("show-snackbar", `Successfully joined ${mitClass.name}.`);
      this.$router.push(`/class/${mitClass.id}/section/${mitClass.id}/room/${mitClass.id}`);
    },
    async signOut () {
      await firebase.auth().signOut(); // will trigger `onAuthStateChanged` in router.js
      this.$router.push("/");
    },
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
      const newClassID = getRandomId(); 
      const classDoc = await db.doc(`/classes/${newClassID}`).set({
        name: this.nameOfNewCommunity,
        description: this.descriptionOfNewCommunity,
        tags: [{
          name: "Default Class Folder",
          id: newClassID,
          parent: null 
        }]
      });

      const ref = db.doc(`classes/${newClassID}`);
      await Promise.all([
        this.userRef.update({
          enrolledClasses: firebase.firestore.FieldValue.arrayUnion({
            id: newClassID,
            name: this.nameOfNewCommunity,
            description: this.descriptionOfNewCommunity
          }),
          emailOnNewQuestion: firebase.firestore.FieldValue.arrayUnion(newClassID),
          emailOnNewReply: firebase.firestore.FieldValue.arrayUnion(newClassID)
        }),
        // TODO: not DRY, was copied and pasted from ClassPageLayout
        ref.collection("roomTypes").doc(newClassID).set({ 
          id: newClassID, name: "Lounge Area" 
        }),
        ref.collection("rooms").doc(newClassID).set({
          isCommonRoom: true,
          roomTypeID: newClassID,
          blackboards: [newClassID]
        }),
        ref.collection("blackboards").doc(newClassID).set({

        })
      ]);

      // now update again
      this.mitClasses = await this.$_getCollection(db.collection("classes")); 

      this.$root.$emit("show-snackbar", `${this.nameOfNewCommunity} has been created.`)
      this.nameOfNewCommunity = "";
      this.descriptionOfNewCommunity = ""; 

      // automatic redirect
      this.$router.push(`/class/${newClassID}/section/${newClassID}/room/${newClassID}`);
    },
    async leaveClass (id) {
      const { user } = this; 
      let classToRemove = null; 
      for (const enrolledClass of user.enrolledClasses) {
        if (enrolledClass.id === id) {
          classToRemove = enrolledClass;
          break; 
        }
      }

      // bad quickfix code to find a different classID to become the default redirected class
      let newDefaultRedirectedClass = null; 
      for (const enrolledClass of user.enrolledClasses) {
        if (enrolledClass.id !== classToRemove.id) {
          newDefaultRedirectedClass = enrolledClass; 
          break; 
        }
      }

      await db.collection("users").doc(user.uid).update({
        enrolledClasses: firebase.firestore.FieldValue.arrayRemove(classToRemove),
        mostRecentClassID: newDefaultRedirectedClass.id,
        emailOnNewQuestion: firebase.firestore.FieldValue.arrayRemove(classToRemove.id),
        emailOnNewReply: firebase.firestore.FieldValue.arrayRemove(classToRemove.id)
      });
      
      const newID = newDefaultRedirectedClass.id; 
      this.$router.push(`/class/${newID}/section/${newID}/room/${newID}`);
    }
  }
};
</script>