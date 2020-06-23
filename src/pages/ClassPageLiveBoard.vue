<template>
  <div id="room">
    <template v-if="user">
      <LiveBoardAudio :roomId="roomId"/>
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
      return {
        email: this.user.email,
        uid: this.user.uid,
        firstName: this.user.firstName,
        lastName: this.user.lastName
      }
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
    this.roomRef.update({
      participants: firebase.firestore.FieldValue.arrayRemove(this.simplifiedUser)
    });
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
      firebase.database().ref(".info/connected").on("value", async (snapshot) => {
        const isUserConnected = snapshot.val(); 
        if (isUserConnected === false) return; 
        const firebaseRef = firebase.database().ref(`/room/${this.classId}/${this.roomId}`);
        // maybe remove the await for performance improvements?
        await firebaseRef.onDisconnect().set(this.simplifiedUser);
        this.roomRef.update({ // it's much faster to update Firestore directly then to wait for Cloud Functions
          participants: firebase.firestore.FieldValue.arrayUnion(this.simplifiedUser)
        });
        
        // cleanup firebase from previous user remnants, so when the onDisconnect hook triggers,
        // the firebase will go from empty to {} for Cloud Functions to detect it
        firebaseRef.set({ // Firebase will not detect change if it's set to an empty object for some reason
          email: "", 
          uid: "", 
          firstName: "" 
        });
      });
    }
  }
};
</script>
