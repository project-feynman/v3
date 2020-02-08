<template>
  <div id="home-page">
    <!-- TODO: move snackbar to App.vue and use root listeners to communicate with it -->
    <v-snackbar v-model="snackbar">
      {{ snackbarMessage }}
      <v-btn @click="snackbar = false" color="pink" text>CLOSE</v-btn>
    </v-snackbar>

    <!-- APP BAR -->
    <TheAppBar>
      <v-btn href="https://medium.com/@eltonlin1998/feynman-overview-338034dcb426" text color="accent" target="_blank">
        BLOG
      </v-btn>
      <v-btn href="https://github.com/eltonlin1998/ExplainMIT" text color="accent" target="_blank">
        GITHUB
      </v-btn>
      <template v-if="user && $route.path == '/'">
        <BasePopupButton
          actionName="Create class" 
          :inputFields="['class name', 'class description']"
          @action-do="payload => createClass(payload)"
          color="accent lighten-1"
        />
      </template>
      <template v-if="user">
        <!-- PROFILE CIRCLE WITH DROPDOWN MENU -->
        <TheDropdownMenu
          @save="payload => updateUser(payload)"
          @sign-out="signOut()"
          @notif-setting-change="payload => updateNotifSetting(payload)"
        >
          <template v-slot:default="{ on }">
            <v-btn v-on="on" icon class="ml-4">
              <v-icon large :color="user.color">settings</v-icon>
            </v-btn>
          </template>
        </TheDropdownMenu>
      </template>
    </TheAppBar>

    <!-- MAIN CONTENT -->
    <v-content>
      <v-card class="mx-auto text-center" fluid>
        <v-container>
          <div class="home-hero py-5">
            <div class="home-header">
              <div class="central-title d-flex justify-center align-center mb-4">
                <img src="/logo.png" class="hero-img" />
                <h1 class="text--primary ml-2">ExplainMIT</h1>
              </div>
              <h3 class="headline text--primary">An efficient platform for visual explanations</h3>
            </div>
            <v-row class="my-5" justify="center">
              <template v-if="!user && !isFetchingUser">
                <v-col cols="auto">
                  <BasePopupButton
                    actionName="Log in" 
                    :inputFields="['email', 'password']"
                    @action-do="payload => logIn(payload)"
                    color="accent lighten-1"
                  />
                </v-col>
                <v-col cols="auto">
                  <BasePopupButton
                    actionName="Sign up" 
                    :inputFields="['first name', 'last name', 'email', 'password']"
                    @action-do="payload => signUp(payload)"
                    color="accent lighten-1" :outlined="true"
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
          </div>
        </v-container>
      </v-card>

      <!-- DISPLAY CLASSES -->
      <transition name="fade" mode="out-in">
        <v-container class="py-10">
          <div v-if="!user && !isFetchingUser" key="loading...">
            <v-row justify="center" class="py-0 text-center">
              <v-col cols="12" sm="10" md="4">
                <v-card elevation="10">
                  <v-card-subtitle
                    class="black--text font-weight-medium"
                  >Ask & answer questions with text and visuals</v-card-subtitle>
                  <v-img :aspect-ratio="16/9">
                    <DoodleVideo
                      ref="DoodleVideo1"
                      whiteboardID="BlEjXn7RP7q8YwxG8FLO"
                      canvasID="1"
                      @animation-loaded="hasFetchedVideos = true"
                      @strokes-ready="startDemo()"
                    />
                  </v-img>
                </v-card>
              </v-col>
              <v-col cols="12" sm="10" md="4">
                <v-card elevation="10">
                  <v-card-subtitle
                    class="black--text font-weight-medium"
                  >Draw & talk on the real-time blackboard</v-card-subtitle>
                  <v-img :aspect-ratio="16/9">
                    <DoodleVideo
                      ref="DoodleVideo2"
                      whiteboardID="8hcybKON8Br67bNUA9TJ"
                      canvasID="2"
                      @animation-loaded="hasFetchedVideos = true"
                    />
                  </v-img>
                </v-card>
              </v-col>
              <v-col cols="12" sm="10" md="4">
                <v-card elevation="10">
                  <v-card-subtitle
                    class="black--text font-weight-medium"
                  >Save & reuse any blackboard explanations</v-card-subtitle>
                  <v-img :aspect-ratio="16/9">
                    <DoodleVideo
                      ref="DoodleVideo3"
                      whiteboardID="vgPkZWvsqvt9pImHiMbe"
                      canvasID="3"
                      @animation-loaded="hasFetchedVideos = true"
                    />
                  </v-img>
                </v-card>
              </v-col>
            </v-row>
          </div>
          <!-- Display classes -->
          <div v-else-if="user" key="class-list">
            <v-row align="stretch" class="enrolled-classes">
              <template v-for="enrolledClass in user.enrolledClasses")>
                <v-col cols="12" sm="4" md="3" :key="enrolledClass.id">
                  <v-card  @click="$router.push(`${enrolledClass.id}/posts/`)">
                    <v-card-title class="title">
                      {{ enrolledClass.name }}
                    </v-card-title>
                  </v-card>
                </v-col>
              </template>
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
    userRef () {
      return db.collection("users").doc(this.user.uid);
    }
  },
  data () {
    return {
      schoolClasses: [],
      snackbar: false,
      snackbarMessage: "",
    }
  },
  created () {
    this.fetchClasses();
  },
  mounted() {
    this.logoVisibility();
    window.addEventListener("scroll", this.logoVisibility);
  },
  destroyed () {
    window.removeEventListener("scroll", this.logoVisibility);
  },
  methods: {
    startDemo () {
      this.$nextTick(async () => {
        await this.$refs.DoodleVideo1.quickplay();
        await this.$refs.DoodleVideo2.quickplay();
        this.$refs.DoodleVideo3.quickplay();
      });
    },
    async fetchClasses () {
      const ref = db.collection("classes");
      this.schoolClasses = await helpers.getCollectionFromDB(ref);
    },
    enrollInClass ({ name, ".key": ID }) {    
      // Abort if user is already enrolled in the class  
      if (this.user.enrolledClasses) {
        for (const classObj of this.user.enrolledClasses) {
          if (classObj.ID === ID) { return; }
        }
      }

      // Add the new class
      const classObj = {
        ID,
        name,
        notifFrequency: CONSTANTS.notifFrequencyEnum.ALWAYS
      }
      db.collection("users").doc(this.user.uid).update({
        enrolledClasses: firebase.firestore.FieldValue.arrayUnion(classObj)
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
      // Check if class exists already
      this.fetchClasses();
      for (const c of this.schoolClasses) {
        if (c.name === name) return; 
      }
      // Create it
      const classRef = db.collection("classes");
      const classDoc = await classRef.add({
        name,
        description: "description",
        tabs: ["New"],
        tags: [],
      });
      // Enroll in it 
      await this.userRef.update({
        enrolledClasses: firebase.firestore.FieldValue.arrayUnion({
          id: classDoc.id,
          name,
          notifFrequency: CONSTANTS.notifFrequencyEnum.ALWAYS
        })
      })
      this.fetchClasses();
    },
    saveParagraph (newValue, courseNumber) {
      const ref = db.collection("classes").doc(courseNumber);
      ref.update({
        paragraph: newValue
      });
    },
    // computeVideoSize() {
    //   return this.$vuetify.breakpoint.smAndDown ? 12 : 4;
    // },
    // computeCardSize () {
    //   if (this.classes.length > 13) {
    //     if (this.$vuetify.breakpoint.md) return 4;
    //     else if (this.$vuetify.breakpoint.smAndDown) return 12;
    //   }
    //   return this.$vuetify.breakpoint.smAndDown ? 6 : 2;
    // },
    logIn ({ email, password }) {
      firebase
        .auth()
        .signInWithEmailAndPassword(email, password)
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
      firebase.auth()
        .createUserWithEmailAndPassword(email, password)
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
    async createAccount ({ uid, email, firstName, lastName }) {
      function getRandomColor () {
        var letters = '0123456789ABCDEF'
        var color = '#'
        for (let i=0; i<6; i++) {
          color += letters[Math.floor(Math.random() * 16)]
        }
        return color
      }
      const newUser = {
        uid,
        email,
        firstName,
        lastName,
        color: getRandomColor(),
        enrolledClasses: []
      }
      const newUserRef = db.collection("users").doc(uid);
      await newUserRef.set(newUser)
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
  justify-content: center;
  font-size: 1.1em;
}
</style>