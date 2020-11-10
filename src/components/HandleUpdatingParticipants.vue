<template>
  <div>

  </div>
</template>

<script>
/**
 * CORRECTNESS ARGUMENT
 * 
 * User JOINING a room:
 *   case 1: joined for first time
 *   case 2: switched from another room
 *   case 3: re-opened iPad screen
 * 
 *   For case 1 & 2, the `create ()` hook will update the participants document on Firestore.
 *   Fore case 3, the `info.connected()` listener will detect the re-established connection and re-update the participants
 * 
 * User LEAVING a room:
 *   case 1: moved to another room / page on the website
 *   case 2: closed the iPad screen
 *   case 3: exited the website entirely
 * 
 *   For case 1, the `beforeDestroy` hook will clean up the listeners and delete the participant document
 *   For case 2 & 3, the disconnect hook will remove the participant

 */
import db from "@/database.js";
import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/database";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import { mapState } from "vuex";

export default {
  props: {
    roomId: {
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
      isDestroyed: false
    };
  },
  computed: {
    ...mapState([
      "user",
      "session",
      "canHearAudio"
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
      const { class_id, room_id } = this.$route.params; 
      return firebase.database().ref(`/class/${class_id}/room/${room_id}/participants/${this.sessionID}`); 
    }
  },
  watch: {
    currentBoardNumber () {
      this.updateParticipantDoc();
    },
    canHearAudio () {
      this.updateParticipantDoc(); 
    }
  },
  async created () {
    // Step 1/2: set up the disconnect hook
    const snapshot = await this.myFirebaseRef.child("disconnectCounter").once("value");
    const disconnectCounter = snapshot.val() ? snapshot.val() : 0; 
    // we increment a counter because the user can seemingly "disconnect" by turning off an iPad screen, but return with the same session ID
    await this.myFirebaseRef.onDisconnect().set({ 
      disconnectCounter: disconnectCounter + 1 // Cloud Functions will detect the change and update Firestore accordingly
    });

    // Step 2/2: set up a connection listener to handle the user turning on/off the iPad screen without moving/leaving the website
    firebase.database().ref(".info/connected").on("value", async connectionState => {
      if (connectionState.val() === true) {
        this.updateParticipantDoc(); 
      } else {
        // do nothing because the disconnect hook will take care of the user turning off the iPad screen
      }
    });

    // fix for ghost participants
    if (this.isDestroyed) {
      this.cleanUpEverything(); 
    }
  },
  beforeDestroy () {
    this.isDestroyed = true; 
    this.cleanUpEverything(); 
  },
  methods: {
    updateParticipantDoc () {
      this.myFirestoreRef.set({
        sessionID: this.sessionID,
        currentRoom: this.roomId,
        currentBoardNumber: this.currentBoardNumber,
        roomTypeID: this.$route.params.section_id,
        firstName: this.user.firstName,
        lastName: this.user.lastName,
        email: this.user.email,
        uid: this.user.uid,
        canHearAudio: this.canHearAudio
      });
    },
    // doesn't matter if it's called twice, because the ref is unique
    // not quite right
    cleanUpEverything () {
      // Step 1: clean up listeners first
      //   (note that .off() will destroy ALL listeners, which can result in side-effects across the application
      //   it can be better to only remove our particular listener here)
      firebase.database().ref(".info/connected").off(); 
      this.myFirebaseRef.onDisconnect().cancel();
    
      // now I can safely remove myself
      this.myFirestoreRef.delete();
    }
  }
}
</script>