<template>
  <div id="home-page">
    <!-- SNACKBAR -->
    <v-snackbar v-model="snackbar">
      {{ snackbarMessage }}
      <v-btn @click="snackbar = false" color="pink" text>CLOSE</v-btn>
    </v-snackbar>

    <!-- LOGIN / SIGNUP -->
    <PopupLogin
      v-model="loginPopup"
      :newAccount="false"
      @sign-in="payload => signIn(payload)"
      @create-account="payload => createAccount(payload)"
    />

    <!-- POPUP BUTTON AND POPUP NEW CLASS -->
    <PopupNewClass
      v-model="newClassPopup"
      @create-class="courseNumber => createClass(courseNumber)"
    />

    <!-- CONFIRM SIGNUP POPUP -->
    <BasePopup
      v-if="searchBarDialog"
      title="Do you want to add the following class?"
      :text="chosenClass"
      :options="searchBarDialogOptions"
      @submit="searchBarDialogSubmitted"
    />

    <BaseAppBar>
      <v-btn
        href="https://medium.com/@eltonlin1998/feynman-overview-338034dcb426"
        text
        color="accent"
        target="_blank"
      >BLOG</v-btn>
      <v-btn
        href="https://github.com/eltonlin1998/ExplainMIT"
        text
        color="accent"
        target="_blank"
      >GITHUB</v-btn>
      <template v-if="user && $route.path == '/'">
        <v-btn @click="newClassPopup = true" dark color="accent lighten-1">CREATE CLASS</v-btn>
      </template>
      <template v-if="!isFetchingUser">
        <!-- BASE MENU AND V-BTN -->
        <BaseMenu
          v-if="user"
          :user="user"
          @save="payload => updateUser(payload)"
          @sign-out="signOut()"
        >
          <template v-slot:default="{ on }">
            <v-btn v-on="on" icon class="ml-4">
              <v-icon large :color="user.color">account_circle</v-icon>
            </v-btn>
          </template>
        </BaseMenu>
      </template>
    </BaseAppBar>
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
              <!-- previous button color was deep-purple accent-4 -->
              <template v-if="!user">
                <v-col cols="auto">
                  <v-btn @click="loginPopup = true" color="accent lighten-1">LOG IN</v-btn>
                </v-col>
                <v-col cols="auto">
                  <v-btn @click="loginPopup = true" color="accent lighten-1" outlined>SIGN UP</v-btn>
                </v-col>
              </template>
              <!-- Search Bar -->
              <template v-else>
                <v-col cols="12" sm="6">
                  <BaseSearchBar
                    color="accent"
                    label="Enter Class Number"
                    :items="classesIDs"
                    @submit="classChosen"
                  ></BaseSearchBar>
                </v-col>
              </template>
            </v-row>
          </div>

          <!-- TUTORIAL -->
        </v-container>
      </v-card>

      <transition name="fade" mode="out-in">
        <v-container class="py-10">
          <div v-if="isFetchingUser || user === null" key="loading...">
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
          <div v-else key="class-list">
            <div class="enrolled-classes-header text-center mb-5">
              <h2>Your Classes</h2>
            </div>
            <v-row justify="space-around" align="stretch" class="enrolled-classes">
              <v-col
                cols="10"
                sm="4"
                md="3"
                v-for="(s, i) in user.enrolledClasses"
                :key="i"
                class="d-flex align-center"
              >
                <v-card
                  hover
                  @click="$router.push(`${i}/questions/`)"
                  class="text-center"
                  width="100%"
                >
                  <v-card-title>{{ s.name }}</v-card-title>
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
import BaseAppBar from "@/components/BaseAppBar.vue";
import BaseMenu from "@/components/BaseMenu.vue";
import BaseSearchBar from "@/components/BaseSearchBar.vue";
import BasePopup from "@/components/BasePopup.vue";
import PopupLogin from "@/components/PopupLogin.vue";
import PopupNewClass from "@/components/PopupNewClass.vue";
import { initEnrollementService } from "../dep";
import { encodeKey } from "../dep";

export default {
  components: {
    BaseAppBar,
    DoodleVideo,
    BaseSearchBar,
    PopupLogin,
    PopupNewClass,
    BaseMenu,
    BasePopup
  },
  computed: {
    ...mapState(["user", "isFetchingUser"])
  },
  data() {
    return {
      classes: [],
      classesNames: [],
      snackbar: false,
      snackbarMessage: "",
      enrollementService: initEnrollementService(),
      chosenClass: "",
      searchBarDialog: false,
      searchBarDialogOptions: ["No", "Yes"],
      // todo - let the popup button handle it itself
      newClassPopup: false,
      loginPopup: false
    };
  },
  created() {
    this.fetchClasses();
  },
  mounted() {
    this.logoVisibility();
    window.addEventListener("scroll", this.logoVisibility);
  },
  destroyed() {
    window.removeEventListener("scroll", this.logoVisibility);
  },
  methods: {
    startDemo() {
      this.$nextTick(async () => {
        const DoodleVideo1 = this.$refs.DoodleVideo1;
        const DoodleVideo2 = this.$refs.DoodleVideo2;
        const DoodleVideo3 = this.$refs.DoodleVideo3;
        await DoodleVideo1.quickplay();
        await DoodleVideo2.quickplay();
        DoodleVideo3.quickplay();
      });
    },
    fetchClasses() {
      this.classes = [];
      db.collection("classes")
        .get()
        .then(querySnapshot => {
          querySnapshot.forEach(doc => {
            let docObj = { ".key": doc.id, ...doc.data() };
            this.classes.push(docObj);
            this.classesNames.push(docObj.name);
          });
        });
    },
    classChosen(answer) {
      this.searchBarDialog = true;
      this.chosenClass = answer;
    },

    searchBarDialogSubmitted(answer) {
      if (answer == "No") {
        this.chosenClass = "";
        this.searchBarDialog = false;
        return;
      }
      this.enrollementService.addClass(this.user, this.chosenClass);
      this.chosenClass = "";
      this.searchBarDialog = false;
    },
    async createClass(name) {
      this.fetchClasses();
      if(name in this.classesNames)
      {
          console.log("Class Exists");
          return;
      }
      const ref = db.collection("classes");
      await ref.add({
        name,
        description: "description",
        introVideoID: "4zV1vCQE3CDAuZC8vtEw", // always initialize picture to Sun, Moon and Lake
        paragraph: "paragraph",
        tags: [],
        tabs: ["New"]
      });
      //add to enrolled classes
      this.fetchClasses();
    },
    quickplayVideo(i) {
      const videoElem = this.$refs[`doodle-video-${i}`][0];
      videoElem.quickplay();
    },
    saveParagraph(newValue, courseNumber) {
      const ref = db.collection("classes").doc(courseNumber);
      ref.update({
        paragraph: newValue
      });
    },
    computeVideoSize() {
      return this.$vuetify.breakpoint.smAndDown ? 12 : 4;
    },
    computeCardSize() {
      if (this.classes.length > 13) {
        if (this.$vuetify.breakpoint.md) return 4;
        else if (this.$vuetify.breakpoint.smAndDown) return 12;
      }
      return this.$vuetify.breakpoint.smAndDown ? 6 : 2;
    },
    async updateUser({ name, color }) {
      const ref = db.collection("users").doc(this.user.uid);
      ref.update({
        name
      });
    },
    signIn({ email, password }) {
      firebase
        .auth()
        .signInWithEmailAndPassword(email, password)
        .then(user => {
          this.$store.dispatch("handleUserLogic", user);
          this.snackbarMessage = `Welcome to ExplainMIT!`;
          this.snackbar = true;
          this.loginPopup = false;
        })
        .catch(error => {
          this.snackbarMessage = error.message;
          this.snackbar = true;
        });
    },
    createAccount({ email, password }) {
      firebase
        .auth()
        .createUserWithEmailAndPassword(email, password)
        .then(user => {
          this.snackbarMessage = `Welcome to ExplainMIT!`;
          this.snackbar = true;
          this.loginPopup = false;
        })
        .catch(error => {
          this.snackbarMessage = error.message;
          this.snackbar = true;
        });
    },
    signOut() {
      firebase.auth().signOut();
    },
    logoVisibility() {
      var hero_pos = document
        .querySelector(".central-title")
        .getBoundingClientRect().top;
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
#home-page .app-banner .home-logo {
  display: none;
}
#home-page.scrolled .app-banner .home-logo {
  display: unset;
}
@media (max-width: 400px) {
  .central-title h1 {
    font-size: 2.5em;
  }
}
.enrolled-classes .v-card__title {
  word-break: unset;
  justify-content: center;
  font-size: 1.1em;
}
</style>