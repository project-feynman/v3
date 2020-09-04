<template>
  <div>  
    <!-- This will handle everything to do with participants -->
    <HandleUpdatingParticipants/>

    <RealtimeSpaceTwilioRoom :roomID="$route.params.room_id"/>

    <!-- Video sharing -->
    <portal-target name="destination">
    
    </portal-target>

    <v-toolbar>
      <!-- Tabs for different blackboards -->
      <v-tabs v-if="user && room" v-model="activeBoard" active-class="accent--text" slider-color="accent">
        <template v-for="(board, i) in room.blackboards">
          <v-tab :href="'#' + board" :key="i">
            {{ 'BOARD #' + (i+1) }}
          </v-tab>
        </template>
        <BaseButton @click="createNewBoard()" icon="mdi-plus" small color="grey">
          New blackboard
        </BaseButton>
      </v-tabs>
    </v-toolbar>

    <div id="room" class="room-wrapper">
      <div v-if="user">
        <!-- The actual blackboards -->
        <v-tabs-items v-model="activeBoard" touchless>
          <template v-if="blackboardRefs.length !== 0 && room">
            <template v-for="(board, i) in room.blackboards">
              <v-tab-item :value="board" :key="i">
                <RealtimeBlackboard 
                  :blackboardRef="blackboardRefs[i]"
                />
              </v-tab-item>
            </template>
          </template>
        </v-tabs-items>
      </div>
    </div>
  </div>
</template>

<script>
import firebase from "firebase/app";
import "firebase/firestore";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import db from "@/database.js";
import BaseButton from "@/components/BaseButton.vue";
import BaseIconButton from "@/components/BaseIconButton.vue";
import { mapState } from "vuex";
import RealtimeBlackboard from "@/components/RealtimeBlackboard.vue";
import RealtimeSpaceTwilioRoom from "@/components/RealtimeSpaceTwilioRoom";
import BasePopupButton from "@/components/BasePopupButton.vue"; 
import HandleUpdatingParticipants from "@/components/HandleUpdatingParticipants.vue";
import { getRandomId } from "@/helpers.js";

export default {
  components: {
    HandleUpdatingParticipants,
    RealtimeBlackboard,
    RealtimeSpaceTwilioRoom,
    BasePopupButton,
    BaseButton,
    BaseIconButton,
  },
  mixins: [
    DatabaseHelpersMixin,
  ],
  data () {
    return {
      room: null,
      blackboardRefs: [],
      snapshotListeners: [],
      roomRef: null,
      classId: this.$route.params.class_id,
      roomId: this.$route.params.room_id,
      activeBoard: 'tab-1',
      boards: []
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
  // database => state 
  watch: {
    immediate: true,
    room: {
      handler (newVal, oldVal) {
        this.$store.commit("SET_ROOM", this.room);
        if (newVal.blackboards) {
          const newBlackboardRefs = []; 
          for (const blackboard of newVal.blackboards) {
            newBlackboardRefs.push(
              db.doc(`classes/${this.classId}/blackboards/${blackboard}`)
            );
          }
          this.blackboardRefs = newBlackboardRefs; 
        }
      }
    }
  },
  async created () {
    this.roomRef = db.doc(`classes/${this.classId}/rooms/${this.roomId}`);
    this.$_listenToDoc(this.roomRef, this, "room").then(unsubFunc => {
      this.snapshotListeners.push(unsubFunc);
    });
  },
  destroyed () {
    for (const detachListener of this.snapshotListeners) {
      detachListener();
    }
  },
  methods: { 
<<<<<<< Updated upstream
<<<<<<< Updated upstream
    /**
     * TODO: refactor
     * 
     */
    setParticipant () {
      firebase.database().ref(".info/connected").on("value", async snapshot => {
        const isUserConnected = snapshot.val(); 
        if (isUserConnected === false){
          return;
        } 
        const participantRef = db.doc(`classes/${this.classId}/participants/${this.sessionID}`);
        participantRef.get().then(doc => {
          if (doc.exists) {
            const userObj = doc.data();
            const isSameRoom = userObj.currentRoom === this.roomId;
            participantRef.update({
              currentRoom: this.roomId,
              isMicOn: isSameRoom ? userObj.isMicOn : false,
              isCameraOn: isSameRoom ? userObj.isCameraOn : false,
              isSharingScreen: isSameRoom ? userObj.isSharingScreen : false,
              hasJoinedMedia: isSameRoom ? userObj.hasJoinedMedia : false,
            })
          } else {
            participantRef.set({
              sessionID: this.sessionID,
              // refreshToken: this.session.refreshToken,
              uid: this.user.uid,
              email: this.user.email,
              firstName: this.user.firstName,
              lastName: this.user.lastName,
              currentRoom: this.roomId,
              isMicOn: false,
              isCameraOn: false,
              isSharingScreen: false,
              hasJoinedMedia: false
            });
          }
          /*const participantsRef = db.collection(`classes/${this.classId}/participants`);
          participantsRef.where("refreshToken", "==", this.session.refreshToken).get().then(docs => {
            if (docs.empty) {
              return;
            }  
            docs.forEach(doc => {
              const participant = doc.data();
              if (participant.sessionID !== this.sessionID) {
                participantsRef.doc(participant.sessionID).delete();
              }
            });
          })*/
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
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
    // state => database
    async createNewBoard () {
      const roomRef = db.doc(`classes/${this.classId}/rooms/${this.roomId}`);
      const blackboardsRef = db.collection(`classes/${this.classId}/blackboards`);
      const newID = getRandomId();  
      const promises = []; 

      promises.push(
        blackboardsRef.doc(newID).set({
          roomType: '',
        })
      );
      promises.push(
        roomRef.update({
          blackboards: firebase.firestore.FieldValue.arrayUnion(newID)
        })
      );
      await Promise.all(promises);
      
      this.activeBoard = newID;
    },
  }
};
</script>

<style scoped>
.room-wrapper{
  height: 100px;
}
</style>

