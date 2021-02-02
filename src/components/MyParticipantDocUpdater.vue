<template>
  <!-- TODO: renderless -->
  <div>Hello World</div>
</template>

<script>
// Given a particular area, it syncs the current participant's metadata from Vuex as a `participants` document in Firestore 
// It syncs Vuex with Firestore
//
// Assumes the place-centric model: 
//   If the user is in a class, he/she must be on some particular board in some particular room in some particular area

// sessionID represents a unique browser tab running explain.mit.edu
// NOTE: for the disconnect hook pair, the sessionID does not suffice
// I will rename sessionID to browserTabID

// safety from concurrency: 
//   A unique pair of ID is created whenever the user creates a disconnect hook
import { mapState } from "vuex"; 
import { getRandomId } from "@/helpers.js"; 
import db from "@/database.js"; 
import firebase from "firebase/app";
import "firebase/database"; 
import "firebase/firestore"; 

export default {
  props: {
    // use props to avoid complicated timing-related issues and ensure modularity
    classID: {
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
      infoConnectedListener: null,
      wasDestroyedHookCalled: false
    };
  },
  computed:  {
    ...mapState([
      "user",
      "isAdmin",
      "browserTabID",
      "currentBoardNumber",
      "activeBoardID",
      "currentTool",
      "canHearAudio",
      "isMusicPlaying",
      "isViewingLibrary",
      "isViewingForum",
    ])
  },
  // DON'T introduce new API changes, because the visual forum is getting delayed.
  created () {
    console.log("CREATED ()");
    // step 1: set up a disconnect hook 
    firebase.database().ref(".info/connected").on("value", async (connectionState) => {
      if (connectionState.val() === true) {
        // create a unique ID
        const disconnectID = getRandomId(); 
        // initialize the proper firebase ref

        const snapshot = await this.myFirebaseRef.child("disconnectCounter").once("value"); 
        // Cloud Functions will detect this change and update Firestore accordingly
        await this.myFirebaseRef.onDisconnect().set({ 
          // Set disconnect hook is triggered by a counter the operation because the user can turn on/off the iPad repeatedly.
          disconnectCounter: (snapshot.val() ? snapshot.val() : 0) + 1 
        });
        await this.createMyFirestoreDoc(disconnectID);

        if (this.wasDestroyedHookCalled) this.cleanUpEverything();
      } 
    });
  },
  watch: {
    classID () { this.sync("currentClassID", this.classID) }, // handle this differently
    roomID () { this.sync("currentRoom", this.roomID) },
    currentBoardID () { this.sync("currentBoardID", this.currentBoardID) }, 
    currentBoardNumber () { this.sync("currentBoardNumber", this.currentBoardNumber) },
    currentTool () { this.sync("currentPenColor", this.currentTool.color) },

    canHearAudio () { this.sync("canHearAudio", this.canHearAudio) },
    isMusicPlaying () { this.sync("isMusicPlaying", this.isMusicPlaying) },
    isViewingLibrary () { this.sync("isViewingLibrary", this.isViewingLibrary) },
    isViewingForum () { this.sync("isViewingForum", this.isViewingForum) }
  },
  methods: {
    createMyFirestoreDoc (disconnectID) {
      const { section_id, class_id } = this.$route.params; 
      // create the object once, then update both Vuex and the Participant doc
      // must always guard against a disconnection throughout this component's entire lifecycle, 
      // and a unique ID will be generated for each connect/disconnect hook pair
      // TODO: draw a quick diagram
      this.myFirestoreRef = db.doc(`classes/${class_id}/participants/${disconnectID}`);

      this.myFirestoreRef.set({
        sessionID: this.browserTabID, // TODO: rename it, but backwards compatibility's sake keep the property name `sessionID` 
        firstName: this.user.firstName,
        lastName: this.user.lastName,
        email: this.user.email,
        uid: this.user.uid,
        isAdmin: this.isAdmin,

        roomTypeID: section_id,
        currentRoom: this.roomID,
        currentBoardID: this.currentBoardID,
        currentBoardNumber: this.currentBoardNumber,
        currentPenColor: this.currentTool.color,

        canHearAudio: this.canHearAudio, // TODO: rename to hasJoinedVideoCall
        isMusicPlaying: this.isMusicPlaying,
        isViewingLibrary: this.isViewingLibrary,
        isViewingForum: this.isViewingForum
      });
    },
    // syntax sugar for updating 
    sync (key, value) {
      const updatePayload = {};
      updatePayload[key] = value; 
      console.log("updatePayload =", updatePayload);
      this.myFirestoreRef.update(updatePayload);
    },
    cleanUpEverything () {
      // `.on()` and `.off()` are not asynchronous so no need for an if statement
      firebase.database().ref("info/connected").off(); 
      if (this.myFirestoreRef) this.myFirestoreRef.delete(); 
      if (this.myFirebaseRef.onDisconnect()) this.myFirebaseRef.onDisconnect().cancel(); 
    }
  },
  destroy () {
    // that means the user is no longer in any class, and is in the home page (as of Feb 2nd's version)
    // NOTE: tiny chance of concurrency issue
    this.wasDestroyedHookCalled = true; // sometimes destroy() is called before the initialization logic has even finished
    this.cleanUpEverything(); 
  }
};
</script>