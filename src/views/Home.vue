<template>
  <div>
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
      :text="chosenClass.name"
      @submit="payload => enrollInClass(payload)"
    >
      <v-btn color="green darken-1" text>
        NO
      </v-btn>
      <v-btn color="green darken-1" text @click="enrollInClass(chosenClass)">
        YES
      </v-btn>
    </BasePopup>

    <!-- APP BAR -->
    <BaseAppBar>
      <v-btn href="https://medium.com/@eltonlin1998/feynman-overview-338034dcb426" text color="secondary">
        BLOG
      </v-btn>
      <v-btn href="https://github.com/eltonlin1998/ExplainMIT" text color="secondary">
        GITHUB
      </v-btn>
      <template v-if="user && $route.path == '/'">
        <v-btn @click="newClassPopup = true" dark color="grey">CREATE CLASS</v-btn>
      </template>
      <template v-if="!isFetchingUser">
        <!-- PROFILE CIRCLE WITH DROPDOWN MENU -->
        <BaseMenu v-if="user" :user="user" @save="payload => updateUser(payload)" @sign-out="signOut()">
          <template v-slot:default="{ on }">
            <v-btn v-on="on" icon class="ml-4">
              <v-icon large :color="user.color">account_circle</v-icon>
            </v-btn>
          </template>
        </BaseMenu>
      </template>
    </BaseAppBar>

    <!-- MAIN CONTENT -->
    <v-content>
      <v-card class="mx-auto text-center" fluid>
        <div class="pt-5">
          <p class="display-2 text--primary">
            explain.mit.edu
          </p>
          <p class="headline text--primary">
            An efficient platform for visual explanations
          </p>
        </div>
        <div style="margin: auto" class="mb-5">
          <!-- previous button color was deep-purple accent-4 -->
          <template v-if="!user && !isFetchingUser">
            <v-btn @click="loginPopup = true" color="secondary" text>
              LOG IN
            </v-btn>
             <v-btn @click="loginPopup = true" color="secondary" text>
              SIGN UP
            </v-btn>
          </template>
        </div>
        <!-- SEARCH BAR -->
        <v-container v-if="user">
          <v-row justify="center">
            <v-col cols="6">
              <BaseSearchBar 
                :items="schoolClasses"
                @submit="payload => classChosen(payload)"
                color="accent"
                label="Enter Class Number"
              />
            </v-col>
          </v-row>
        </v-container>

        <v-divider></v-divider>
        <!-- TUTORIAL -->
        <v-container v-if="!user && !isFetchingUser" fluid class="py-0">
          <v-row justify="center" class="py-0">
            <v-col :cols="computeVideoSize()" class="py-0">
              <v-card>
                <v-card-subtitle class="black--text">Ask & answer questions with text and visuals</v-card-subtitle>
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
            <v-col :cols="computeVideoSize()" class="py-0">
              <v-card>
                <v-card-subtitle class="black--text">
                  Draw & talk on the real-time blackboard
                </v-card-subtitle>
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
            <v-col :cols="computeVideoSize()" class="py-0">
              <v-card>
                <v-card-subtitle class="black--text">
                  Save & reuse any blackboard explanations
                </v-card-subtitle>
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
        </v-container>
      </v-card>

      <!-- DISPLAY CLASSES -->
      <transition name="fade" mode="out-in">
        <div v-if="isFetchingUser || user === null" key="loading..."></div>
        <div v-else key="class-list">
          <v-container fluid>
            <v-row>
              <v-col v-for="enrolledClass in user.enrolledClasses" :key="enrolledClass.ID">
                  <v-card @click="$router.push(`${enrolledClass.ID}/questions/`)">
                      <v-card-title>{{ enrolledClass.name }}</v-card-title>
                  </v-card>
              </v-col>
            </v-row>
          </v-container>
        </div>
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
import helpers from "@/helpers.js";
import CONSTANTS from "@/CONSTANTS.js";

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
  data () {
    return {
      schoolClasses: [],
      snackbar: false,
      snackbarMessage: "",
      // TODO: let the popup handle its own state
      chosenClass: "",
      searchBarDialog: false,
      // TODO - let the popup button handle it itself
      newClassPopup: false,
      loginPopup: false,
    };
  },
  created () {
    this.fetchClasses();
  },
  methods: {
    startDemo () {
      this.$nextTick(async () => {
        const DoodleVideo1 = this.$refs.DoodleVideo1;
        const DoodleVideo2 = this.$refs.DoodleVideo2;
        const DoodleVideo3 = this.$refs.DoodleVideo3;
        await DoodleVideo1.quickplay()
        await DoodleVideo2.quickplay()
        DoodleVideo3.quickplay()
      })
    },
    async fetchClasses () {
      const ref = db.collection("classes");
      this.schoolClasses = await helpers.getCollectionFromDB(ref);
    },
    classChosen (answer) {
      this.searchBarDialog = true;
      this.chosenClass = answer;
    },
    enrollInClass ({ name, ".key": ID }) {
      const userRef = db.collection("users").doc(this.user.uid);  
      const classObj = {
        ID,
        name,
        notifFrequency: CONSTANTS.notifFrequencyEnum.ALWAYS
      }
      userRef.update({
        enrolledClasses: firebase.firestore.FieldValue.arrayUnion(classObj)
      });
      this.chosenClass = "";
      this.searchBarDialog = false;
    },
    async createClass (name) {
      const ref = db.collection("classes").doc(classID);
      await ref.set({
        name,
        description: "description",
        introVideoID: "4zV1vCQE3CDAuZC8vtEw", // always initialize picture to Sun, Moon and Lake
        paragraph: "paragraph",
        tagsPool: [],
        tabs: ["New"]
      });
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
    computeCardSize({ courseNumber }) {
      if (courseNumber.length > 13) {
        if (this.$vuetify.breakpoint.md) return 4;
        else if (this.$vuetify.breakpoint.smAndDown) return 12;
      }
      return this.$vuetify.breakpoint.smAndDown ? 6 : 2;
    },
     async updateUser ({ name, color }) {
      const ref = db.collection("users").doc(this.user.uid);
      ref.update({
        name
      });
    },
    signIn ({ email, password }) {
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
    createAccount ({ email, password }) {
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
    signOut () {
      firebase.auth().signOut();
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
</style>