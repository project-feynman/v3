<template>
  <v-expansion-panels v-if="isDataReady" multiple accordion>
    <v-expansion-panel v-for="roomType in mitClass.roomTypes" :value="expandedPanels" :key="roomType">
      <v-expansion-panel-header class="panel-header">
        {{ roomType }}
        
        <!-- <BaseButton @click="shuffleParticipants(roomType)" icon="mdi-shuffle-variant" small :stopPropagation="true" color="black">
          Shuffle
        </BaseButton>

        <BaseButton @click="setAnnouncementPopup(true, roomType)" icon="mdi-bullhorn" small color="black" :stopPropagation="true">
          Announce
        </BaseButton>
        
        <BaseButton @click="muteParticipantsInRooms(roomType)" icon="mdi-microphone-off" small :stopPropagation="true" color="black">
          Mute all
        </BaseButton> -->
      </v-expansion-panel-header>

      <v-expansion-panel-content>
        <v-list dense>
          <v-list-item v-for="(room, i) in roomTypeToRooms[roomType]"
            :to="`/class/${$route.params.class_id}/room/${room.id}`"
            :key="room.id"
          >
            <template v-if="room.id !== roomID">
              <PresentationalRoomUI4
                :i="i+1"
                :allClients="roomIDToParticipants[room.id]"
              />
            </template>

            <template v-else>
              <RealtimeSpaceTwilioRoom :roomID="room.id" :key="room.id">
                <template v-slot="{
                  hasConnectedToTwilio,
                  dominantSpeakerUID,
                  toggleMute,
                  isMuted,
                  uidToIsMicEnabled
                }">
                  <PresentationalRoomUI3
                    :i="i+1"
                    :hasConnectedToTwilioRoom="hasConnectedToTwilio"
                    :currentClient="{ uid: user.uid, name: user.firstName + ' ' + user.lastName }"
                    :otherClients="roomIDToParticipants[room.id]"
                    :dominantSpeakerUID="dominantSpeakerUID"
                    :uidToIsMicEnabled="uidToIsMicEnabled"
                    :isMuted="isMuted"
                    @mute-button-pressed="toggleMute()"  
                  >
                    <div class="d-flex">
                      <span class="active-count">{{ room.status }}</span>
                      <BaseButton
                        @click="setRoomStatusPopup(true, room.id)"
                        icon="mdi-message-alert" color="black"
                      >
                        Update status
                      </BaseButton>
                    </div>
                  </PresentationalRoomUI3>
                </template>
              </RealtimeSpaceTwilioRoom>
            </template>
          </v-list-item>
          <!-- <v-divider v-if="i + 1 < roomDocs.length" :key="i"/> -->
        </v-list>
      </v-expansion-panel-content>
    </v-expansion-panel>
    
    <!-- Update status popup -->
    <template v-if="isInRoom">
      <!-- Use BasePopupButton -->
      <v-dialog :value="roomStatusPopup.show" persistent max-width="600px">
        <v-card>
          <v-card-title>
            <span class="headline">
              Update status
            </span>
          </v-card-title>
          <v-card-text>
            <v-text-field v-model="updatedStatus"/>
          </v-card-text>
          <v-card-actions>
            <v-spacer/>
            <v-btn @click="setRoomStatusPopup(false)" color="secondary" text>
              Cancel
            </v-btn>
            <v-btn @click="setRoomStatus(updatedStatus)" color="secondary" text>
              Update status
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </template>
  </v-expansion-panels>
</template>

<script>
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import db from "@/database.js";
import { mapState } from "vuex";

import BaseButton from "@/components/BaseButton.vue";
import RealtimeSpaceTwilioRoom from "@/components/RealtimeSpaceTwilioRoom.vue";
import PresentationalRoomUI3 from "@/components/PresentationalRoomUI3.vue";
import PresentationalRoomUI4 from "@/components/PresentationalRoomUI4.vue";

export default {
  mixins: [
    DatabaseHelpersMixin
  ],
  components: {
    BaseButton,
    RealtimeSpaceTwilioRoom,
    PresentationalRoomUI3,
    PresentationalRoomUI4
  },
  data () {
    return {
      unsubFuncs: [],
      expandedPanels: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      // Firebase doc objects
      roomDocs: null,
      participantDocs: null,

      roomStatusPopup: { show: false, roomID: null },
      updatedStatus: "",
    };
  },
  computed: {
    ...mapState([
      "user",
      "mitClass",
      "session"
    ]),
    sessionID () { return this.session.currentID; },
    classID () { return this.$route.params.class_id; },
    isInRoom () { return "room_id" in this.$route.params; },
    roomID () { return this.$route.params.room_id; },
    isDataReady () {
      return this.roomDocs !== null && this.participantDocs !== null;
    },
    /**
     * GENERAL FORM: { <roomType>: [<room-1>, ..., <room-n>] }.
     * EXAMPLE: { "L01 Dourmashkin": [{ id: "123", status: "Done!" }, { id: "abc", status: "Help!"}] }
     */
    roomTypeToRooms () {
      const roomTypeToRooms = {};
      for (const roomType of this.mitClass.roomTypes) {
        roomTypeToRooms[roomType] =
          this.roomDocs.filter(r => r.roomType === roomType);
      }
      return roomTypeToRooms;
    },
    roomIDToParticipants () {
      const roomIDToParticipants = {};
      for (const room of this.roomDocs) {
        roomIDToParticipants[room.id] =
          this.participantDocs.filter(p => p.currentRoom === room.id);
      }
      return roomIDToParticipants;
    }
  },
  watch: {
    isDataReady (isReady) {
      if (isReady) {
        this.expandedPanels = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // quickfix
        // TODO: expand the panel so when the user refreshes within a room he will see where he is
        // find which roomType the current user is in
        // for (let i = 0; i < this.roomDocs.length; i++) {

        // }
        // const { room_id } = this.$route.params; 
        // if (room_id) {
        //   const currentRoom = this.roomDocs.filter(r => r.id === room_id);
        //   console.log("currentRoom =", currentRoom);
        //   console.log("this.mitClass.roomTypes =", this.mitClass.roomTypes);
        //   this.expandedPanels = [this.mitClass.roomTypes.indexOf(currentRoom.roomType)]
        //   console.log("expandedPanels =", this.expandedPanels);
        // }
      }
    }
  },
  async created () {
    const classRef = db.doc(`/classes/${this.classID}`);
    this.unsubFuncs.push(
      await this.$_listenToCollection(
        classRef.collection("rooms"), this, "roomDocs"
      )
    );

    this.unsubFuncs.push(
      await this.$_listenToCollection(
        classRef.collection("participants"), this, "participantDocs"
      )
    );
  },
  beforeDestroy () {
    for (const unsubFunc in this.unsubFuncs) {
      unsubFunc();
    }
  },
  methods: {
    // TODO: refactor this is so bad
    setRoomStatusPopup (show, roomID = null) {
      console.log("show =", show);
      console.log("roomID =", roomID);
      this.roomStatusPopup = {
        show: show,
        roomID: roomID
      };
    },
    setRoomStatus (status) {
      db.doc(`classes/${this.classID}/rooms/${this.roomID}`).update({status});
      this.roomStatusPopup['show'] = false;
    },
    /**
     * Assigns all participants in rooms of roomType to a random room of
     * roomType. After shuffling, each room has at minimum minRoomSizeOnShuffle
     * participants.
     * */ 
    async shuffleParticipants (roomType) {
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
      
      // Get all rooms of roomType
      const querySnapshot = await db
        .collection(`classes/${this.classID}/rooms`)
        .where('roomType', '==', roomType)
        .get();
      const targetRoomIds = querySnapshot.docs.map(doc => doc.id);
      
      // Get all participants in rooms of roomType
      // roomParticipantsMap : { <roomId>: List<participant-object> }
      const participants = [];
      for (const [roomId, participantList]
            of Object.entries(this.roomParticipantsMap)) {
        if (targetRoomIds.includes(roomId)) {
          participants.push(...participantList);
        }
      }
      console.log("Breaking out participants:", participants);
    
      // Initialize roomAssignments
      const roomAssignments = [];
      for (const roomId of targetRoomIds) {
        roomAssignments.push({
          roomID: roomId,
          assignees: []
        });
      }
      
      const numRoomsToUse = Math.max(1, Math.min(
        targetRoomIds.length,
        Math.floor(participants.length / this.minRoomSizeOnShuffle)
      ));
      shuffle(participants);
      for (const [idx, participant] of participants.entries()) {
        roomAssignments[idx % numRoomsToUse].assignees.push(participant.uid);
      }

      console.log('The room assignments:', roomAssignments);
      // update the class doc
      // each connected user will detect the change and be redirected.
      await db.doc(`classes/${this.classID}`).update({
        roomAssignments: roomAssignments,
        roomAssignmentsCounter: firebase.firestore.FieldValue.increment(1)
      });
    },
    setRoomCategories () {
      if (this.roomTypes) {
        // this.roomCategories = [];
        const tempArray = [];
        for (const type of this.roomTypes) {
          tempArray.push({
            title: type, 
            rooms: this.blackboards.filter(room => room.roomType === type)
          });
        }
        this.roomCategories = tempArray;
        console.log("setRoomCategories =", this.roomCategories);
      } else {
        this.roomCategories = [{ title: "Blackboard Rooms", rooms: this.blackboards }];
      }
    },
    setRoomStatusPopup (show, room = null) {
      console.log("show =", show);
      console.log("roomID =", room);
      this.roomStatusPopup = {
        show: show,
        roomID: room
      }
    },
    setRoomStatus (status) {
      db.doc(`classes/${this.classID}/rooms/${this.roomID}`).update({
        status
      });
      this.roomStatusPopup['show'] = false;
    },
    setAnnouncementPopup (show, roomType=null) {
      this.announcementPopup = {
        show: show,
        roomType: roomType
      }
    },
    createBlackboard (roomType) {
      console.log('the roomtype', roomType);
      const roomsRef = db.collection(`classes/${this.classID}/rooms`);
      const blackboardsRef = db.collection(`classes/${this.classID}/blackboards`);
      if (roomType) {
        if (!this.roomTypes.find(type => type === roomType)) {
          const classRef = db.doc(`classes/${this.classID}`);
          classRef.update({
            roomTypes: firebase.firestore.FieldValue.arrayUnion(roomType)
          });
        }
        // Create a new room and initialize it with a new board
        const newBlackboard = blackboardsRef.add({
          roomType: roomType
        });
        newBlackboard.then(result => {
          const newRoom = roomsRef.add({
            roomType: roomType,
            blackboards: [result.id]
          });
        })
        this.isCreatePopupOpen = false;
      }
      else {
        this.$root.$emit("show-snackbar", "Error: Not a valid room type name")
      }
    },
    async initSlides () {
      const roomsRef = db.collection(`classes/${this.classID}/rooms`);
      // Return if rooms already exists in a class
      let initialized = false;
      await roomsRef.limit(1).get().then(querySnapshot => {
        if (!querySnapshot.empty) initialized = true;
      })
      if (initialized) return;
      
      await db.collection(`classes/${this.classID}/blackboards`).get().then(querySnapshot => {
        console.log('inside the query', querySnapshot.empty)
        querySnapshot.forEach(doc => {
          console.log('the doc', doc.id);
          roomsRef.add({
            participants: doc.data().participants || [],
            roomType: doc.data().roomType,
            status: doc.data().status || '',
            blackboards: [doc.id],
          })
        })
      })
    },
    async makeAnnouncement (message, roomType) {
      console.log("Making announcement:", message);
      const querySnapshot = await db
        .collection(`classes/${this.classID}/rooms`)
        .where('roomType', '==', roomType)
        .get(); 
      for (const docSnapshot of querySnapshot.docs) {
        docSnapshot.ref.update({
          announcement: message,
          announcementCounter: firebase.firestore.FieldValue.increment(1)
        });
      }
      this.announcementPopup['show'] = false;
    },
    /**
     * Mutes all participants in rooms of roomType
     * Does this by incrementing a counter in each targeted room.
     * This counter is watched by participants inside the rooms.
     * TODO: Can be refactored such that there is a single counter for each
     *       roomType and participants all watch the roomType counter.
     * */
    async muteParticipantsInRooms(roomType) {
      console.log("Muting all participants in roomType:", roomType);
      const querySnapshot = await db
        .collection(`classes/${this.classID}/rooms`)
        .where('roomType', '==', roomType)
        .get();
      for (const docSnapshot of querySnapshot.docs) {
        docSnapshot.ref.update(
          "muteAllCounter",
          firebase.firestore.FieldValue.increment(1)
        );
      }
    },
    bringAllToRoom (roomId, roomType) {
      const allToRoomRef = firebase.database().ref(`class/${this.classID}/${roomType}/toRoom`);
      allToRoomRef.set({ roomId: roomId }).then(() => {
        allToRoomRef.set( { roomId: "" }); //We want to clear it after it notifies everyone
      })
    }
  }
}
</script>

<style scoped>
.panel-header {
  font-weight: 500;
  text-transform: uppercase;
  color: #777;
  font-size: 0.8em;
}
.room-title {
  font-size: 1em !important;
  font-weight: 400;
  color: #555;
}
.active-blackboard {
  color: #EB8800
}
.active-blackboard:before  {
  background: var(--v-accent-base);
}
.active-blackboard .room-title {
  color: black;
  font-weight: 700;
}
.room-title .active-count {
  font-style: italic;
  font-weight: 400;
  font-size: 0.85em;
  background: var(--v-accent-lighten4);
  padding: 1px 6px 1px 4px;
  border-radius: 5px;
  color: #222;
}
</style>

<style>
.spaces-list .v-expansion-panel-header {
  background: #f5f5f5;
}
.spaces-list .v-expansion-panel-content__wrap {
  padding: 0 5px;
}
.spaces-list .v-expansion-panel--active > .v-expansion-panel-header {
  min-height: unset;
  background-color: #d8d8d8 !important;
}
</style>