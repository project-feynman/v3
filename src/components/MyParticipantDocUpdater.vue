<template>
  <div></div>
</template>

<script>
// Given a particular area, it syncs the current participant's metadata from Vuex as a `participants` document in Firestore.
// Assumes the place-centric model: If the user is in a class, he/she must be on some particular board in some particular room in some particular area

// browserTabID: uniquely identifies a "person" or "agent" who is using Explain, and is also used for video conferencing
// disconnectID: uniquely identifies a new participantDoc lifecycle. A single user can cause connect/disconnect with the same browser tab
// many times and cause concurrency havocs, so the disconnectID ensures each of these sessions are separate

// CONCURRENCY SAFETY: 
//   Create a correctness proof that covers all cases and explains the use of `disconnectID`, `wasDestroyedHookCalled`, props
//   Must always guard against a disconnection throughout this component's entire lifecycle, 
import { mapState, mapGetters } from "vuex"; 
import { getRandomId } from "@/helpers.js"; 
import db from "@/database.js"; 
import firebase from "firebase/app";
import "firebase/database"; 
import "firebase/firestore"; 

export default {
  props: {
    classID: {
      type: String,
      required: true
    },
    areaID: {
      type: String,
      required: true
    },
    roomID: {
      type: String,
      required: true 
    }
  },
  data () {
    return { 
      myFirebaseRef: null,
      myFirestoreRef: null,
      wasDestroyedHookCalled: false,
      isFirestoreDocCreated: false
    };
  },
  computed:  {
    ...mapState([
      "user", 
      "currentBoardNumber",
      "currentBoardID",
      "currentTool",
      "canHearAudio",
      "isMusicPlaying",
      "isViewingLibrary",
      "isViewingForum",
    ]),
    ...mapGetters([
      "isAdmin"
    ]),
    sessionID () {
      return this.$store.state.session.currentID; // rename to browserTabID
    }
  },
  // DON'T introduce new API changes, because the visual forum is getting delayed.
  // create a unique ID so the disconnect hook pairs will be independent from each other making it safe for concurrency 
  // NOTE: if the disconnect hook takes too long, the ghost will linger for that period of time but as long as it eventually happens then the code is correct and robust. 
  created () {
    firebase.database().ref(".info/connected").on("value", async (snapshot) => {
      if (snapshot.val() === true) {
        const disconnectID = getRandomId(); 
        
        this.myFirebaseRef = firebase.database().ref(`/class/${this.classID}/room/${this.roomID}/participants/${disconnectID}`);
        await this.myFirebaseRef.onDisconnect().set({
          hasDisconnected: true
        });

        this.myFirestoreRef = db.doc(`classes/${this.classID}/participants/${disconnectID}`);
        await this.myFirestoreRef.set({
          classID: this.classID,
          sessionID: this.sessionID, // TODO: rename it, but backwards compatibility's sake keep the property name `sessionID` 
          firstName: this.user.firstName,
          lastName: this.user.lastName,
          email: this.user.email,
          uid: this.user.uid,
          kind: this.user.kind || "",
          isAdmin: this.isAdmin,

          roomTypeID: this.areaID,
          currentRoom: this.roomID,
          currentBoardID: this.currentBoardID,
          currentBoardNumber: this.currentBoardNumber,
          currentPenColor: this.currentTool.color,

          canHearAudio: this.canHearAudio, // TODO: rename to hasJoinedVideoCall
          isMusicPlaying: this.isMusicPlaying,
          isViewingLibrary: this.isViewingLibrary,
          isViewingForum: this.isViewingForum
        });
        this.isFirestoreDocCreated = true; 

        if (this.wasDestroyedHookCalled) this.cleanUpEverything();
      } 
    });
  },
  watch: {
    "user.firstName" () { this.throttledSync() }, // e.g so you don't show up as anonymous after signing up
    classID () { this.throttledSync() }, // handle this differently
    areaID () { this.throttledSync() },
    roomID () { this.throttledSync() },
    currentBoardID () { this.throttledSync() }, 
    currentBoardNumber () { this.throttledSync() },
    currentTool () { this.throttledSync() },

    canHearAudio () { this.throttledSync() },
    isMusicPlaying () { this.throttledSync() },
    isViewingLibrary () { this.throttledSync() },
    isViewingForum () { this.throttledSync() }
  },
  destroyed () {
    // that means the user is no longer in any class, and is in the home page (as of current version)
    this.wasDestroyedHookCalled = true; // sometimes destroy() is called before the initialization logic has even finished
    this.cleanUpEverything(); 
  },
  methods: {
    // e.g. within 500 milliseconds, it can be called at most twice (one on the 0th second, then, everything else is ignored the next on the 500th millisecond)
    // if 1st is on 0, and 2nd is 200, the 2nd will be deferred to the 500th millisecond if there is no third
    throttledSync: _.debounce(
      function () { this.sync(); }, // without function () {}, `this.searchDatabase()` will be undefined
      100 // milliseconds
    ),
    sync () {
      if (this.isFirestoreDocCreated) {
        this.myFirestoreRef.update({
          classID: this.classID,
          sessionID: this.sessionID, // TODO: rename it, but backwards compatibility's sake keep the property name `sessionID` 
          firstName: this.user.firstName,
          lastName: this.user.lastName,
          email: this.user.email,
          uid: this.user.uid,
          isAdmin: this.isAdmin,

          roomTypeID: this.areaID,
          currentRoom: this.roomID,
          currentBoardID: this.currentBoardID,
          currentBoardNumber: this.currentBoardNumber,
          currentPenColor: this.currentTool.color,

          canHearAudio: this.canHearAudio, // TODO: rename to hasJoinedVideoCall
          isMusicPlaying: this.isMusicPlaying,
          isViewingLibrary: this.isViewingLibrary,
          isViewingForum: this.isViewingForum
        });
      }
    },
    cleanUpEverything () {
      firebase.database().ref("info/connected").off(); // `.on()` and `.off()` are not asynchronous, so no need for an if statement
      if (this.isFirestoreDocCreated) this.myFirestoreRef.delete(); 
      if (this.myFirebaseRef.onDisconnect()) this.myFirebaseRef.onDisconnect().cancel(); 
    }
  }
};
</script>