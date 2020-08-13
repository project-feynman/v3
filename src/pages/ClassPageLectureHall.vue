<template>
  <div>
    <v-expansion-panels>
      <v-expansion-panel>
        <v-expansion-panel-header>
          <v-row align="center">
            <h3 class="accent--text">
              Assign students to random groups
            </h3>
          </v-row>
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <v-list>
            <v-list-item>
              <v-select v-if="mitClass"
                v-model="roomForRandom"
                :items="mitClass.roomTypes"
                label="Room Group"
                />  
              <v-select 
                v-model="groupSizeForRandom"
                :items="groupSizeList"
                label="Group Size"
              />
              <BaseButton filled @click="moveStudentsToRooms()">
                <h2>
                  Go
                </h2>
              </BaseButton>
            </v-list-item>
          </v-list>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>

    <!-- Realtime Blackboard -->
    <RealtimeBlackboard :strokesRef="strokesRef" :roomParticipants="participants"/>
  </div>
</template>

<script>
/**
 * The main table in our virtual TEAL classroom, where the instructor broadcasts material to many students
 * 
 * Correctness argument for why participants is correct (TODO: implement the following): 
 *   If the user leaves by going to a different page, the `destroy()` hook will call, which is handled. 
 *   If the user leaves by disconnecting, the firebase `disconnect hook` will clean up the user document
 */
import firebase from "firebase/app";
import "firebase/firestore";
import db from "@/database.js";
import { mapState } from "vuex"; 
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js"; 
import RealtimeBlackboard from "@/components/RealtimeBlackboard.vue"; 
import BaseButton from "@/components/BaseButton.vue";

export default {
  mixins: [
    DatabaseHelpersMixin
  ],
  components: {
    RealtimeBlackboard,
    BaseButton
  },
  data () {
    return {
      classRef: db.collection("classes").doc(this.$route.params.class_id),
      classDoc: {},
      strokesRef: db.collection(
        `classes/${this.$route.params.class_id}/blackboards/${this.$route.params.room_id}/strokes`
      ),
      removeClassDocListener: null,
      participants: [],
      tableAssignments: [],
      strokesArray: [],
      roomForRandom: "",
      groupSizeForRandom: 3,
      groupSizeList: [],
      firebaseRef: null,
      snapshotListeners: [],
      roomParticipantsRef: null,
    };
  },
  computed: {
    isStudent () {
      if (!this.user) return false; 
      else return this.user.type === "student";
    },
    isStaff () {
      if (!this.user) return false;
      else return this.user.type === "staff";
    },
    classId () {
      return this.$route.params.class_id
    },
    roomId () {
      return this.$route.params.room_id
    },
    ...mapState([
      "user",
      "hasFetchedUser",
      "mitClass",
      "session"
    ]),
    sessionID () {
      return this.session.currentID;
    },
  },
  /*
    1. Distinguish between students and staff 
    2. Ensure when users are connected that they are added to the participants subcollection
    3. Implement the assignment button 
    4. Add the real-time blackboard, except make it read-only for students
  */
  // watch: {
  //   participants () {
  //     console.log("PART", this.participants)
  //   }
  // },
  created () {
    for (let i = 1; i <= 20; i++) {
      this.groupSizeList.push(i);
    }
    this.roomParticipantsRef = db.collection(`classes/${this.classId}/participants`).where("currentRoom", "==", "lecture-hall")
    this.$_listenToCollection(this.roomParticipantsRef, this, "participants").then((snapshotListener) => {
      this.snapshotListeners.push(snapshotListener);
    });
    this.setParticipant();
  },
  beforeDestroy () {
    this.removeClassDocListener();
    for (const detachListener of this.snapshotListeners) {
      detachListener();
    }
  },
  methods: {
    // TODO: 
    //   connect to the blackboard
    //   activate event listeners if and only if the user is a staff member
    //   listen to the class doc for new group assignments
    listenForRoomAssignments () {
      if (this.isStaff) return; 
      // we use `.set()` rather than `.add()` because if a student uses multiple devices, we want her to only be assigned to 1 table
      let onlyJustJoined = true; 
      this.removeClassDocListener = this.classRef.onSnapshot(doc => {
        if (onlyJustJoined) {
          onlyJustJoined = false; 
          return; 
        }
        for (const roomAssignment of doc.data().tableAssignments) {
          if (roomAssignment.assignees.includes(this.user.uid)) {
            this.removeClassDocListener(); 
            this.$router.push(`/class/${this.$route.params.class_id}/room/${roomAssignment.roomID}`); 
            this.$root.$emit("show-snackbar", "You've been assigned to a random group. Have fun :)");
          }
        }
      });
    },
    setParticipant() {
      firebase.database().ref(".info/connected").on("value", async snapshot => {
        const isUserConnected = snapshot.val(); 
        if (isUserConnected === false){
          return;
        } 
        this.listenForRoomAssignments();
        const participantRef = db.doc(`classes/${this.classId}/participants/${this.sessionID}`);
        participantRef.get().then(doc => {
          if (doc.exists){
            const userObj = doc.data();
            const isSameRoom = userObj.currentRoom === this.roomId;
            console.log("participant exists!", userObj)
            participantRef.update({
              currentRoom: "lecture-hall",
              isMicOn: isSameRoom ? userObj.isMicOn : false,
              isCameraOn: isSameRoom ? userObj.isCameraOn : false,
              hasJoinedMedia: isSameRoom ? userObj.hasJoinedMedia : false,
            })
          }
          else{
            console.log("participant no exist")
            participantRef.set({
              sessionID: this.sessionID,
              uid: this.user.uid,
              email: this.user.email,
              firstName: this.user.firstName,
              lastName: this.user.lastName,
              currentRoom: "lecture-hall",
              isMicOn: false,
              isCameraOn: false,
              hasJoinedMedia: false
            })
          }
        })
        
      });
    },
    async moveStudentsToRooms () {
      /**
       * Shuffles array in place. ES6 version
       * @param {Array} a array containing items.
       * @see https://stackoverflow.com/a/6274381
       */
      function shuffle(a) {
        for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
      }
      const connectedStudents = []; 
      const tableAssignments = []; 
      connectedStudents.push(...this.participants);
      const query = this.classRef.collection("rooms").where("roomType", "==", this.roomForRandom);
      await query.get().then(rooms => {
        rooms.forEach(room => {
          tableAssignments.push({
            roomID: room.id,
            assignees: []
          }); 
        })
      });
      shuffle(connectedStudents); 
      shuffle(tableAssignments);

      // `tableAssignments` has the structure of: [{ roomID: "123", "assignees": ["345", "abc"] }]
      let i = 0; 
      for (const student of connectedStudents) {
        if (tableAssignments[i].assignees.length >= this.groupSizeForRandom) {
          i = (i+1)%tableAssignments.length; // leftover students just get pushed onto a table
        }
        tableAssignments[i].assignees.push(student.uid); 
      }
      // update the class doc, so each connected user will detect the change and be redirected.
      await this.classRef.update({
        tableAssignments
      });
      // Here we used to batch delete all of the participants, but we dont need that anymore as particpants are deleted on destroy
    }
  }
}
</script>