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
    const { room_id, section_id } = this.$route.params; 
    this.participantsRef.doc(this.sessionID).set({
      sessionID: this.sessionID,
      currentRoom: room_id,
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