<template>
  <div id="room" style="position: relative">
    <portal-target name="video-chat"/>
    <template v-if="user" >
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
      roomParticipants: [],
      snapshotListeners: [],
      roomRef: null,
      roomParticipantsRef: null,
      strokesRef: null,
      unsubscribeRoomListener: null,
      classId: this.$route.params.class_id,
      roomId: this.$route.params.room_id
      
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
    this.roomParticipantsRef = this.roomRef.collection('participants');
    this.strokesRef = this.roomRef.collection("strokes");
    this.unsubscribeRoomListener = await this.$_listenToDoc(this.roomRef, this, "room"); 

    this.$_listenToCollection(this.roomParticipantsRef, this, "roomParticipants").then(snapshotListener => {
      this.snapshotListeners.push(snapshotListener);
    });

    this.setUserDisconnectHook();
  },
  beforeDestroy () {
    this.unsubscribeRoomListener();
    // this.roomRef.update({ //Filters out the current user
    //   participants: this.room.participants.filter(participant => participant.uid !== this.user.uid) 
    // });
    for (const detachListener of this.snapshotListeners) {
      detachListener();
    }
    this.roomParticipantsRef.doc(this.user.uid).delete();
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
        const firebaseRef = firebase.database().ref(`/room/${this.classId}/${this.roomId}/participants`);
        // 1. User leaves, and his/her identity is saved to Firebase
        // 2. Firestore detects the new user in Firebase, and uses that information to `arrayRemove` the user from the room
        
        // step 1 (step 2 is executed in Cloud Functions)
        await firebaseRef.onDisconnect().set(this.simplifiedUser);
        // now join the room 
        // if (!this.room.participants.find(p => p.uid === this.simplifiedUser.uid)){ //Sometimes the user already exists due to realtime bug
        //   this.roomRef.update({ // it's much faster to update Firestore directly
        //     participants: firebase.firestore.FieldValue.arrayUnion(this.simplifiedUser)
        //   });
        // }
        this.roomParticipantsRef.doc(this.user.uid).set({
          ...this.simplifiedUser,
          isMicOn: false,
          isCameraOn: false,
          hasJoinedMedia: false
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
<style scoped>
</style>