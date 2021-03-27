<template>
  <v-app>    
    <ClassPageLayout v-if="user && classID && areaID && tableID"
      :classID="classID"
      :areaID="areaID"
      :tableID="tableID"
      :key="'force-rerender-if-class-id-changes' + classID"
    /> 

    <!-- Camera/Mic permission errors -->
    <VideoTroubleshootPopup v-model="isShowingVideoTroubleshootPopup"/> 

    <!-- General errors  -->
    <div class="text-center">
      <v-dialog v-model="isShowingGeneralErrorPopup" width="500">
        <v-card>
          <v-card-title class="headline">
            An unusual error occured
          </v-card-title>
          <v-card-text>
            <p>{{ feedbackForUser }}<p>

            <p class="mb-0">Try quick-fixes:</p>
            <ol>
              <li>Reload the page</li> 
              <li>Close the page entirely, then open a new one</li> 
              <li>Ensure you use iPad Safari or desktop Chrome</li>
            </ol>

            <br>

            <p class="mb-0">If problems remain, try the general fixes</p> 
            <ol>
              <li>For iPads,
                <a href="https://osxdaily.com/2017/09/28/how-force-quit-apps-ipad-ios-11/" target="_blank">
                  force quit Safari
                </a>
              </li>
              <li>
                For computers,
                <a href="https://support.google.com/accounts/answer/32050?co=GENIE.Platform%3DDesktop&hl=en" target="_blank">
                  clear cookies and cache on Chrome
                </a>
                and read 
                <a href="https://help.daily.co/en/articles/2303117-top-troubleshooting-tips" target="_blank">
                  5 tips that solve 99% of issues
                </a>
              </li>
              <li>Restart your computer / iPad</li>
              <li>Email <a href="mailto: eltonlin@mit.edu">eltonlin@mit.edu</a></li>
            </ol>
          </v-card-text>
          <v-card-actions>
            <v-spacer/>
            <v-btn text @click="isShowingGeneralErrorPopup = false">
              OK
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>

    <v-snackbar v-model="snackbar" timeout="2500">
      {{ snackbarMessage }}
      <template v-slot:action>
        <v-btn @click="snackbar = false" text>CLOSE</v-btn>
      </template>
    </v-snackbar>

    <!-- <template v-if="user">
      <v-snackbar v-if="user.email" v-model="musicSnackbar" timeout="5000">
        Play music from Maplestory?
        <v-btn @click="playBackgroundMusic(); musicSnackbar = false;" text color="cyan">YES </v-btn>
        <v-btn @click="musicSnackbar = false;" text>NO</v-btn>
      </v-snackbar>
    </template> -->
  </v-app>
</template>

<script>
import firebase from "firebase/app"; 
import "firebase/storage"; 
import "firebase/auth"; 
import { getRandomId } from "@/helpers.js"; 
import _ from "lodash"; 
import VideoTroubleshootPopup from "@/components/VideoTroubleshootPopup.vue"; 
import ClassPageLayout from "@/pages/ClassPageLayout.vue"; 
import AuthHelpers from "@/mixins/AuthHelpers.js"; 
import { mapState } from "vuex"; 

// To get realtime support, visit https://www.daily.co/contact/support
// Helpful gist: https://gist.github.com/kwindla/9fd662a83e190e6dd003869282ff0d99

const PARTICIPANT_EVENTS = ["participant-joined", "participant-updated", "participant-left"]; 

export default {
  mixins: [
    AuthHelpers
  ],
  components: {
    AuthHelpers,
    VideoTroubleshootPopup,
    ClassPageLayout
  },
  data: () => ({
    snackbar: false,
    snackbarMessage: "",

    musicSnackbar: true,
    musicAudioElement: null,

    // Daily Video Conference API 
    firestoreIDToDailyID: {},
    isShowingVideoTroubleshootPopup: false,
    isShowingGeneralErrorPopup: false,
    feedbackForUser: ""
  }),
  computed: {
    ...mapState([
      "user",
      "CallObject",
      "participants",
      "isViewingForum"
    ]),
    sessionID () { return this.$store.state.session.currentID },
    classID () { return this.$route.params.class_id; },
    areaID () { return this.$route.params.section_id; },
    tableID () {return this.$route.params.room_id; }
  },
  async created () {
    /** 
      * USER AUTHENTICATION
      * 
      * Only use `onAuthStateChanged` for getting the INITIAL authentication state of the user, so that
      * it's unnecessary to deal with edge cases related to intermediate states.
      * 
      * Don't use it as callbacks because of concurrency issues between onAuthStateChanged() versus versus the callbacks of `signInWithPopup` firing 
      * in different sequences according to slow internet. Even if it fires in the same sequence, there are too many dependent operations 
      * that zigzag between the two such as creating a mirror document. 
      * 
      * That's why we remove the listener once it has done its job. 
      * 
      * `user === null` unhelpfully can both mean the user is not logged in or hasn't been initialized
    **/
    this.unsubscribeAuthListener = firebase.auth().onAuthStateChanged(async (user) => {
      // console.log("authStateChanged, user =", user); 
      if (!user) {
        await firebase.auth().signInAnonymously(); 
        this.initializeTutorialDemo();
        // console.log("user is not logged in", this.unsubscribeAuthListener);
        this.unsubscribeAuthListener(); 
      }
      
      else if (user.isAnonymous) {
        this.initializeTutorialDemo(); 
        // console.log("user is anonymous =");
        this.unsubscribeAuthListener(); 
      } 

      else if (user && !user.isAnonymous) {
        await this.$store.dispatch("listenToUserDoc", { uid: user.uid });
        this.$store.commit("SET_HAS_FETCHED_USER_INFO", true); 
        // redirect to most recent class
        const { class_id, section_id, room_id, question_id } = this.$route.params; 
        // check if the user should be redirected to the visual forum via <RedirectToForumQuestion/>
        if (question_id) {
          const { classID } = this; 
          this.$router.push(`/class/${classID}/section/${classID}/room/${classID}`); 
          this.$store.commit("SET_IS_VIEWING_FORUM", true);
          this.$store.commit("SET_CURRENTLY_SELECTED_QUESTION_ID", question_id);
        }
        else if (!(class_id && section_id && room_id)) {
          const { mostRecentClassID } = this.$store.state.user; 
          this.$router.replace(`/class/${mostRecentClassID}/section/${mostRecentClassID}/room/${mostRecentClassID}`);
        }

        // console.log("user is signed in, will unsubscribe");
        this.unsubscribeAuthListener(); 
      }

      else {
        // intermediate state, don't unsubscribeAuthListener() yet 
      }
    });

    // initialize CallObject (consumed by VideoConferenceRoom) lightweight is very important for MIT instructors
    // this.CallObject.setBandwidth({
    //   kbs: 30,
    //   trackConstraints: { width: 320, height: 180, frameRate: 25 }
    // });

    // initialize event listeners (documentation: https://docs.daily.co/reference#events)
    const ONE_HUNDRED_MILLISECONDS = 100; 
    for (const event of PARTICIPANT_EVENTS) {
      this.CallObject.on(
        event, 
        _.throttle(this.maintainParticipantsCorrectness, ONE_HUNDRED_MILLISECONDS) 
      ); 
    }
    this.CallObject.on("track-started", this.mountNewTrack);
    this.CallObject.on("track-stopped", this.unmountTrack);
    this.CallObject.on("active-speaker-change", ({ activeSpeaker }) => {
      this.$store.commit("SET_ACTIVE_SPEAKER_DAILY_ID", activeSpeaker.peerId);
    });

    // handle specifically because it's common for users to use Zoom 
    this.CallObject.on("camera-error", (payload) => {
      this.isShowingVideoTroubleshootPopup = true; 
      console.error(payload); 
      console.log("CallObject state =", this.CallObject.meetingState()); 
    });

    // general errors
    this.CallObject.on("load-attempt-failed", ({ action, errorMsg }) => {
      this.isShowingGeneralErrorPopup = true; 
      this.feedbackForUser = action + ": " + errorMsg; 
    }); 
    this.CallObject.on("error", ({ action, errorMsg }) => {
      this.isShowingGeneralErrorPopup = true; 
      this.feedbackForUser = action + ": " + errorMsg; 
    });
    
    // TODO: refactor
    this.$root.$on("error-joining-conference-room", (error) => {
      this.isShowingGeneralErrorPopup = true; 
      this.feedbackForUser = error.message; 
      console.error(error); 
    });

    this.$root.$on("show-snackbar", (message) => {
      this.snackbar = true;
      this.snackbarMessage = message;
    });
  },
  methods: {
    initializeTutorialDemo () {
      const exampleClassID = "lvzQqyZIV1wjwYnRV9hn";
      const exampleClass = {
        id: exampleClassID,
        name: "0.000", 
        description: "For new users to explore"
      };

      this.$store.commit("SET_USER", {
        uid: getRandomId(),
        firstName: "Beaver",
        lastName: `${Math.floor(Math.random() * 90 + 10)}`, // e.g. Beaver 27,
        email: "", // empty string to distinguish it from signed in accounts
        enrolledClasses: [exampleClass],
        emailOnNewQuestion: [],
        emailOnNewReply: [],
        penColors: ["#B8F2F9", "#F69637", "#A9F8BD", "#6EE2EA"]
      });

      this.$store.commit("SET_IS_VIEWING_LIBRARY", true);
      const tutorialPostID = "SX3chANZirfspySFxAqD"; // "nG8VBZg4QanbSkKjPuCX"; // "aJWnGgnWMWjRGQzNSq3n"
      this.$store.commit("SET_CURRENTLY_SELECTED_LIBRARY_POST_ID", tutorialPostID);

      // redirect to 0.000
      const { class_id, section_id, room_id } = this.$route.params; 
      if (!(class_id && section_id && room_id)) {
        this.$router.replace(`/class/${exampleClassID}/section/${exampleClassID}/room/${exampleClassID}`);
      }
    },
    playBackgroundMusic () {
      this.$store.state.musicAudioElement.play(); 
      this.$store.commit("SET_IS_MUSIC_PLAYING", true);
    },
    maintainParticipantsCorrectness () {
      this.$store.commit("SET_PARTICIPANTS", { ...this.CallObject.participants() }); 
      this.$store.commit("SET_FIRESTORE_ID_TO_DAILY_ID", {});
      const temp = {}; 
      for (const participant of Object.values(this.participants)) {
        const { user_name, user_id } = participant; 
        // check if it Firestore participant.sessionID is binded to the Daily user_name
        if (user_name) {
          temp[user_name] = user_id; 
        }
      }
      this.$store.commit("SET_FIRESTORE_ID_TO_DAILY_ID", temp)
    },
    async mountNewTrack ({ track, participant }) {
      switch (track.kind) {
        case "video": 
          const v = document.createElement("video"); 
          v.srcObject = new MediaStream([track]);
          v.setAttribute("id", track.id);
          v.setAttribute("muted", true); 
          v.setAttribute("autoplay", true); 
          v.setAttribute("playsinline", true); // without it, iOS forces video to play in fullscreen
          v.style.width = "100%"; 
          v.setAttribute("z-index", 2); // not great
          
          if (this.isScreenTrack(track, participant)) {
            document.getElementById("screenshare-container").appendChild(v); 
          } 
          else if (! participant.user_name) {  
            // handles edge case that when joining initially, user_name is not populated by Daily API
            // user_name maps to sessionID
            v.classList.add("mirror-flip");
            document.getElementById("my-local-video").appendChild(v); 
          } 
          else if (participant.user_name === this.sessionID) { // TODO: refactor. Handles the case where I re-share my camera, but now my user_name is defined
            v.classList.add("mirror-flip");
            document.getElementById("my-local-video").appendChild(v); 
          } 
          else { 
            document.getElementById(participant.user_name).appendChild(v);
          }
          break; 

        case "audio": 
          if (participant.local) return; 
          else {
            const audioElement = document.createElement("audio"); 
            audioElement.srcObject = new MediaStream([track]); 
            audioElement.setAttribute("id", "audio" + participant.user_id); 
            audioElement.setAttribute("playsinline", true); 
            audioElement.setAttribute("autoplay", true); 

            document.getElementById("container-for-audio-elements").appendChild(audioElement);
          }
          break;
      }
    },
    async unmountTrack ({ track, participant }) {
      const trackElement = document.getElementById(track.id); 
      if (trackElement) { // sometimes the trackElement unexpectedly doesn't exist, though the error is harmless
        trackElement.srcObject = null; 
        trackElement.remove(); 
      }
    },
    isScreenTrack (track, participant) {
      if (participant) if (participant.screen && participant.screenVideoTrack.id === track.id) return true; 
      // screen:0:0
      // window:263938:1
      // web-contents-media-stream://556:4
      return ["screen", "window"].includes(track.label.substring(0, 6));
    }
  }
}
</script>

<style>
/* Fixes snackbar not visible on iOS Safari, see https://github.com/vuetifyjs/vuetify/issues/11781#issuecomment-655689025 */
div.v-snack:not(.v-snack--absolute) {
  height: 100%;
}

/* .v-input__prepend-outer {
  margin-right: 1px !important;
} */

/* Override v-switch CSS to make them more compact */
.v-application--is-ltr .v-input__prepend-outer {
  margin-right: 1px !important;
}

.v-application--is-ltr .v-input--selection-controls__input {
  margin-right: 0px !important;
}

.v-input__append-outer .v-icon, .v-input__prepend-outer .v-icon {
  font-size: 18px !important;
}

/* For the hint text under touch draw */
.v-input__control .v-messages {
  font-size: 8px !important; 
  color: white !important;
}

.mirror-flip
{
  transform: rotateY(180deg);
  -webkit-transform:rotateY(180deg); /* Safari and Chrome */
  -moz-transform:rotateY(180deg); /* Firefox */
}

/* Global styles */
/* What does this do? */
a {
  text-decoration: none;
}
/*
::-webkit-scrollbar {
    width: 12px;
}
::-webkit-scrollbar-track {
    -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.3); 
    border-radius: 10px;
    background-color: rgba(0,0,0,0.15);
}
 
::-webkit-scrollbar-thumb {
    border-radius: 10px;
    -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.5); 
    background-color: orange;
}*/
</style>