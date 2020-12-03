<template>
  <div>

  </div>
</template>

<script>
/**
 * CORRECTNESS ARGUMENT
 * 
 * EVERY POSSIBLE USER JOIN/LEAVE OPERATIONS PAIRS:  
 *   1. Go to home page, then enter room / Go to other parts of the website
 *   2. Visit room with URL directly / exit website completely 
 *   3. Reload the page 
 *   4. Turn on iPad screen / turn off screen 
 *   5. [SPECIAL CASE] Go to home screen
 * 
 * BUT FROM CODE'S PERSPECTIVE, THERE AER ONLY TWO CASES: 
 *   Case 1: User joins room
 *      case 1a Directed via URL:
 *          The `created ()` hook will handle the joining
 *      case 1b: 
 *          Re-established connection (turn on iPad screen): info.connected("/") will handle the joining 
 * 
 *   Case 2: User exists room:
 *      case 2a Exit entirely: 
 *          Disconnect hook will be triggered 
 *      case 2b Still within app
 *          Destroyed hook will trigger 
 * 
 * HOWEVER, NEED SAFETY FROM CONCURRENCY ARGUMENTs:
 *    Case 1: sometimes created () will resolve fully before destroy () is called 
 *         - We use a boolean flag (hasDestroyedHook been called) to manually cleanup in case created () resolved when beforeDestroyed was called too early
 *    Case 2: sometimes $route.params._id mutates before the component is destroyed
 *         - The current workaround is with props i.e. this.roomID, where at least currently, Vue.js will destroy the component before the prop change propagates. 
 *    Case 3: interleaving of database operations from different components: 
 *         - Each instance of <HandleUpdatingParticipants/> act on separate, independent locations of Firebase because we use ID = roomID + sessionID. 
 *              - Reloading will result in a new sessionID. 
 *              - Different rooms will result in different sessionIDs
 *              - iPad shenanigans will be handled by a single instance
 */
import db from "@/database.js";
import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/database";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import { mapState } from "vuex";

export default {
  props: {
    roomID: {
      type: String,
      required: true
    },
    classID: {
      type: String,
      required: true
    },
    currentBoardNumber: {
      type: Number,
      required: true
    }
  },
  data () {
    return {
      wasDestroyedHookCalledAlready: false,
      infoConnectedListener: null
    };
  },
  computed: {
    ...mapState([
      "user",
      "session",
      "canHearAudio",
      "isMusicPlaying",
      "isViewingLibrary"
    ]),
    sessionID () {
      return this.session.currentID; 
    },
    participantsRef () {
      return db.collection(`classes/${this.classID}/participants`);
    },
    myFirestoreRef () {
      return this.participantsRef.doc(this.sessionID + this.roomID);
    },
    myFirebaseRef () {
      return firebase.database().ref(`/class/${this.classID}/room/${this.roomID}/participants/${this.sessionID}`); 
    }
  },
  watch: {
    currentBoardNumber () {
      this.updateParticipantDoc();
    },
    canHearAudio () {
      this.updateParticipantDoc(); 
    },
    isMusicPlaying () {
      this.updateParticipantDoc(); 
    },
    isViewingLibrary () {
      this.updateParticipantDoc(); 
    }
  },
  async created () {
    this.infoConnectedListener = firebase.database().ref(".info/connected").on("value", async (connectionState) => {
      if (connectionState.val() === true) {
        await Promise.all([
          this.updateParticipantDoc(), 
          this.myFirebaseRef.child("disconnectCounter").once("value").then(async (snapshot) => {
            const disconnectCounter = snapshot.val() ? snapshot.val() : 0; 
            await this.myFirebaseRef.onDisconnect().set({ 
              // Set disconnect hook is triggered by a counter the operation because the user can turn on/off the iPad repeatedly.
              // Cloud Functions will detect this change and update Firestore accordingly
              disconnectCounter: disconnectCounter + 1 
            });
          })
        ]);
    
        // [CONCURRENCY] sometimes, the user leaves the room before created () has finished resolving all its promises, 
        // therefore beforeDestroy() was called already but didn't do anything. 
        if (this.wasDestroyedHookCalledAlready) {
          this.cleanUpEverything(); 
        }
      } 
    });
  },
  beforeDestroy () {
    this.wasDestroyedHookCalledAlready = true; 
    this.cleanUpEverything(); 
  },
  methods: {
    updateParticipantDoc () {
      return new Promise(async (resolve) => {
        await this.myFirestoreRef.set({
          sessionID: this.sessionID,
          currentRoom: this.roomID,
          currentBoardNumber: this.currentBoardNumber,
          roomTypeID: this.$route.params.section_id,
          firstName: this.user.firstName,
          lastName: this.user.lastName,
          email: this.user.email,
          uid: this.user.uid,
          canHearAudio: this.canHearAudio,
          isMusicPlaying: this.isMusicPlaying,
          isViewingLibrary: this.isViewingLibrary
        });
        resolve();
      });
    },
    cleanUpEverything () {
      try {
        Promise.all([
          firebase.database().ref("info/connected").off("value", this.infoConnectedListener), 
          this.myFirebaseRef.onDisconnect().cancel(), // still correct without it because it'd simply fail to delete an empty document, but saves bandwidth and is "more correct"
          this.myFirestoreRef.delete()
        ]); 
      } catch (error) {
        this.$root.$emit("show-snackbar", "Error handling user leaving, see console.")
      }
    }
  }
}
</script>