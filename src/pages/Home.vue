<template>
  <v-main>
      <v-card v-if="!isFetchingUser" fluid class="mx-auto" elevation="0" tile>
        <v-container class="py-5">
          <div class="central-title d-flex justify-center align-center my-4">
            <img src="/logo.png" class="mt-5">
            <div>
              <h1 class="text--primary ml-5">
                explain.mit.edu
              </h1>
              <h3 class="headline font-weight-normal ml-5" style="opacity: 70%">
                A warm, electrifying place where everybody helps each other
              </h3>
            </div>
          </div>
          
          <!-- Log in / Sign up -->
          <v-row class="my-5 pt-2" justify="center">
            <template v-if="user">
              <!-- Do NOT split the URL to multiple lines, it will be interpreted as %20%20%20...etc -->
              <v-btn @click="$router.push(`class/${user.mostRecentClassID || 'lvzQqyZIV1wjwYnRV9hn'}/section/${user.mostRecentClassID || 'lvzQqyZIV1wjwYnRV9hn'}`)" 
                large class="mr-5 green darken-1 white--text"
              >
                <v-icon class="mr-2">mdi-emoticon-wink-outline</v-icon>
                GO TO CLASS
              </v-btn>

              <v-btn large class="grey darken-1 white--text mx-5">
                <v-icon class="mr-2">mdi-gitlab</v-icon>
                <a target="_blank" href="https://github.com/project-feynman/explain-mit" class="white--text">GITHUB</a>
              </v-btn>

              <v-btn large @click="$_signOut()" class="mx-5 grey darken-1 white--text">
                <v-icon class="mr-2">mdi-logout</v-icon>
                SIGN OUT
              </v-btn>          
            </template>
          
            <template v-else>
              <v-btn @click="$_logInWithTouchstone()" large class="green darken-1 white--text mx-5">
                <v-icon class="mr-2">mdi-school</v-icon>
                LOG IN WITH TOUCHSTONE
              </v-btn>

              <v-btn large class="grey darken-1 white--text mx-5">
                <v-icon class="mr-2">mdi-gitlab</v-icon>
                <a target="_blank" href="https://github.com/project-feynman/explain-mit" class="white--text">GITHUB</a>
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
            </template>
          </v-row>
        </v-container>
      </v-card>
    
    <!-- TODO: <HomeNextUpdateCountdownTimer/> -->
      <v-card elevation="5">
        <!-- color="accent" makes the slider indicator orange -->
        <v-tabs vertical touchless color="accent" class="ml-1">
          <!-- active-class="accent--text" makes the current tab's title go orange -->
          <v-tab>
            Updates
          </v-tab>
          <v-tab active-class="accent--text">
            Mission
          </v-tab>
          <v-tab>
            <!-- Introduces how to use -->
            Phase I
          </v-tab>
          <!-- <v-tab>
            News
          </v-tab> -->
          <!-- <v-tab>
            Art of the day
          </v-tab> -->

          <!-- items here -->
          <v-tab-item>
            <v-card>
              <v-card-title>
                Thanksgiving Update
              </v-card-title>

              <v-card-subtitle class="subtitle-1 font-weight-medium">
                <b>For finals, everybody can study together at random times in the <i>Open Area</i></b>
                <div>[Quick reminder] if there's no audio, either reload the page, or close the browser tab completely and come back.</div>
              </v-card-subtitle>

              <v-card-text>
                Explain is now place-centric, which means you're always <u>somewhere</u>, even if you're just studying solo, relaxing to music or viewing the library. 
                Every class also now has an open area, a centralized place for everybody to study and have fun. I was inspired by some unknown research that, apparently, the <u>mere presence</u> of other people positively improves our psychological state. 
                (which was yet another reason to fix the ghost participants issue. Lastly, every room's URL can be directly copied and pasted as a "meeting URL" for scheduled events.                
              </v-card-text>

              <!-- <v-card-text>
                For the past semester, I've focused Explain and making it good for problem-solving sessions. 
                While it has stabilized (with exception to the ghost participants issue), I forgot the original mission of Explain,
                to create a place where people can find study partners serendipitously. 

                <br><br>

                Now, finals is coming up, and I realize there are no more psets, so I came to this realization too late. Nevertheless,
                the Thanksgiving Update is about enjoying school. I no longer have to do finals as a class of 2020, so that will be you guys' problems, and not mine : )
                But I think it's important to be optimistic and know that there are always extremely serious things to have to worry about, but the best course of action is to 
                not remain in a stressed response (which is like using over-drive as your normal default behavior). You truly want to go into over-drive only for sparringly. 

                <br><br>

                "If you enjoyed wasting your time, then it wasn't a waste of time." I added some music, to relax things up again. It's from my absolute favorite game soundtracks called Maplestory. 

                <br><br>

                Why does this update make it easier for everyone to hang out? Because now, there isn't voids. Explain is now place-centric, a fancy way of saying, you can't not be somewhere. You're always in a room (with exception to when you're in the home page).
                Therefore, the chances of colliding wit other people in the same room becomes way more likely. I have also opened up the spaces, so they no longer feel private and closed offs. I saw a research where, apparently, 
                the mere presence of other people or crowds on the streets positively improves our psychological state. And that's really a big influence behind the design of Explain - you have awareness of each other in different rooms, such that 
                even if you are not interacting, you know of the mere presence of each other. 

                <br><br>

                If you're in a room, unlike in Discord, you don't have to have the pressure to talk in a voice channel. You can just be aware of each other but work independently, simulate a message chat by writing on the blackboard or drawing. 
                Now, there is a problem with rooms, which is, it's very hard to get started. If there is nobody in a room, then people will leave. So there could be 100 people going into the same room, but all at different times, but they will never interact or meet. 
                The way to circumvent that is to introduce reasons to stay in the room even if you are solo. First, if you work on the blackboards in the rooms, other people can easily see what you have done. While that's not great for plagiarism, it's useful in certain situations. 
                Moreover, you can visit the library and watch videos, so many people can stay in the room and watch videos independently, and stay in the room. You can also listen to music, and eventually there will be a visual forum. 

                <br><br>

                In other words, I'm introducing as many reasons for people to stay in the rooms, and the longer they stay, the more chances for collision, which means more interactions, more content outpt, and the library and forum becomes even richer. This leads to a positive spiral and 
                Explain becomes a truly vibrant place. That's the vision. Happy studying.
              </v-card-text> -->
            </v-card>
          </v-tab-item>

          <v-tab-item>
            <v-card>
              <v-card-title>Introduction</v-card-title>
              <v-card-text style="font-size: 0.95rem;">
                <p>
                  Explain is an experimental website with blackboard rooms handcrafted for MIT classes:
                </p>
                <ul>
                  <li><b>Phase I (2020):</b> Create a place where students can study together serendipitously</li>
                  <li><b>Phase II (2021):</b> Enable video explanations to be easily created, shared and organized</li>
                  <li><b>Phase III (2022):</b> Accelerate the world's transition into open learning</li>
                </ul>
              </v-card-text>
            </v-card>
            <ExplanationDisplay v-if="demoVideo2" :expl="demoVideo2" :hasDate="false"/>
          </v-tab-item>

          <v-tab-item>
            <ExplanationDisplay v-if="demoVideo" :expl="demoVideo" :hasDate="false"/>
          </v-tab-item>
   
    
          <!-- TODO: <HomeNextUpdateCountdownTimer/> -->
          <!-- <v-tab-item>
            <v-card height="600">
              <v-card-title>News</v-card-title>
              <v-card-text style="font-size: 0.95rem;">
                <ul>
                  <li><b>Update</b>: The next major update is scheduled for December 1st</li>
                  <li><b>Internship</b>: If you want to change education together, email eltonlin@mit.edu</li>
                  <li><b>Users</b>: Explain currently serves ~800 weekly active users in 8.01, ESG classes and 18.01</li>
                  <li><b>Startup</b>: Explain has advanced to the interview round with Y-Combinator</li>
                  <li><b>IAP 2021</b>: I'm holding a web dev course called: "Lightweight Fullstack".
                    The goal is to teach fundamental concepts and modern frameworks with simple and visual explanations (more details coming soon).
                  </li>
                </ul>
              </v-card-text>
            </v-card>
          </v-tab-item> -->
          <v-tab-item>
            For the life of me I cannot figure out why the ghost participants problem still remains, and I'm hoping 
            to get second pair of eyes to take a look at my correctness argument.

            Explain currently bleeds around $1k per month because of Twilio's video conferencing API it uses. 
            By switching to Jitsi, an open-source alternative, the cost would become $30/month, a 3000% reduction. 
            Previously, the switch to lib-jitsi-meet, to ensure the longevity, a major update will come and I'm working on
            lib-jitsi-vue and testing it. 

            Sometimes, swiping left / right on the screen triggers the Safari to go back a page. 
            It's possible to disable the behavior, try "Prevent swiping left to go back page Safari".
          </v-tab-item>
        </v-tabs>
      </v-card>
  </v-main>
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
import HomeNextUpdateCountdownTimer from "@/components/HomeNextUpdateCountdownTimer.vue"; 
import HomeUserGrowthMoneyBurnGraph from "@/components/HomeUserGrowthMoneyBurnGraph.vue";

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
    HomeNextUpdateCountdownTimer,
    HomeUserGrowthMoneyBurnGraph
  },
  mixins: [
    AuthHelpers,
    DatabaseHelpersMixin
  ],
  data () {
    return {
      model: "",
      
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
