<template>
  <div id="room" class="room-wrapper">
    <portal-target name="video-chat"/>
    <div v-if="user">
      <RealtimeBlackboard :strokesRef="strokesRef" :roomParticipants="roomParticipants"/>
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
    BaseButton,
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
      classRef: null,
      roomParticipantsRef: null,
      strokesRef: null,
      unsubscribeRoomListener: null,
      classId: this.$route.params.class_id,
      roomId: this.$route.params.room_id,
      firebaseRef: null,
      messagesOpen: false,
      hasUserBeenSet: false,
      removeSetParticipantListener: null
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
    },
    user () {
      if(this.user && this.user.firstName){ //the user is loaded
        this.setParticipant();
      }
    }
  },
  async created () {
    this.roomRef = db.doc(`classes/${this.classId}/blackboards/${this.roomId}`);
    this.classRef = db.doc(`classes/${this.classId}`);
    this.roomParticipantsRef = db.collection(`classes/${this.classId}/participants`).where("currentRoom", "==", this.roomId)

    this.strokesRef = this.roomRef.collection("strokes");

    this.unsubscribeRoomListener = await this.$_listenToDoc(this.roomRef, this, "room"); 

    this.$_listenToCollection(this.roomParticipantsRef, this, "roomParticipants").then(snapshotListener => {
      this.snapshotListeners.push(snapshotListener);
    });
    if (this.user && this.user.firstName) { //the watch hook for user will not trigger 
      this.setParticipant();
    }
  },
  beforeDestroy () {
    this.removeSetParticipantListener();
    this.unsubscribeRoomListener();
    for (const detachListener of this.snapshotListeners) {
      detachListener();
    }
  },
  methods: {
    setParticipant() {
      const participantRef = db.doc(`classes/${this.classId}/participants/${this.user.uid}`)
      this.removeSetParticipantListener = participantRef.onSnapshot(doc => { //we use onSnapshot here to ensure that the particpant was connected in ClassPage
        const user = doc.data();
        console.log("PARTICHANGED", this.roomId, user)
        if (user) {
          participantRef.update({
            uid: this.user.uid,
            email: this.user.email,
            firstName: this.user.firstName,
            lastName: this.user.lastName,
            currentRoom: this.roomId,
            isMicOn: false,
            isCameraOn: false,
            hasJoinedMedia: false
          })
          this.removeSetParticipantListener();
        }
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

