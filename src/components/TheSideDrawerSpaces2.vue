<template>
  <v-expansion-panels v-if="isDataReady" multiple accordion>
    <v-expansion-panel v-for="roomType in mitClass.roomTypes" :key="roomType">
      <v-expansion-panel-header>{{ roomType }}</v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-list dense>
          <v-list-item v-for="(room, i) in roomTypeToRooms[roomType]" 
            :to="`/class/${$route.params.class_id}/room/${room.id}`"
            :key="room.id"
          >
            <div>Room {{ i+1 }}</div>
            <div v-for="person in roomIDToParticipants[room.id]" :key="person.id">
              {{ person.firstName + " " + person.lastName }} 
            </div>
          </v-list-item>
        </v-list>
      </v-expansion-panel-content>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script>
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js"; 
import db from "@/database.js";
import { mapState } from "vuex"; 

export default {
  mixins: [
    DatabaseHelpersMixin
  ],
  data () {
    return {
      allRooms: null,
      allParticipants: null,
      isDataReady: false
    }; 
  },
  async created () {
    const classRef = db.doc(`/classes/${this.$route.params.class_id}`);
    await Promise.all([
      this.$_listenToCollection(classRef.collection("rooms"), this, "allRooms"),
      this.$_listenToCollection(classRef.collection("participants"), this, "allParticipants")
    ]);
    this.isDataReady = true; 
  },
  computed: {
    ...mapState([
      "mitClass"
    ]),
    /**
     * GENERAL FORM: { <roomType>: [<room-1>, ..., <room-n>] }.
     * EXAMPLE: { "L01 Dourmashkin": [{ id: "123", status: "Done!" }, { id: "abc", status: "Help!"}] }
     */
    roomTypeToRooms () {
      const roomTypeToRooms = {}; 
      for (const roomType of this.mitClass.roomTypes) {
        roomTypeToRooms[roomType] = this.allRooms.filter(r => r.roomType === roomType); 
      }
      return roomTypeToRooms;
    },
    roomIDToParticipants () {
      // console.log("roomIDToParticipants changed =", this.roomIDToParticipants);
      const roomIDToParticipants = {}; 
      for (const room of this.allRooms) {
        roomIDToParticipants[room.id] = this.allParticipants.filter(p => p.currentRoom === room.id); 
      }
      return roomIDToParticipants; 
    }
  }
}
</script>