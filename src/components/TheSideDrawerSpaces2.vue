<template>
  <v-expansion-panels v-if="isDataReady" multiple :value="expandedPanels" accordion>
    <v-expansion-panel v-for="roomType in roomTypes" :key="roomType">
      <v-expansion-panel-header class="panel-header">
        {{ roomType }}
        
        <BaseButton
          @click="shuffleParticipants(roomType)"
          icon="mdi-shuffle-variant"
          small
          :stopPropagation="true"
          color="black"
        >
          Shuffle
        </BaseButton>

        <BaseButton
          @click="triggerAnnouncementPopup(roomType)"
          icon="mdi-bullhorn"
          small
          color="black"
          :stopPropagation="true"
        >
          Announce
        </BaseButton>
        
        <BaseButton
          @click="muteParticipantsInRooms(roomType)"
          icon="mdi-microphone-off"
          small
          :stopPropagation="true"
          color="black"
        >
          Mute all
        </BaseButton>
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
              >
                <p class="blue--text">
                  {{ room.status }}
                </p>
              </PresentationalRoomUI4>
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
                      <p class="align-self-center mb-0 blue--text">
                        {{ room.status }}
                      </p>
                      <v-spacer/>
                      <BaseButton
                        @click="setRoomStatusPopup(true, room.id)"
                        icon="mdi-message-alert" color="blue"
                      >
                        Update room status
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
    
    <!-- Announcement popup -->
    <v-dialog :value="announcementPopup.show" persistent max-width="600px">
      <v-card>
        <v-card-title>
          <span class="headline">
            Make Announcement
          </span>
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="announcementPopup.announceMessage"
            placeholder="Type announcement here..."
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer/>
          <v-btn @click="announcementPopup.show = false" color="secondary" text>
            Cancel
          </v-btn>
          <v-btn
            @click="makeAnnouncement(announcementPopup.announceMessage, announcementPopup.roomType)"
            color="secondary"
            text
          >
            Make announcement
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Create new room stuff -->
    <v-btn
      outlined
      large
      block
      @click="isCreateRoomPopupOpen = true"
      color="secondary"
    >
      <v-icon class="pr-2">mdi-plus</v-icon>
      Create New Room
    </v-btn>
    <CreateRoomPopup 
      :isCreatePopupOpen="isCreateRoomPopupOpen"
      :roomTypes="roomTypes"
      @popup-closed="isCreateRoomPopupOpen = false"
      @create-room="roomType => createRoom(roomType)"
    />
  </v-expansion-panels>
  
</template>

<script>
import firebase from "firebase/app";
import db from "@/database.js";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import { mapState } from "vuex";

import BaseButton from "@/components/BaseButton.vue";
import RealtimeSpaceTwilioRoom from "@/components/RealtimeSpaceTwilioRoom.vue";
import PresentationalRoomUI3 from "@/components/PresentationalRoomUI3.vue";
import PresentationalRoomUI4 from "@/components/PresentationalRoomUI4.vue";
import CreateRoomPopup from "@/components/CreateRoomPopup.vue";

export default {
  mixins: [
    DatabaseHelpersMixin
  ],
  components: {
    BaseButton,
    RealtimeSpaceTwilioRoom,
    PresentationalRoomUI3,
    PresentationalRoomUI4,
    CreateRoomPopup
  },
  data () {
    return {
      unsubFuncs: [],
      
      // Firebase doc objects
      classDoc: null,
      roomDocs: null,
      participantDocs: null,

      // Room status state
      roomStatusPopup: { show: false, roomID: null },
      updatedStatus: "",
      
      // Create room state
      isCreateRoomPopupOpen: false,
      
      // Panel expansion
      isExpandedPanelsInitialized: false,
      expandedPanels: [],
      
      // For shuffling
      minRoomSizeOnShuffle: 2, // at least 2 so people aren't lonely
      
      announcementPopup: {
        show: false,
        roomType: null,
        announceMessage: null
      },
    };
  },
  computed: {
    ...mapState([
      "user",
      "session"
    ]),
    sessionID () { return this.session.currentID; },
    classID () { return this.$route.params.class_id; },
    isInRoom () { return "room_id" in this.$route.params; },
    roomID () { return this.$route.params.room_id; },
    isDataReady () {
      return ![
        this.classDoc,
        this.roomDocs,
        this.participantDocs
      ].includes(null);
    },
    // Computed properties below should only be used after data is ready.
    roomTypes () {
      return this.classDoc.roomTypes;
    },
    /**
     * GENERAL FORM: { <roomType>: [<room-1>, ..., <room-n>] }.
     * EXAMPLE: { "L01 Dourmashkin": [{ id: "123", status: "Done!" }, { id: "abc", status: "Help!"}] }
     */
    roomTypeToRooms () {
      const roomTypeToRooms = {};
      for (const roomType of this.roomTypes) {
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
      if (isReady && this.isInRoom && !this.isExpandedPanelsInitialized) {
        for (const room of this.roomDocs) {
          if (room.id === this.roomID) {
            for (const [idx, roomType] of this.roomTypes.entries()) {
              if (roomType === room.roomType) {
                this.expandedPanels = [idx];
              }
            }
          }
          this.isExpandedPanelsInitialized = true;
        }
      }
    },
    classDoc (newVal, oldVal) {      
      // Check for new roomAssignments
      // Currently only done for random shuffling.
      // Change snackbar message if this is used for other things.
      if (oldVal !== null
          && newVal.roomAssignmentsCounter != oldVal.roomAssignmentsCounter) {
        this.$root.$emit("show-snackbar", "You have been put in random room with other people. Have fun :)");
        for (const roomAssignment of newVal.roomAssignments) {
          if (roomAssignment.assignees.includes(this.user.uid)) {
            if (this.roomID != roomAssignment.roomID) {
              this.$router.push(`/class/${this.classID}/room/${roomAssignment.roomID}`); 
            }
          }
        }
      }
    }
  },
  async created () {
    const classRef = db.doc(`/classes/${this.classID}`);
    
    this.unsubFuncs.push(
      await this.$_listenToDoc(classRef, this, "classDoc")
    );

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
    for (const unsubFunc of this.unsubFuncs) {
      unsubFunc();
    }
  },
  methods: {
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
      const targetRooms = this.roomTypeToRooms[roomType];
      const targetParticipants = [];
      for (const room of targetRooms) {
        targetParticipants.push(...this.roomIDToParticipants[room.id]);
      }
      console.log("Breaking out participants:", targetParticipants);
    
      // Initialize roomAssignments
      const roomAssignments = [];
      for (const room of targetRooms) {
        roomAssignments.push({
          roomID: room.id,
          assignees: []
        });
      }
      
      const numRoomsToUse = Math.max(1, Math.min(
        targetRooms.length,
        Math.floor(targetParticipants.length / this.minRoomSizeOnShuffle)
      ));
      console.log(`Shuffling to ${numRoomsToUse} rooms...`);
      
      shuffle(targetParticipants);
      for (const [idx, participant] of targetParticipants.entries()) {
        roomAssignments[idx % numRoomsToUse].assignees.push(participant.uid);
      }

      // update the class doc
      // each connected user will detect the change and be redirected.
      await db.doc(`classes/${this.classID}`).update({
        roomAssignments: roomAssignments,
        roomAssignmentsCounter: firebase.firestore.FieldValue.increment(1)
      });
    },
    /**
     * Creates a new room of type roomType.
     */
    createRoom (roomType) {
      console.log(`Creating room of roomType={roomType}`, roomType);
      
      if (!roomType) {
        this.$root.$emit("show-snackbar", "Error: Not a valid room type name");
        return;
      }
      
      if (!this.roomTypes.includes(roomType)) {     
        // Add new roomType to firestore   
        db.doc(`classes/${this.classID}`).update({
          roomTypes: firebase.firestore.FieldValue.arrayUnion(roomType)
        });
      }
      
      // Create a new blackboard and a new room
      // Then link the two together
      const newBlackboard = db
        .collection(`classes/${this.classID}/blackboards`)
        .add({roomType: roomType});
      newBlackboard.then(result => {
        db.collection(`classes/${this.classID}/rooms`).add({
          roomType: roomType,
          blackboards: [result.id]
        });
      });
      this.isCreatePopupOpen = false;
    },
    triggerAnnouncementPopup (roomType) {
      this.announcementPopup = {
        show: true,
        roomType: roomType
      }
    },
    async makeAnnouncement (message, roomType) {
      console.log("Making announcement...");
      console.log("Announcement message:", message);
      console.log("Annoucement roomType:", roomType);
      
      if (!message) {
        this.$root.$emit("show-snackbar", "Invalid announcement message");
        return;
      }
      
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
    // TODO: Change to use firestore
    bringAllToRoom (roomId, roomType) {
      const allToRoomRef = firebase.database().ref(`class/${this.classID}/${roomType}/toRoom`);
      allToRoomRef.set({ roomId: roomId }).then(() => {
        allToRoomRef.set( { roomId: "" }); //We want to clear it after it notifies everyone
      });
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
.v-expansion-panel-content__wrap {
  padding: 0
}

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