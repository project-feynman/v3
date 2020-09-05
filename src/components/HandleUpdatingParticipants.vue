<template>
  <div>

  </div>
</template>

<script>
/**
 * CORRECTNESS ARGUMENT
 * 
 * Initial state: 
 *   - If the user successfully connected
 * 
 * Transitional States:
 *   - Switch to a different part of the app: destroyed () 
 *   - Disconnection: disconnect hook
 */
import db from "@/database.js";
import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/database";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import { mapState } from "vuex";

export default {
  computed: {
    ...mapState([
      "user",
      "session"
    ]),
    sessionID () {
      return this.session.currentID; 
    },
    classID () {
      return this.$route.params.class_id;
    },
    roomID () {
      return this.$route.params.room_id
    },
    classParticipantsRef () {
      return db.collection(`classes/${this.classID}/participants`);
    },
    firebaseRef () {
      return firebase.database().ref(`/class/${this.classID}/participants/${this.sessionID}`); 
    }
  },
  created () {
    // Part 1/2: Join the room 
    firebase.database().ref(".info/connected").on("value", async isUserConnected => {
      if (!isUserConnected.val()) {
        return;
      }  
      await this.classParticipantsRef.doc(this.sessionID).set({
        sessionID: this.sessionID,
        currentRoom: this.$route.params.room_id,
        roomTypeID: this.$route.params.section_id,
        ...this.user
      });
    });

    // Part 2/2: Set a disconnect room
    /**
     * Firebase will remove the user object if he/she disconnects for whatever reason.
     * 
     * @see https://explain.mit.edu/class/mDbUrvjy4pe8Q5s5wyoD/posts/2srLvmhGXPVtmgNyNeCH
     * @see https://firebase.google.com/docs/firestore/solutions/presence
     * @see https://firebase.google.com/docs/database/web/offline-capabilities
     */
    // ".info/connected" is a special location on Firebase Realtime Database 
    // that keeps track of whether the current client is conneceted or disconnected (see doc above)
    firebase.database().ref(".info/connected").on("value", async snapshot => {
      const isUserConnected = snapshot.val(); 
      if (isUserConnected === false) {
        return;
      } 
      // 1. User leaves, and his/her identity is saved to Firebase
      // 2. Cloud Functions detects the new user in Firebase, and uses that information to `arrayRemove` the user from the room
      await this.firebaseRef.onDisconnect().set({ uid: this.sessionID });

      //user hasn't always been fetched, but uid and email are set
      
      this.firebaseRef.set({ // Firebase will not detect change if it's set to an empty object
        email: "", 
        uid: "", 
        firstName: "" 
      });
    });
  },
  beforeDestroy () {
    // I switched to a different component and didn't disconnect, so clean up the info/connected listener
    firebase.database().ref(".info/connected").off();
    this.firebaseRef.onDisconnect().cancel();
    
    // now delete myself from Firestore
    this.classParticipantsRef.doc(this.sessionID).delete()
  }
}
</script>