<template>
  <div id="room">
    <template v-if="user">
      <RealtimeBlackboard :strokesRef="strokesRef"/>
    </template>
  </div>
</template>

<script>
import firebase from "firebase/app";
import "firebase/firestore";
import LiveBoardAudio from "@/components/LiveBoardAudio.vue";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import db from "@/database.js";
import ButtonNew from "@/components/ButtonNew.vue";
import { mapState } from "vuex";
import RealtimeBlackboard from "@/components/RealtimeBlackboard.vue";

export default {
  components: { 
    ButtonNew,
    LiveBoardAudio,
    RealtimeBlackboard
  },
  mixins: [
    DatabaseHelpersMixin,
  ],
  data () {
    return {
      room: {},
      roomRef: null,
      strokesRef: null,
      unsubscribeRoomListener: null,
      classId: this.$route.params.class_id,
      roomId: this.$route.params.room_id,
    }
  },
  computed: {
    ...mapState([
      "user",
      "mitClass"
    ]),
    simplifiedUser () {
      if (!this.user) return; 
      const main = {
        email: this.user.email,
        uid: this.user.uid,
        firstName: this.user.firstName,
        lastName: this.user.lastName,
      }
      console.log(this.room.participants)
      if (this.room.participants.find(p => p.uid === this.user.uid)) {
        return {...main, isMicOn: this.room.participants.find(p => p.uid === this.user.uid).isMicOn }
      }
      return main
      
    }
  },
  watch: {
    room () {
      this.$store.commit("SET_ROOM", this.room);    
    }
  },
  async created () {
    this.roomRef = db.doc(`classes/${this.classId}/blackboards/${this.roomId}`);
    this.strokesRef = this.roomRef.collection("strokes");
    this.unsubscribeRoomListener = await this.$_listenToDoc(this.roomRef, this, "room"); 
    this.setUserDisconnectHook();
  },
  beforeDestroy () {
    this.unsubscribeRoomListener();
    this.roomRef.update({ //Filters out the current user
      participants: this.room.participants.filter(participant => participant.uid !== this.user.uid) 
    });
  },
  methods: {
    setUserDisconnectHook () {
      /*
        Firebase Realtime Database provides a special location at /.info/connected 
        which is updated every time the Firebase Realtime Database client's connection state changes. 
        https://firebase.google.com/docs/database/web/offline-capabilities
      */
      firebase.database().ref(".info/connected").on("value", async (snapshot) => {
        const isUserConnected = snapshot.val(); 
        if (isUserConnected === false) return; 
        // first ensure `onDisconnect` hook is successfully processed 
        const firebaseRef = firebase.database().ref(`/room/${this.classId}/${this.roomId}`);
        // 1. User leaves, and his/her identity is saved to Firebase
        // 2. Firestore detects the new user in Firebase, and uses that information to `arrayRemove` the user from the room
        
        // step 1 (step 2 is executed in Cloud Functions)
        await firebaseRef.onDisconnect().set(this.simplifiedUser);
        // now join the room 
        this.roomRef.update({ // it's much faster to update Firestore directly
          participants: firebase.firestore.FieldValue.arrayUnion(this.simplifiedUser)
        });
        firebaseRef.set({ // Firebase will not detect change if it's set to an empty object
          email: "", 
          uid: "", 
          firstName: "" 
        });
      });
    }
  }
};
</script>
