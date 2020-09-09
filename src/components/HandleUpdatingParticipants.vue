<template>
  <div>

  </div>
</template>

<script>
/**
<<<<<<< HEAD
 * There is only one way for the user to join. 
 * There are 2 ways for the user to disconnect:
 *   - Switching away 
 *   - Disconnecting
=======
 * CORRECTNESS ARGUMENT
 * 
 * Initial state: 
 *   - If the user successfully connected
 * 
 * Transitional States:
 *   - Switch to a different part of the app: destroyed () 
 *   - Disconnection: disconnect hook
>>>>>>> 56843779f815ddd72b11ab1c05e0ac6fdffea35e
 */
import db from "@/database.js";
import firebase from "firebase/app";
import "firebase/firestore";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import { DefaultEmailSettings } from "@/CONSTANTS.js";
import { mapState } from "vuex";
import "firebase/database";

export default {
  props: {
    roomId: {
      type: String,
      required: true
    }
  },
  computed: {
    ...mapState([
      "user",
      "session"
    ]),
    sessionID () {
      return this.session.currentID; 
    },
    participantsRef () {
      const { class_id } = this.$route.params; 
      return db.collection(`classes/${class_id}/participants`);
    },
    myFirestoreRef () {
      return this.participantsRef.doc(this.sessionID);
    },
    myFirebaseRef () {
      const { class_id } = this.$route.params; 
      return firebase.database().ref(`/class/${class_id}/participants/${this.sessionID}`); 
    }
  },
  async created () {
    // PART 1/2: set up the disconnect hook
    const snapshot = await this.myFirebaseRef.child("disconnectCounter").once("value");
    const disconnectCounter = snapshot.val() ? snapshot.val() : 0; 

    // await Firebase to successfully register the disconnect hook 
    // Cloud Functions will detect the change and update Firestore accordingly
    await this.myFirebaseRef.onDisconnect().set({ 
      disconnectCounter: disconnectCounter + 1
    });

    // PART 2/2: now safely join the room
    const { section_id } = this.$route.params; 
    this.participantsRef.doc(this.sessionID).set({
      sessionID: this.sessionID,
      currentRoom: this.roomId,
      roomTypeID: section_id,
      ...this.user
    });
  },
  // CASE 2.1: Transition by switching components
  beforeDestroy () {
    // disable the disconnect hook
    this.myFirebaseRef.onDisconnect().cancel();
    // now I can safely remove myself
    this.myFirestoreRef.delete()
  }
}
</script>