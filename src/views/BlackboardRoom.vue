<template>
  <div id="room">
    <v-content v-if="simpleUser && room">
      <!-- <p>room {{ room }}</p> -->
      <!-- "v-if="...room.whiteboardID"" needed because room goes from null to {} (surprisingly), before becoming fully populated -->
      <Blackboard
        v-if="room.blackboardId"
        ref="whiteboard"
        :blackboardId="room.blackboardId"
        :isRealtime="true"
      />
    </v-content>
  </div>
</template>

<script>
import firebase from "firebase/app";
import "firebase/firestore";
import db from "@/database.js";
import Blackboard from "@/components/Blackboard.vue";

export default {
  components: {
    Blackboard
  },
  computed: {
    user () { return this.$store.state.user; },
    roomId () { return this.$route.params.room_id; },
    classId () { return this.$route.params.class_id; },
    roomRef () { return db.collection("rooms").doc(this.roomId); },
    simpleUser () {
      if (!this.user) return; 
      return {
        email: this.user.email,
        uid: this.user.uid,
        firstName: this.user.firstName
      }
    }
  },
  data () {
    return {
      room: null,
      loadCanvas: false,
      prevroomRef: null,
    }
  },
  watch: {
    $route: {
      handler: "bindVariables",
      immediate: true
    }
  },
  async beforeDestroy () {
    this.cleanUpPrevroom(); // needed when the user switches to any other place besides another blackboard
  },
  methods: {
    async bindVariables () {
      if (this.prevroomRef) await this.cleanUpPrevroom();
      // Create a new room if it doesn't exist
      const room = await this.roomRef.get();
      if (!room.exists) {
        // roomId and blackboardId will be same
        const createNewBoard = db.collection("classes").doc(this.classId).collection("blackboards").doc(this.roomId).set({})
        const createNewRoom = this.roomRef.set({
          blackboardId: this.roomId,
          members: [],
          forClassId: this.classId
        });
        await Promise.all(createNewBoard, createNewRoom);
      }
      await this.$binding("room", this.roomRef);
      this.setDisconnectHook();
      this.prevroomRef = this.roomRef;
    },
    async cleanUpPrevroom () {
      const promise = new Promise(async (resolve, reject) => {
        await this.prevroomRef.update({
          members: firebase.firestore.FieldValue.arrayRemove(this.simpleUser)
        });
        resolve();
      });
      return promise;
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
        // if I just reset it to a truly empty object, Firestore does not detect the change for some reason
        firebaseRef.set({ email: "", uid: "", firstName: "" });
      });
    },
  }
};
</script>
