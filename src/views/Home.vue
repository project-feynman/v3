<template>
  <div id="home-page">
    <!-- TODO: move snackbar to App.vue and use root listeners to communicate with it -->
    <v-snackbar v-model="snackbar">
      {{ snackbarMessage }}
      <v-btn @click="snackbar = false" color="pink" text>CLOSE</v-btn>
    </v-snackbar>

    <TheAppBar>
      <v-btn href="https://medium.com/@eltonlin1998/feynman-overview-338034dcb426" text color="accent" target="_blank">
        BLOG
      </v-btn>
      <v-btn href="https://github.com/eltonlin1998/ExplainMIT" text color="accent" target="_blank">
        GITHUB
      </v-btn>
      <template v-if="user">
        <BasePopupButton
          actionName="Create class" 
          :inputFields="['class name', 'class description']"
          @action-do="payload => createClass(payload)"
        />
        <TheDropdownMenu
          @save="payload => updateUser(payload)"
          @sign-out="signOut()"
          @notif-setting-change="payload => updateNotifSetting(payload)"
        >
          <template v-slot:default="{ on }">
            <v-btn v-on="on" icon class="ml-4">
              <v-icon large :color="user.color">
                settings
              </v-icon>
            </v-btn>
          </template>
        </TheDropdownMenu>
      </template>
    </TheAppBar>

    <v-content>
      <v-card class="mx-auto text-center" fluid>
        <v-container>
          <div class="central-title d-flex justify-center align-center mb-4">
            <img src="/logo.png" class="hero-img" />
            <h1 class="text--primary ml-2">
              ExplainMIT
            </h1>
          </div>
          <h3 class="headline text--primary">
            An efficient platform for visual explanations
          </h3>

          <!-- Log in / Sign up -->
          <v-row class="my-5" justify="center">
            <template v-if="!user && !isFetchingUser">
              <v-col cols="auto">
                <BasePopupButton
                  actionName="Log in" 
                  :inputFields="['email', 'password']"
                  @action-do="payload => logIn(payload)"
                />
              </v-col>
              <v-col cols="auto">
                <BasePopupButton
                  actionName="Sign up" 
                  :inputFields="['first name', 'last name', 'email', 'password']"
                  @action-do="payload => signUp(payload)"
                  :outlined="true"
                />
              </v-col>
            </template>

            <!-- Search Bar -->
            <template v-else-if="user">
              <v-col cols="12" sm="6">
                <BaseSearchBar 
                  :items="schoolClasses"
                  @submit="payload => enrollInClass(payload)"
                  color="accent"
                  label="Join an existing class"
                />
              </v-col>
            </template>
          </v-row>
        </v-container>
      </v-card>

      <transition name="fade" mode="out-in">
        <v-container fluid class="py-5">
          <div v-if="!user && !isFetchingUser" key="loading...">
            <v-row justify="center" class="py-0 text-center">
              <v-col 
                v-for="(tutorial, i) in tutorials" 
                cols="12" sm="10" md="4" :key="tutorial.blackboardId"
              >
                <v-card elevation="5">
                  <v-card-subtitle class="black--text font-weight-medium">
                    {{ tutorial.description }}
                  </v-card-subtitle>
                  <v-img :aspect-ratio="16/9">
                    <DoodleVideo
                      :ref="`DoodleVideo${i+1}`"
                      :blackboardId="tutorial.blackboardId"
                      :blackboardRef="tutorial.blackboardRef"
                      @strokes-ready="startDemo()"
                    />      
                  </v-img>
                </v-card>
              </v-col>
            </v-row>
          </div>
                            
          <!-- Display classes -->
          <div v-else-if="user" key="class-list">
            <v-row align="stretch" class="enrolled-classes">
              <v-col 
                v-for="enrolledClass in user.enrolledClasses" 
                cols="12" sm="4" md="3" :key="enrolledClass.id"
              >
                <v-card @click="$router.push(`${enrolledClass.id}/posts/`)">
                  <v-card-title class="title">{{ enrolledClass.name }}</v-card-title>
                  <v-card-subtitle>No description yet</v-card-subtitle>
                </v-card>
              </v-col>
            </v-row>
          </div>
        </v-container>
      </transition>             
    </v-content>
  </div>
</template>

<script>
import { mapState } from "vuex";
import firebase from "firebase/app";
import "firebase/auth";
import db from "@/database.js";
import DoodleVideo from "@/components/DoodleVideo.vue";
import TheAppBar from "@/components/TheAppBar.vue";
import TheDropdownMenu from "@/components/TheDropdownMenu.vue";
import BaseSearchBar from "@/components/BaseSearchBar.vue";
import helpers from "@/helpers.js";
import CONSTANTS from "@/CONSTANTS.js";
import BasePopupButton from "@/components/BasePopupButton.vue";

export default {
  components: {
    TheAppBar,
    DoodleVideo,
    BaseSearchBar,
    TheDropdownMenu,
    BasePopupButton
  },
  computed: {
    ...mapState(["user", "isFetchingUser"]),
    userRef () { return db.collection("users").doc(this.user.uid); },
  },
  data () {
    return {
      schoolClasses: [],
      snackbar: false,
      snackbarMessage: "",
      tutorials: [
        { 
          blackboardId: "iqd5rFyuFYL8TDlCnPfe",
          blackboardRef: this.getBlackboardRef("iqd5rFyuFYL8TDlCnPfe"),
          description: "We believe MIT is fun when people share knowledge"
        },
        { 
          blackboardId: "Dl3aCLcev04pvRG4Duc2",
          blackboardRef: this.getBlackboardRef("Dl3aCLcev04pvRG4Duc2"),
          description: "Use text, images, drawings and/or voice to communicate"
        },
        { 
          blackboardId: "r2FWkTWgRB64MGbkQuHC",
          blackboardRef: this.getBlackboardRef("r2FWkTWgRB64MGbkQuHC"),
          description: "Explanations accumulate as people help each other"
        }
      ]
    }
  },
  created () {
    this.fetchClasses();
  },
  mounted () {
    this.logoVisibility();
    window.addEventListener("scroll", this.logoVisibility);
  },
  destroyed () {
    window.removeEventListener("scroll", this.logoVisibility);
  },
  methods: {
    getBlackboardRef (explanationId) {
      return db.collection("classes").doc("jpQFXYNXCgCScaHZPL27")
        .collection("posts").doc("qdlx2j0j0k4lbbb6h28zo")
        .collection("explanations").doc(explanationId);
    },
    startDemo () {
      const { DoodleVideo1, DoodleVideo2, DoodleVideo3 } = this.$refs;
      if (!DoodleVideo1[0].hasFetchedStrokes || DoodleVideo1[0].isQuickplaying) { 
        return; 
      }
      // need next tick so the quickplay starts after the resize event
      this.$nextTick(async () => {
        await DoodleVideo1[0].playSilentAnimation(); // don't know why DoodleVideo returns arrays
        await DoodleVideo2[0].playSilentAnimation();
        DoodleVideo3[0].playSilentAnimation();
      })
    },
    async fetchClasses () {
      const ref = db.collection("classes");
      this.schoolClasses = await helpers.getCollectionFromDB(ref);
    },
    enrollInClass ({ name, ".key": id }) {    
      if (this.user.enrolledClasses) {
        for (const classObj of this.user.enrolledClasses) {
          if (classObj.id === id) { return; } 
        }
      }
      const { ALWAYS } = CONSTANTS.notifFrequencyEnum;
      const classSetting = { id, name, notifFrequency: ALWAYS };
      db.collection("users").doc(this.user.uid).update({
        enrolledClasses: firebase.firestore.FieldValue.arrayUnion(classSetting)
      });
    },
    async updateNotifSetting (payload) {
      this.userRef.update({
        enrolledClasses: payload
      })
    },
    updateUser (payload) {
      return; // TODO
    },
    async createClass ({ "class name": name, "class description": description }) {
      this.fetchClasses();
      for (const c of this.schoolClasses) {
        if (c.name === name) { return; } 
      }
      const classDoc = await db.collection("classes").add({
        name,
        description: description || "No description yet",
        tabs: ["New"],
        tags: [],
      });
      await this.userRef.update({
        enrolledClasses: firebase.firestore.FieldValue.arrayUnion({
          id: classDoc.id,
          name,
          notifFrequency: CONSTANTS.notifFrequencyEnum.ALWAYS
        })
      })
      this.fetchClasses();
    },
    logIn ({ email, password }) {
      firebase.auth().signInWithEmailAndPassword(email, password)
        .then(user => {
          this.$store.dispatch("handleUserLogic", user);
          this.snackbarMessage = `Welcome to ExplainMIT!`;
          this.snackbar = true;
        })
        .catch(error => {
          this.snackbarMessage = error.message;
          this.snackbar = true;
        });
    },
    signUp ({ "first name": firstName, "last name": lastName, email, password }) {
      if (!firstName || !lastName) { 
        this.snackbarMessage = "Don't forget to enter both your first name and last name!"
        this.snackbar = true;
        return;
      }
      firebase.auth().createUserWithEmailAndPassword(email, password)
        .then(async result => {
          this.snackbarMessage = `Welcome to ExplainMIT!`;
          this.snackbar = true;
          this.createAccount({ ...result.user, firstName, lastName })
        })
        .catch(error => {
          this.snackbarMessage = error.message;
          this.snackbar = true;
        });
    },
    createAccount ({ uid, email, firstName, lastName }) {
      function getRandomColor () {
        var letters = '0123456789ABCDEF'
        var color = '#'
        for (let i=0; i<6; i++) {
          color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
      }
      const color = getRandomColor();
      const enrolledClasses = [];
      const newUser = { uid, email, firstName, lastName, color, enrolledClasses };
      db.collection("users").doc(uid).set(newUser);
    },
    signOut () {
      firebase.auth().signOut();
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
  font-size: 3em;
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
  /* justify-content: center; */
  font-size: 1.1em;
}
</style>