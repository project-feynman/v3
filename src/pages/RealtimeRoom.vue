<template>
  <div>  
    <HandleUpdatingParticipants
      :roomId="roomId"
    />

    <RealtimeSpaceTwilioRoom 
      :roomID="roomId"
      :willMuteByDefault="true"
      :key="incrementToDestroyComponent"
      @disconnect="incrementToDestroyComponent += 1"
    />

    <!-- Display videos -->
    <portal-target name="destination">
    
    </portal-target>

    <v-toolbar>
      <!-- Tabs for different blackboards -->
      <v-tabs v-if="user && room" 
        v-model="activeBoardID" 
        active-class="accent--text" slider-color="accent" background-color="white"
      >
        <template v-for="(board, i) in room.blackboards">
          <v-tab :href="'#' + board" :key="i">
            {{ 'BOARD #' + (i+1) }}
          </v-tab>
        </template>
        <BaseButton @click="createNewBoard()" icon="mdi-plus" small color="grey">
          New board
        </BaseButton>
      </v-tabs>
    </v-toolbar>

    <div id="room" class="room-wrapper">
        <!-- The actual blackboards -->
        <v-tabs-items v-if="blackboardRefs.length !== 0 && room" 
          v-model="activeBoardID" 
          touchless
        >
        <!-- re-render the blackboard everytime someone switches -->
          <v-tab-item v-for="(boardID, i) in room.blackboards" 
            :value="boardID" :key="i"
          >
            <RealtimeBlackboard v-if="boardID === activeBoardID"
              :blackboardRef="blackboardRefs[i]"
            />
          </v-tab-item>
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
import BaseIconButton from "@/components/BaseIconButton.vue";
import { mapState } from "vuex";
import RealtimeBlackboard from "@/components/RealtimeBlackboard.vue";
import RealtimeSpaceTwilioRoom from "@/components/RealtimeSpaceTwilioRoom";
import BasePopupButton from "@/components/BasePopupButton.vue"; 
import HandleUpdatingParticipants from "@/components/HandleUpdatingParticipants.vue";
import { getRandomId } from "@/helpers.js";

export default {
  props: {
    roomId: {
      type: String,
      required: true
    }
  },
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
      activeBoardID: null,
      boards: [],
      incrementToDestroyComponent: -100000
    }
  },
  computed: {
    ...mapState([
      "user",
      "mitClass",
      "session",
    ]),
    classId () {
      return this.$route.params.class_id; 
    },
    sessionID () {
      return this.session.currentID;
    }
  },
  // database => state 
  watch: {
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
      
      this.activeBoardID = newID;
    },
  }
};
</script>

<style scoped>
.room-wrapper{
  height: 100px;
}
</style>

