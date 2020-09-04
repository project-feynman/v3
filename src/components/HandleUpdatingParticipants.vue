<template>
  <div>

  </div>
</template>

<script>
/**
 * There is only one way for the user to join. 
 * There are 2 ways for the user to disconnect:
 *   - Switching away 
 *   - Disconnecting
 */
import db from "@/database.js";
import firebase from "firebase/app";
import "firebase/firestore";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import { DefaultEmailSettings } from "@/CONSTANTS.js";
import { mapState } from "vuex";

export default {
  computed: {
    ...mapState([
      "user",
      "session"
    ]),
    classID () {
      return this.$route.params.class_id; 
    },
    roomID () {
      return this.$route.params.room_id; 
    }, 
    sessionID () {
      return this.session.currentID; 
    },
    classParticipantsRef () {
      return db.collection(`classes/${this.classID}/participants`);
    },
    firebaseRef () {
      return firebase.database().ref(`/class/${this.classID}/participants/${this.sessionID}`);
    }
  },
  created () {
    this.setParticipant(); 
    this.setUserDisconnectHook(); 
  },
  beforeDestroy () {
    // I switched to a different component and didn't disconnect, so clean up the info/connected listener
    firebase.database().ref(".info/connected").off();
    this.firebaseRef.onDisconnect().cancel();
    
    // now delete myself from Firestore
    this.classParticipantsRef.doc(this.sessionID).delete()
  },
  methods: {
    /**
     * Push the user object onto the room's `participants` array, and ensures that 
     * Firebase will remove the user object if he/she disconnects for whatever reason.
     * 
     * @see https://explain.mit.edu/class/mDbUrvjy4pe8Q5s5wyoD/posts/2srLvmhGXPVtmgNyNeCH
     * @see https://firebase.google.com/docs/firestore/solutions/presence
     * @see https://firebase.google.com/docs/database/web/offline-capabilities
     */
    setUserDisconnectHook () {
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
    async setParticipant () {
      firebase.database().ref(".info/connected").on("value", async snapshot => {
        const isUserConnected = snapshot.val(); 
        if (isUserConnected === false) {
          return;
        }  
        await this.classParticipantsRef.doc(this.sessionID).set({
          sessionID: this.sessionID,
          uid: this.user.uid,
          currentRoom: this.$route.params.room_id,
          roomTypeID: this.$route.params.section_id,
          email: this.user.email,
          firstName: this.user.firstName,
          lastName: this.user.lastName
        });
      });
    }
  }
}
</script>