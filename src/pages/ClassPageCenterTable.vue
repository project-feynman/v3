<template>
  <v-container>
    <ButtonNew class="ml-5 pl-5" @click="moveStudentsToRooms()" icon="mdi-help">
      Assign students to groups of 3
    </ButtonNew>
    <p>
      This is where the instructor can broadcast his blackboard to many students at once, ideal for lectures. 
      The instructor can press a button to evenly divide students into random groups in real-time blackboard rooms. 
    </p>
    <p>class document: {{ classDoc }}</p>
    <p>class participants: {{ participants }}</p>
    <RealtimeBlackboard :strokesRef="strokesRef"/>
  </v-container>
</template>

<script>
import db from "@/database.js";
import { mapState } from "vuex"; 
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js"; 
import RealtimeBlackboard from "@/components/RealtimeBlackboard.vue"; 
import ButtonNew from "@/components/ButtonNew.vue";

export default {
  mixins: [
    DatabaseHelpersMixin
  ],
  components: {
    RealtimeBlackboard,
    ButtonNew
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
      strokesArray: []
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
    ...mapState([
      "user",
      "hasFetchedUser",
      "mitClass"
    ])
  },
  /*
    1. Distinguish between students and staff 
    2. Ensure when users are connected that they are added to the participants subcollection
    3. Implement the assignment button 
    4. Add the real-time blackboard, except make it read-only for students
  */
  watch: {
    user: {
      immediate: true,
      async handler () {
        if (!this.user) return; 
        this.registerUserAndListenForRoomAssignments(); 
        this.$_listenToDoc(this.classRef, this, "classDoc");
        this.$_listenToCollection(this.classRef.collection("participants"), this, "participants");
      }
    }
  },
  methods: {
    // TODO: 
    //   connect to the blackboard
    //   activate event listeners if and only if the user is a staff member
    //   listen to the class doc for new group assignments
    registerUserAndListenForRoomAssignments () {
      if (this.isStaff) return; 
      else {
        // we use `.set()` rather than `.add()` because if a student uses multiple devices, we want her to only be assigned to 1 table
        this.classRef.collection("participants").doc(this.user.uid).set({
          uid: this.user.uid,
          email: this.user.email,
          // firstName: this.user.firstName,
          // lastName: this.user.lastName,
        }); 
        let onlyJustJoined = true; 
        this.removeClassDocListener = this.classRef.onSnapshot(doc => {
          /* roomAssignment := [{
            roomID: ""
            assignees: set([])
          }] */
          for (const roomAssignment of doc.data().tableAssignments) {
            if (roomAssignment.assignees.includes(this.user.uid)) {
              if (onlyJustJoined) {
                onlyJustJoined = false; 
                return; 
              } else {
                this.removeClassDocListener(); 
                this.$router.push(`/class/${this.$route.params.class_id}/room/${roomAssignment.roomID}`); 
                this.$root.$emit("show-snackbar", "You've been assigned to a random group. Have fun :)")
              }
            }
          }
        });
      }
    },
    async moveStudentsToRooms () {
      // get the array of participants who are currently connected 
      const connectedStudents = await this.$_getCollection(this.classRef.collection("participants"));
      /**
       * Shuffles array in place. ES6 version
       * @param {Array} a items An array containing the items.
       * @see https://stackoverflow.com/a/6274381
       */
      function shuffle(a) {
        for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
      }
      shuffle(connectedStudents); 
      // STEP 3: create the room assignment 
      const groupSize = 4; 
      const tableAssignments = []; 
      const tealTables = await this.$_getCollection(this.classRef.collection("blackboards")); 
      let i = 0; 
      for (const table of tealTables) {
        tableAssignments.push({
          roomID: table.id,
          assignees: []
        }); 
      }
      shuffle(tableAssignments);
      // `tableAssignments` has the structure of: [{ roomID: "123", "assignees": ["345", "abc"] }]
      for (const student of connectedStudents) {
        if (tableAssignments[i].assignees.length > groupSize) {
          i += 1; 
        }
        tableAssignments[i].assignees.push(student.uid); 
      }

      // STEP 4: update the class doc to notify connected users to be redirected
      await this.classRef.update({
        tableAssignments
      });

      // now assume that all the connected users will be automatically migrated to rooms, so participants should now be empty
      const batch = db.batch(); 
      for (const participant of this.participants) {
        batch.delete(this.classRef.collection("participants").doc(participant.id))
      }
      await batch.commit(); 
    }
  }
}
</script>