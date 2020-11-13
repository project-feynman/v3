<template>
  <div>
    <v-main>
      <transition name="fade">
        <v-card v-if="!isFetchingUser" fluid class="mx-auto text-center">
          <v-container class="py-5">
            <div class="central-title d-flex justify-center align-center my-4">
              <img src="/logo.png"/>
              <h1 class="text--primary ml-2">
                explain.mit.edu
              </h1>
            </div>
              
            <h3 class="headline font-weight-normal" style="opacity: 70%">
              A vibrant place where students, TAs and professors explain things to each other. 
            </h3>
            <!-- Log in / Sign up -->
            <v-row class="my-5 py-5" justify="center">
              <template v-if="user">
                <v-btn @click="$router.push(`class/${user.mostRecentClassID || 'lvzQqyZIV1wjwYnRV9hn'}`)" 
                  large class="mx-5 purple white--text"
                >
                  ENTER CLASS
                </v-btn>

                <v-btn large class="grey white--text mx-5">
                  <a target="_blank" href="https://github.com/project-feynman/explain-mit" class="white--text">GITHUB</a>
                </v-btn>

                <v-btn large @click="$_signOut()" class="mx-5 grey white--text">
                  SIGN OUT
                </v-btn>          
              </template>
            
              <template v-else>
                <v-btn @click="$_logInWithTouchstone()" large class="secondary white--text mx-5">
                  TOUCHSTONE LOGIN
                </v-btn>

                <v-btn large class="grey white--text mx-5">
                  <a target="_blank" href="https://github.com/project-feynman/explain-mit" class="white--text">GITHUB</a>
                </v-btn>

                <!-- Email Sign Up -->
                <BasePopupButton actionName="Sign up with email" 
                  :inputFields="['first name', 'last name', 'email', 'password']" 
                  @action-do="user => $_signUp(user)"
                >
                  <template v-slot:activator-button="{ on }">
                    <v-btn v-on="on" large class="mx-5 grey white--text">EMAIL SIGNUP</v-btn>
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
                    <v-btn v-on="on" large class="mx-5 grey white--text">EMAIL LOGIN</v-btn>
                  </template>
                </BasePopupButton>
              </template>
            </v-row>
          </v-container>
        </v-card>
      </transition>
      
      <v-container fluid class="pa-5">
        <v-card>
          <v-card-title>
            <h3>Introduction</h3>
          </v-card-title>

          <v-card-text style="font-size: 1rem;">
            <p>
              Explain is an experimental web app with many blackboard rooms. 
            </p>
            <ul>
              <li><b>Phase I (2020):</b> Create a vibrant, electrifying place where people can help each other and have fun</li>
              <li><b>Phase II (2021):</b> Build infrastructure to enable the new era of lightweight visual explanations</li>
              <li><b>Phase III (2022):</b> Scale the platform to accelerate the world's transition into open learning</li>
            </ul>
          </v-card-text>
        </v-card>

        <v-row>
          <v-col cols="12" lg="6">
            <ExplanationDisplay v-if="demoVideo" :expl="demoVideo" :hasDate="false"/>
          </v-col>
          <v-col cols="12" lg="6">
            <ExplanationDisplay v-if="demoVideo2" :expl="demoVideo2" :hasDate="false"/>
          </v-col>
        </v-row>
      </v-container>           
    </v-main>
  </div>
</template>

<script>
import { mapState } from "vuex";
import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/auth";
import db from "@/database.js";
import TheAppBar from "@/components/TheAppBar.vue";
import TheDropdownMenu from "@/components/TheDropdownMenu.vue";
import TheSearchBar from "@/components/TheSearchBar.vue";
import RenderlessAsync from "@/components/RenderlessAsync.vue";
import BasePopupButton from "@/components/BasePopupButton.vue";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import AuthHelpers from "@/mixins/AuthHelpers.js";
import ExplanationDisplay from "@/components/ExplanationDisplay.vue";
import ExplanationCreate from "@/components/ExplanationCreate.vue";
import { demoVideo, demoVideo2, DefaultEmailSettings } from "@/CONSTANTS.js";
import BaseButton from "@/components/BaseButton.vue";

export default {
  name: "HomePage",
  components: {
    RenderlessAsync, 
    BasePopupButton,
    ExplanationDisplay,
    ExplanationCreate,
    TheAppBar,
    TheDropdownMenu,
    TheSearchBar,
    BaseButton
  },
  mixins: [
    AuthHelpers,
    DatabaseHelpersMixin
  ],
  data () {
    return {
      schoolClasses: [],
      demoVideo: null,
      demoVideo2: null,
      welcomeMessage: "Welcome to ExplainMIT!",
      classSecurityPopup: false,
      classPassword: "",
      attemptToJoinClassId: "",
      attemptToJoinClassName: "",
      hasEnteredPassword: false
    };
  },
  computed: {
    ...mapState([
      "user", 
      "isFetchingUser"
    ]),
    userRef () { 
      return db.collection("users").doc(this.user.uid); 
    }
  },
  async created () { 

    // vision of a vibrant place where people talk around blackboards
    const demoVideoRef = db.doc(`classes/FVdgjuywaFgxvyylISt2/posts/aHaV1yIyaDR4n88pmzDk`);

    // const demoVideoRef3 = db.doc("classes/mDbUrvjy4pe8Q5s5wyoD/posts/I1viW7kVl5UFkfeYZVZy");
    const demoVideoRef4 = db.doc("classes/lvzQqyZIV1wjwYnRV9hn/posts/LOCgTA76qXcTaW6vgJAc");
    
    // visual comparison of normal videos vs doodle videos
    // const demoVideoRef2 = db.doc(`classes/mDbUrvjy4pe8Q5s5wyoD/posts/R0BgFgLe8BPvUfrfLmCq`);
    
    this.$_getDoc(demoVideoRef).then(demoVideo => this.demoVideo = demoVideo);
    // note this is videoRef3!
    this.$_getDoc(demoVideoRef4).then(demoVideo2 => this.demoVideo2 = demoVideo2);
  },
  methods: {
    handleClassPassword () {
      if (["explainphysics", "physics"].includes(this.classPassword.toLowerCase())) {
        this.hasEnteredPassword = true;
        this.enrollInClass({ 
          name: this.attemptToJoinClassName,
          id: this.attemptToJoinClassId
        });
        this.$root.$emit("show-snackbar", "Password is correct, joining...");
      } else {
        this.$root.$emit("show-snackbar", "Incorrect password.")
      }
      // reset everything
      this.attemptToJoinClassName = "";
      this.attemptToJoinClassId = "";
      this.hasEnteredPassword = false;
      this.classPassword = "";
      this.classSecurityPopup = false;
    },
    getMitClassRef (classId) { 
      return db.collection("classes").doc(classId); 
    },
    async fetchClasses () {
      const ref = db.collection("classes");
      this.schoolClasses = await this.$_getCollection(ref);
    },
    async enrollInClass ({ name, id }) {    
      // check if it is password protected
      if (!this.hasEnteredPassword) {
        if (["8.02", "8.011"].includes(name)) {
          this.attemptToJoinClassName = name;
          this.attemptToJoinClassId = id;
          this.classSecurityPopup = true;
          return;
        }
      }
      if (this.user.enrolledClasses) {
        for (const classObj of this.user.enrolledClasses) {
          if (classObj.id === id) return; 
        }
      }
      // update the user document to reflect the class enrollment
      const userUpdateObject = {};
      userUpdateObject.enrolledClasses = firebase.firestore.FieldValue.arrayUnion({
        id, 
        name
      });
      // for (let [emailOption, isEnabled] of Object.entries(DefaultEmailSettings)) {
      //   if (isEnabled) {
      //     userUpdateObject[emailOption] = firebase.firestore.FieldValue.arrayUnion(id);
      //   }
      // }
      await db.collection("users").doc(this.user.uid).update(userUpdateObject);
    },
    async updateSettings (payload) {
      this.userRef.update({ enrolledClasses: payload })
    },
    async createClass ({ "class name": name, "class description": description }) {
      if (!name) {
        this.$root.$emit("show-snackbar", "Error: new class must have a name");
        return;
      }
      this.fetchClasses();
      for (const c of this.schoolClasses) {
        if (c.name === name) return; 
      }
      // TODO: parallelize with Promise.all()
      const classDoc = await db.collection("classes").add({
        name,
        description: description || "No description yet",
        tags: [],
        roomTypes: ["Blackboard Rooms"]
      });
      await this.userRef.update({
        enrolledClasses: firebase.firestore.FieldValue.arrayUnion({
          id: classDoc.id,
          name
        })
      });
      this.fetchClasses();
    }
  }
};
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.7s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}
#home-page .app-banner {
  border-bottom: none !important;
}
.central-title h1 {
  font-size: 3.4em;
  font-weight: 600;
  font-family: "Raleway", sans-serif;
  text-decoration: underline;
  text-decoration-color: #eee;
}
@media (max-width: 400px) {
  .central-title h1 {
    font-size: 2.5em;
  }
}
#home-page .app-banner .home-logo {
  display: none;
}
#home-page.scrolled .app-banner .home-logo {
  display: unset;
}
.enrolled-classes .v-card__title {
  word-break: unset;
  font-size: 1.1em;
}
/* latin-ext */
@font-face {
  font-family: 'Raleway';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: local('Raleway SemiBold'), local('Raleway-SemiBold'), url(https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwPIsWqhPAMif.woff2) format('woff2');
  unicode-range: U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
/* latin */
@font-face {
  font-family: 'Raleway';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: local('Raleway SemiBold'), local('Raleway-SemiBold'), url(https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwPIsWqZPAA.woff2) format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
</style>
