<template>
  <div id="room" class="room-wrapper">
    <portal-target name="video-chat"/>
    <div v-if="user">
      <v-tabs v-model="activeBoard" active-class="accent--text" slider-color="accent">
        <template v-for="(board, i) in room.blackboards">
          <v-tab :href="'#' + board" :key="i">
            {{ 'Board #' + (i+1) }}
          </v-tab>
        </template>
        <v-btn @click="newBoard()">+</v-btn>

        <BasePopupButton actionName="Make Announcement"
          :inputFields="['Message']"
          @action-do="payload => announce(payload)"
        >
          <template v-slot:activator-button="{ on }">
            <v-btn v-on="on" color="accent" text>Announce</v-btn>
          </template>
        </BasePopupButton>
        
        <BaseButton 
          @click="bringAllToRoom()" 
          style="position: absolute; right: 0%" 
          :icon="'mdi-account-arrow-left-outline'"
          >
          Bring All to Room
        </BaseButton>
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
    <v-dialog v-model = "showAnnouncement" max-width="500px">
      <v-card>
        <v-card-title class="headline">Announcement!</v-card-title>
        <v-card-text>
          {{ this.room.announcement }}
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="accent darken-1"
            text
            @click="showAnnouncement = false"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </div>
</template>

<script>
import firebase from "firebase/app";
import "firebase/firestore";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import db from "@/database.js";
import BaseButton from "@/components/BaseButton.vue";
import { mapState } from "vuex";
import RealtimeBlackboard from "@/components/RealtimeBlackboard.vue";
import BasePopupButton from "@/components/BasePopupButton.vue"; 

export default {
  components: {
    RealtimeBlackboard,
    BasePopupButton,
    BaseButton
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
      messagesOpen: false,
      activeBoard: 'tab-1',
      boards: [],
      blackboardRefs: [],
      strokesRefs: [],
      hasUserBeenSet: false,
      removeSetParticipantListener: null,
      showAnnouncement: false,
      allToRoomRef: null
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
    room (newVal, oldVal) {
      this.$store.commit("SET_ROOM", this.room);
      console.log('the new value', newVal);
      console.log('the old value', oldVal);
      if ((oldVal.hasOwnProperty('announcement') && newVal.announcement !== oldVal.announcement)) this.showAnnouncement = true;
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
    this.allToRoomRef.off();
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
            participantRef.update({
              currentRoom: this.roomId,
              isMicOn: isSameRoom ? userObj.isMicOn : false,
              isCameraOn: isSameRoom ? userObj.isCameraOn : false,
              hasJoinedMedia: isSameRoom ? userObj.hasJoinedMedia : false,
            })
          }
          else{
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
              return;
            }  
            docs.forEach(doc => {
              const participant = doc.data();
              if (participant.sessionID !== this.sessionID) {
                participantsRef.doc(participant.sessionID).delete();
              }
            })
          }) 
        })
        this.setMoveToRoomListener();
      });

    },
    bringAllToRoom () {
      this.allToRoomRef = firebase.database().ref(`class/${this.classId}/${this.room.roomType}/toRoom`);
      this.allToRoomRef.set({ roomId: this.roomId }).then(() => {
        this.allToRoomRef.set( { roomId: "" }); //We want to clear it after it notifies everyone
      })
    },
    setMoveToRoomListener() {
      this.allToRoomRef = firebase.database().ref(`class/${this.classId}/${this.room.roomType}/toRoom`);
      this.allToRoomRef.on("value", snapshot => {
        if (snapshot.val()) {
          const { roomId } = snapshot.val();
          if (roomId && this.roomId !== roomId){ //only call this if a different room
            this.$router.push(`/class/${this.classId}/room/${roomId}`); 
            this.$root.$emit("show-snackbar", "You've been called to the main room!");
          }
        }
      })
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

    },
    async announce (message) {
      console.log('the announcement', message);
      const category = this.room.roomType;
      await db.collection(`classes/${this.classId}/rooms`).where('roomType', '==', category).get().then(querySnapshot => {
        querySnapshot.forEach(doc => {
          doc.ref.update({
            announcement: message['Message']
          })
        });
      });
      // await db.doc(`classes/${this.classId}/rooms/${this.roomId}`).update({
      //   announcement: message['Message']
      // });
      
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

