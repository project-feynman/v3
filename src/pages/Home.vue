<template>
  <div id="home-page">
    <TheAppBar>
      <template v-if="user">
        <!-- target="_blank" opens a new tab -->
        <!-- <v-btn href="https://medium.com/@eltonlin1998/feynman-overview-338034dcb426" text color="accent" target="_blank">   
          BLOG
        </v-btn> -->
        <BasePopupButton actionName="Create class" 
          @action-do="(C) => createClass(C)"
          :inputFields="['class name', 'class description']"
        >
          <template v-slot:activator-button="{ on }">
            <BaseButton :on="on" icon="mdi-plus">Create Class</BaseButton>
          </template>
        </BasePopupButton>

        <TheDropdownMenu @sign-out="$_signOut()" @settings-changed="S => updateSettings(S)">
          <template v-slot:activator="{ on }">
             <v-avatar v-if="user" v-on="on" color="#ff5b24" style="cursor: pointer;">
              <span v-if="user.firstName && user.lastName" class="white--text headline">
                {{ user.firstName[0] + user.lastName[0] }}
              </span>
            </v-avatar>
          </template>
        </TheDropdownMenu>
      </template>

      <template v-else>
        <BasePopupButton actionName="Log in" 
          :inputFields="['email', 'password']" 
          @action-do="user => $_logIn(user)"
          outlined
          color="secondary"
        >
          <template v-slot:activator-button="{ on }">
            <BaseButton :on="on" icon="mdi-account-circle" color="secondary" data-qa="log-in-btn">Log In</BaseButton>
          </template>
        </BasePopupButton>
      </template>
    </TheAppBar>
    
    <v-content>
      <transition name="fade">
        <v-card v-if="!isFetchingUser" fluid class="mx-auto text-center">
          <v-container>
            <div class="central-title d-flex justify-center align-center mb-4">
              <img src="/logo.png" class="hero-img"/>
              <h1 class="text--primary ml-2">
                explain.mit.edu
              </h1>
            </div>
            <h3 class="headline font-weight-light">
              A vibrant place where students, TAs and professors explain things to each other. 
            </h3>
            <!-- Log in / Sign up -->
            <v-row class="my-5" justify="center">
              <template v-if="!user">
                <v-col cols="auto">
                  <BasePopupButton actionName="Sign Up" 
                    :inputFields="['first name', 'last name', 'email', 'password']" 
                    @action-do="user => $_signUp(user)"
                    outlined
                    color="secondary"
                  >
                    <template v-slot:message-to-user>
                      To provide an <u>exceptional</u> experience, we plan to serve a limited number of classes for the initial closed-beta, where we watch every class session closely, anticipate needs and problems,
                      provide near 24/7 customer support, and fix bugs/implement new features within hourly/daily cycles.
                      <br>
                      <br>
                      However, <u>every class can use explain.mit.edu for free</u> and automatically 
                      benefit from the software upgrades driven by the closed-beta.
                      <br>
                      <br>
                      Sign up for an account to create new classes or join existing classes. Passwords are handled by Google Firebase Authentication.
                    </template>
                  </BasePopupButton>
                </v-col>
              </template>

              <!-- Search Bar -->
              <template v-else>
                <v-col cols="12" sm="6">
                  <TheSearchBar 
                    :items="schoolClasses"
                    @submit="payload => enrollInClass(payload)" 
                    color="accent"
                  />
                </v-col>
              </template>
            </v-row>
          </v-container>
        </v-card>
      </transition>

      <v-container fluid>
        <!-- Class security popup -->
        <v-dialog v-model="classSecurityPopup" max-width="600px">
          <v-card>
            <v-card-title>Please enter the class password</v-card-title>
            <v-card-text>
              <v-text-field v-model="classPassword"/>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn @click="classSecurityPopup = false">CANCEL</v-btn>
              <v-btn @click="handleClassPassword()">SUBMIT</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- Tutorial -->
        <template v-if="!user && !isFetchingUser">
          <v-row>
            <v-col cols="12" md="6">
              <ExplanationDisplay v-if="demoVideo" :expl="demoVideo" :hasDate="false"/>
            </v-col>
            <v-col cols="12" md="6">
              <ExplanationDisplay v-if="demoVideo2" :expl="demoVideo2" :hasDate="false"/>
            </v-col>
          </v-row>
        </template>

        <!-- Classes -->
        <div v-else-if="user" key="class-list">
          <v-row align="stretch" class="enrolled-classes">
            <v-col v-for="C in user.enrolledClasses" cols="12" sm="4" md="3" :key="C.id">
              <RenderlessAsync :dbRef="getMitClassRef(C.id)">
                <template slot-scope="{ fetchedData: C }">
                  <transition name="fade">
                    <v-card v-if="C.name && C.description" :to="`class/${C.id}`" :data-qa="C.name">
                      <v-card-title class="title">{{ C.name }}</v-card-title>
                      <v-card-subtitle>{{ C.description }}</v-card-subtitle>
                    </v-card>
                  </transition>
                </template>
              </RenderlessAsync>
            </v-col>
          </v-row>
        </div>
      </v-container>           
    </v-content>
  </div>
</template>

<script>
import { mapState } from "vuex";
import firebase from "firebase/app";
import "firebase/firestore";
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
  computed: {
    ...mapState([
      "user", 
      "isFetchingUser"
    ]),
    userRef () { 
      return db.collection("users").doc(this.user.uid); 
    }
  },
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
  async created () { 
    this.fetchClasses(); 

    // vision of a vibrant place where people talk around blackboards
    const demoVideoRef = db.doc(`classes/FVdgjuywaFgxvyylISt2/posts/aHaV1yIyaDR4n88pmzDk`);
    
    // visual comparison of normal videos vs doodle videos
    const demoVideoRef2 = db.doc(`classes/mDbUrvjy4pe8Q5s5wyoD/posts/R0BgFgLe8BPvUfrfLmCq`);
    
    this.$_getDoc(demoVideoRef).then(demoVideo => this.demoVideo = demoVideo);
    this.$_getDoc(demoVideoRef2).then(demoVideo2 => this.demoVideo2 = demoVideo2);
  },
  mounted () { 
    window.addEventListener("scroll", this.logoVisibility); 
  },
  destroyed () { 
    window.removeEventListener("scroll", this.logoVisibility); 
  },
  methods: {
    signInAnonymouslyThenRedirectTo (targetRoute) {
      this.$router.push(targetRoute);
    },
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
      for (let [emailOption, isEnabled] of Object.entries(DefaultEmailSettings)) {
        if (isEnabled) {
          userUpdateObject[emailOption] = firebase.firestore.FieldValue.arrayUnion(id);
        }
      }
      await db.collection("users").doc(this.user.uid).update(userUpdateObject);
      this.$root.$emit("show-snackbar", "Successfully added the class to the home page.");
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
    },
    logoVisibility () {
      const hero_pos = document.querySelector(".central-title").getBoundingClientRect().top;
      if (hero_pos < 0) {
        document.getElementById("home-page").classList.add("scrolled");
      } else {
        document.getElementById("home-page").classList.remove("scrolled");
      }
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
.hero-img {
  max-width: 20%;
  width: 90px;
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
