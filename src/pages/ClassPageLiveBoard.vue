<template>
  <div id="room">
    <v-content v-if="user">
      <Blackboard v-if="room.blackboardId" ref="whiteboard" 
        :blackboardId="room.blackboardId" :isRealtime="true"
      />
    </v-content>
  </div>
</template>

<script>
import firebase from "firebase/app";
import "firebase/firestore";
import Blackboard from "@/components/Blackboard.vue";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import db from "@/database.js";

export default {
  components: { Blackboard },
  mixins: [DatabaseHelpersMixin],
  data () {
    return {
      room: {},
      unsubscribeRoomListener: null,
      classId: this.$route.params.class_id,
      roomId: this.$route.params.room_id
    }
  },
  computed: {
    user () { return this.$store.state.user; },
    simpleUser () {
      if (!this.user) { return; } 
      return {
        email: this.user.email,
        uid: this.user.uid,
        firstName: this.user.firstName
      }
    }
  },
  async created () {
    this.roomRef = db.doc(`rooms/${this.roomId}`);
    this.bindVariables();
  },
  beforeDestroy () {
    this.unsubscribeRoomListener();
    this.roomRef.update({
      members: firebase.firestore.FieldValue.arrayRemove(this.simpleUser)
    });
  },
  methods: {
    async bindVariables () {
      const room = await this.roomRef.get();
      if (!room.exists) {
        // roomId and blackboardId will be same
        const newBoardRef = db.doc(`classes/${this.classId}/blackboards/${this.roomId}`);
        const createNewBoard = newBoardRef.set({})
        const createNewRoom = this.roomRef.set({
          blackboardId: this.roomId,
          members: [],
          forClassId: this.classId
        });
        await Promise.all(createNewBoard, createNewRoom);
      }
      this.unsubscribeRoomListener = await this.$_listenToDoc(this.roomRef, this, "room");
      this.setDisconnectHook();
    },
    setDisconnectHook () {
      const firebaseclassId = this.classId.replace(".", "-");
      const firebaseRef = firebase.database().ref(`/room/${firebaseclassId}/${this.roomId}`);
      // Mirror the Firebase room with the Firestore room
      firebase.database().ref(".info/connected").on("value", async snapshot => {
        if (snapshot.val() === false) { return; } 
        // Wait till server successfully processes the onDisconnectHook()
        await firebaseRef.onDisconnect().set(this.simpleUser);
        this.roomRef.update({ // it's much faster to update Firestore directly
          members: firebase.firestore.FieldValue.arrayUnion(this.simpleUser)
        });
        firebaseRef.set({ email: "", uid: "", firstName: "" }); // Firebase will not detect change if it's set to an empty object
      });
    },
  }
};
</script>
