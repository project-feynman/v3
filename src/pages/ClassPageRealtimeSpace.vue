<template>
  <div id="room" class="room-wrapper">
    <portal-target name="video-chat"/>
    <div v-if="user">
      <v-tabs v-model="activeBoard" active-class="accent--text" slider-color="accent">
        <template v-for="(board, i) in room.blackboards">
          <v-tab :href="'#' + board">
            {{ 'Board #' + (i+1) }}
          </v-tab>
        </template>
        <v-btn @click="newBoard()">+</v-btn>
      </v-tabs>
      <v-tabs-items v-model="activeBoard" touchless>
        <template v-for="(board, i) in room.blackboards">
          <v-tab-item :value="board" :key="i">
            <RealtimeBlackboard 
              :blackboardRef="blackboardRefs[i]" 
              :strokesRef="strokesRefs[i]" 
              :roomParticipants="roomParticipants"
            />
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
      blackboardRefs: [],
      strokesRefs: [],
      hasUserBeenSet: false,
      removeSetParticipantListener: null,
    }
  },
  computed: {
    ...mapState([
      "user",
      "mitClass",
      "session",
    ]),
    sessionID () {
      return this.session.currentID;
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
    this.roomParticipantsRef = db.collection(`classes/${this.classId}/participants`).where("currentRoom", "==", this.roomId)

    this.unsubscribeRoomListener = await this.$_listenToDoc(this.roomRef, this, "room");
    for (const blackboard of this.room.blackboards) {
      const blackboardRef = db.doc(`classes/${this.classId}/blackboards/${blackboard}`);
      this.blackboardRefs.push(blackboardRef);
      this.strokesRefs.push(blackboardRef.collection("strokes"));
    }

    this.$_listenToCollection(this.roomParticipantsRef, this, "roomParticipants").then(snapshotListener => {
      this.snapshotListeners.push(snapshotListener);
    });
    this.setParticipant();
  },
  beforeDestroy () {
    this.unsubscribeRoomListener();
    for (const detachListener of this.snapshotListeners) {
      detachListener();
    }
    firebase.database().ref(".info/connected").off();
  },
  methods: {
    setParticipant() {
      firebase.database().ref(".info/connected").on("value", async snapshot => {
        const isUserConnected = snapshot.val(); 
        if (isUserConnected === false){
          return;
        } 
        const participantRef = db.doc(`classes/${this.classId}/participants/${this.sessionID}`);
        participantRef.get().then(doc => {
          if (doc.exists){
            const userObj = doc.data();
            const isSameRoom = userObj.currentRoom === this.roomId;
            console.log("participant exists!", userObj)
            participantRef.update({
              currentRoom: this.roomId,
              isMicOn: isSameRoom ? userObj.isMicOn : false,
              isCameraOn: isSameRoom ? userObj.isCameraOn : false,
              hasJoinedMedia: isSameRoom ? userObj.hasJoinedMedia : false,
            })
          }
          else{
            console.log("participant no exist")
            participantRef.set({
              sessionID: this.sessionID,
              refreshToken: this.session.refreshToken,
              uid: this.user.uid,
              email: this.user.email,
              firstName: this.user.firstName,
              lastName: this.user.lastName,
              currentRoom: this.roomId,
              isMicOn: false,
              isCameraOn: false,
              hasJoinedMedia: false
            })
          }
          const participantsRef = db.collection(`classes/${this.classId}/participants`);
          participantsRef.where("refreshToken", "==", this.session.refreshToken).get().then( docs => {
            if (docs.empty) {
              console.log('No matching documents.');
              return;
            }  
            docs.forEach(doc => {
              const participant = doc.data();
              console.log("APRTS", participant)
              if (participant.sessionID !== this.sessionID) {
                participantsRef.doc(participant.sessionID).delete();
              }
            })
          }) 
        })
        
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
        this.strokesRefs.push(db.doc(result.path).collection("strokes"));
        this.blackboardRefs.push(db.doc(result.path));
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

