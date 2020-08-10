<template>
  <div id="room" class="room-wrapper">
    <portal-target name="video-chat"/>
    <div v-if="user">
      <v-tabs v-model="activeBoard" active-class="accent--text" slider-color="accent">
        <template
          v-for="(board, i) in room.blackboards"
        >
          <v-tab :href="'#'+board">
            {{'Board #'+(i+1)}}
          </v-tab>
        </template>
        <v-btn @click="newBoard()">+</v-btn>
      </v-tabs>
      <v-tabs-items v-model="activeBoard">
        <template
          v-for="(board, i) in room.blackboards"
        >
          <v-tab-item :value="board">
            <RealtimeBlackboard :strokesRef="strokesRefs[i]" :roomParticipants="roomParticipants"/>
          </v-tab-item>
        </template>
      </v-tabs-items>
    </div>
  </div>
</template>

<script>
import firebase from "firebase/app";
import "firebase/firestore";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import db from "@/database.js";
import BaseButton from "@/components/BaseButton.vue";
import { mapState } from "vuex";
import RealtimeBlackboard from "@/components/RealtimeBlackboard.vue"

export default {
  components: {
    RealtimeBlackboard
  },
  mixins: [
    DatabaseHelpersMixin,
  ],
  data () {
    return {
      room: {},
      roomParticipants: [],
      snapshotListeners: [],
      roomRef: null,
      roomParticipantsRef: null,
      unsubscribeRoomListener: null,
      classId: this.$route.params.class_id,
      roomId: this.$route.params.room_id,
      firebaseRef: null,
      messagesOpen: false,
      activeBoard: 'tab-1',
      boards: [],
      strokesRefs: [],
    }
  },
  computed: {
    ...mapState([
      "user",
      "mitClass"
    ]),
    simplifiedUser () {
      if (!this.user) return; 
      return {
        email: this.user.email,
        uid: this.user.uid,
        firstName: this.user.firstName,
        lastName: this.user.lastName,
      };
    }
  },
  // Why use a watch hook here? 
  watch: {
    room () {
      this.$store.commit("SET_ROOM", this.room);
    }
  },
  async created () {
    this.roomRef = db.doc(`classes/${this.classId}/rooms/${this.roomId}`);
    this.roomParticipantsRef = this.roomRef.collection("participants");

    this.unsubscribeRoomListener = await this.$_listenToDoc(this.roomRef, this, "room");
    // this.room.strokesRefs = [];
    for (const blackboard of this.room.blackboards) {
      const blackboardRef = db.doc(`classes/${this.classId}/blackboards/${blackboard}`);
      this.strokesRefs.push(blackboardRef.collection("strokes"));
    }
    console.log('strokes refs', this.strokesRefs.length);

    this.$_listenToCollection(this.roomParticipantsRef, this, "roomParticipants").then(snapshotListener => {
      this.snapshotListeners.push(snapshotListener);
    });

    this.setUserDisconnectHook();
  },
  beforeDestroy () {
    firebase.database().ref(".info/connected").off();
    this.unsubscribeRoomListener();
    // this.roomRef.update({ //Filters out the current user
    //   participants: this.room.participants.filter(participant => participant.uid !== this.user.uid) 
    // });
    for (const detachListener of this.snapshotListeners) {
      detachListener();
    }
    this.roomParticipantsRef.doc(this.user.uid).delete();
    this.firebaseRef.onDisconnect().cancel();
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
        if (isUserConnected === false){
          return;
        } 
        this.firebaseRef = firebase.database().ref(`/room/${this.classId}/${this.roomId}/participants`);
        // 1. User leaves, and his/her identity is saved to Firebase
        // 2. Firestore detects the new user in Firebase, and uses that information to `arrayRemove` the user from the room
        
        // step 1 (step 2 is executed in Cloud Functions)
        await this.firebaseRef.onDisconnect().set(this.simplifiedUser);

        // add the current user to the lounge
        this.roomParticipantsRef.doc(this.user.uid).set({
          ...this.simplifiedUser,
          isMicOn: false,
          isCameraOn: false,
          hasJoinedMedia: false
        }); 
        this.firebaseRef.set({ // Firebase will not detect change if it's set to an empty object
          email: "", 
          uid: "", 
          firstName: "" 
        });
      });
    },
    newBoard () {
      const roomRef = db.doc(`classes/${this.classId}/rooms/${this.roomId}`);
      const blackboardsRef = db.collection(`classes/${this.classId}/blackboards`);
      
      const newBlackboard = blackboardsRef.add({
        roomType: '',
      });
      newBlackboard.then(result => {
        roomRef.update({
          blackboards: firebase.firestore.FieldValue.arrayUnion(result.id)
        });
        console.log('the result', result);
        this.strokesRefs.push(db.doc(result.path).collection("strokes"));
        // this.activeBoard = result.id;
      })

    }
  }
};
</script>

<style scoped>
.room-wrapper{
  /* position: absolute;  */
  /* width: 50%;  */
  height: 100px;
}
.chat-btn{
  position: absolute; 
  right: 0%; 
  top: 0%; 
  border-style: solid; 
  height: 50px;
  margin-top: 5px;
  z-index: 7; /* this z-index is under the app-bar but over the weird blackboard stuff*/
}
</style>

