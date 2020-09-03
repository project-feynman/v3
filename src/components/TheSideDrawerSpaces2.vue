<template>
  <v-expansion-panels v-if="isDataReady" multiple :value="expandedPanels" accordion class="spaces-list">
    <v-expansion-panel v-for="roomType in roomTypes" :key="roomType">
      <v-expansion-panel-header class="panel-header">
        <div class="d-flex flex-column">
          <div :class="roomType === currentRoomType ? '' : 'text--disabled'" style="text-transform: uppercase;">
            {{ roomType }}
          </div>

          <portal to="instructor-only-buttons">
            <div v-if="roomType === currentRoomType && superUserEmails.includes(user.email)">
              <BasePopupButton actionName="Shuffle everyone" @action-do="shuffleParticipants(roomType)">
                <template v-slot:activator-button="{ on }">
                  <BaseButton :on="on" icon="mdi-shuffle-variant" small outlined color="white">
                    Shuffle people
                  </BaseButton>
                </template>
                <template v-slot:message-to-user>
                  <v-row>
                    <v-col cols="12" sm="4">
                      <v-overflow-btn 
                        label="3"
                        :items="[3]"
                        @change="groupSize => minRoomSizeOnShuffle = groupSize"
                      />
                    </v-col>
                    <v-col>
                      <h3 class="mt-5">
                        people per group
                      </h3>
                    </v-col>
                  </v-row>
                </template> 
              </BasePopupButton>

              <BaseButton @click="showMakeAnnouncementPopup(roomType)" small icon="mdi-bullhorn" outlined color="white">
                Do announcement
              </BaseButton>
              
              <BaseButton @click="muteParticipantsInRooms(roomType)" small icon="mdi-volume-mute" outlined color="white">
                Mute everyone
              </BaseButton>

              <BaseButton @click="clearRoomStatuses(roomType)" small icon="mdi-comment-remove" outlined color="white">
                Clear statuses
              </BaseButton>
            </div>
          </portal>
        </div>
      </v-expansion-panel-header>

      <v-expansion-panel-content>
        <v-list dense>
          <template v-for="(room, i) in roomTypeToRooms[roomType]">
            <v-list-item :to="`/class/${classID}/room/${room.id}`"
              :key="room.id"
              active-class="active-blackboard"
              class="py-2 single-room"
            >
              <template v-if="room.id !== currentRoomID">
                <PresentationalRoomUI4 :i="i+1" :allClients="roomIDToParticipants[room.id]">
                  <v-chip v-if="room.status" color="secondary" small>
                    {{ room.status }}
                  </v-chip>
                </PresentationalRoomUI4>
              </template>

              <template v-else>
                <RealtimeSpaceTwilioRoom 
                  :roomID="room.id" 
                  :key="room.id" 
                  :audioDevices="audioDevices"
                  :allClients="roomIDToParticipants[room.id]"
                />
                <div style="width: 100%">
                  <div class="text-uppercase font-weight-medium accent--text" style="font-size: 0.75em">
                    Room {{ i + 1 }}
                  </div>

                  <div class="d-flex">
                    <v-chip v-if="room.status" color="secondary" class="mt-2" small>
                      {{ room.status }}
                    </v-chip>
                    <v-spacer/>
                    <BaseButton @click="setRoomStatusPopup(true, room.id)" icon="mdi-message-alert" color="secondary">
                      Update room status
                    </BaseButton>
                  </div>

                  <!-- Display list of participants -->
                  <portal-target name="destination3">

                  </portal-target>
                </div>
              </template>
            </v-list-item>
          <v-divider v-if="i + 1 < roomDocs.length" :key="i"/>
          </template>
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
            <v-text-field v-model="roomStatusPopup.status" placeholder="(You can empty the status by entering nothing.)"/>
          </v-card-text>
          <v-card-actions>
            <v-spacer/>
            <v-btn @click="roomStatusPopup.show = false" color="secondary" text>
              Cancel
            </v-btn>
            <v-btn @click="setRoomStatus(roomStatusPopup.status)" color="secondary" text>
              Update status
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </template>
    
    <!-- Announcement creation popup -->
    <v-dialog :value="makeAnnouncementPopup.show" persistent max-width="600px">
      <v-card>
        <v-card-title>
          <span class="headline">
            Make Announcement
          </span>
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="makeAnnouncementPopup.message"
            placeholder="Type announcement here..."
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer/>
          <v-btn @click="makeAnnouncementPopup.show = false" color="secondary" text>
            Cancel
          </v-btn>
          <v-btn
            @click="makeAnnouncement(makeAnnouncementPopup.message, makeAnnouncementPopup.roomType)"
            color="secondary"
            text
          >
            Make announcement
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <HandleAnnouncements v-if="currentRoomDoc" :roomDoc="currentRoomDoc" :key="currentRoomID"/>

    <!-- CREATE NEW ROOM -->
    <v-btn @click="isCreateRoomPopupOpen = true" outlined large block color="secondary">
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
import HandleAnnouncements from "@/components/HandleAnnouncements.vue"; 
import BasePopupButton from "@/components/BasePopupButton.vue";

export default {
  mixins: [
    DatabaseHelpersMixin
  ],
  components: {
    BaseButton,
    BasePopupButton,
    RealtimeSpaceTwilioRoom,
    PresentationalRoomUI3,
    PresentationalRoomUI4,
    CreateRoomPopup,
    HandleAnnouncements
  },
  data () {
    return {
      superUserEmails: [
        "eltonlin@mit.edu",
        // 8.01 
        // S1~2
        "josephf@mit.edu",
        "pbarral@mit.edu", 
        
        // S3~4
        "rfletch@mit.edu",  // Richard Fletcher
        "nromeo@mit.edu", // Nicolas Romeo

        // S5~6
        "icisse@mit.edu",
        "oandrews@mit.edu", // Owen Andrews
        
        // S7-8
        "hen@mit.edu", // Henderson
        "bacanua@mit.edu", // Alexandru Bacanu

        // S9/S10
        "tegmark@mit.edu", // Max Tegmark 
        "aktan@mit.edu", // Andrew Tan
        
        // S11 - 12
        "padour@mit.edu", // Peter Dourmashkin
        "rmurdock@mit.edu", // Richard Joshua Murdock

        // S13 - 14
        "mohamedr@mit.edu", // Mohamed Abdelhafez
        "crabb@mit.edu", // Emily Crabb

        // utility TAs
        "sgh256@mit.edu", // Simon Grosse-Holz
        "taweewat@mit.edu", // taweewat@mit.edu
        "achatt@mit.edu", // Arkya Chatterjee
 
        // 18.01
        "larryg@mit.edu",
        "sanjoy@mit.edu",
        "xueyingy@mit.edu",

        // ESG
        "pao@mit.edu", // Paula Rabusco
        "jorloff@mit.edu", // Jeremy Orloff
      ],
      superUserLastNames: [
        'Dourmashkin',
        'Erik',
        'Tan',
        'Lin',
        'Benedikt',
        'Bacanu',
        'Joshua',
        'Somboonpanyakul',
        'Chatterjee',
        'Owen',
        'June',
        'Romeo',
        'Formaggio',
        'J',
        'I',
        'Hen',
        'Abdelhafez',
        'MacDonagh',
        'Velez',
        'C',
        'Ruth',
        'Dunn',
      ],
      unsubFuncs: [],
      
      // Firebase doc objects
      classDoc: null,
      roomDocs: null,
      participantDocs: null,

      // Room status state
      roomStatusPopup: {
        show: false,
        roomID: null,
        status: ""
      },
      
      // Create room state
      isCreateRoomPopupOpen: false,
      
      // Panel expansion
      isExpandedPanelsInitialized: false,
      expandedPanels: [],
      
      // For shuffling
      minRoomSizeOnShuffle: 2, // at least 2 so people aren't lonely AHAHAHAHA
      
      // Announcement stuff
      makeAnnouncementPopup: {
        show: false,
        roomType: null,
        message: null
      },

      // Which audio devices is being used
      audioDevices: {
        input: '',
        output: '',
      }
    };
  },
  computed: {
    ...mapState([
      "user",
      "session"
    ]),
    sessionID () { return this.session.currentID; },
    classID () { return this.$route.params.class_id; },
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
      const ret = {};
      for (const roomType of this.roomTypes) {
        ret[roomType] = this.roomDocs.filter(r => r.roomType === roomType);
      }
      return ret;
    },
    roomIDToParticipants () {
      const ret = {};
      for (const room of this.roomDocs) {
        ret[room.id] = this.participantDocs.filter(p => p.currentRoom === room.id);
      }
      return ret;
    },
    
    // BEGIN properties that rely on isInRoom
    isInRoom () { return "room_id" in this.$route.params; },
    currentRoomID () {
      if (!this.isInRoom) return null;
      return this.$route.params.room_id;
    },
    currentRoomDoc () {
      if (!this.isInRoom || !this.isDataReady) return null;
      for (const roomDoc of this.roomDocs) {
        if (roomDoc.id === this.currentRoomID) {
          return roomDoc;
        }
      }
      return null;
    },
    currentRoomType () {
      if (this.currentRoomDoc === null) return null;
      return this.currentRoomDoc.roomType;
    }
    // END properties that rely on isInRoom
  },
  watch: {
    classDoc (newVal, oldVal) {      
      // Check for new roomAssignments
      // Currently only done for random shuffling.
      // Change snackbar message if this is used for other things.
      if (oldVal !== null
          && newVal.roomAssignmentsCounter != oldVal.roomAssignmentsCounter) {
        this.$root.$emit("show-snackbar", "You have been put in random room with other people. Have fun :)");
        for (const roomAssignment of newVal.roomAssignments) {
          if (roomAssignment.assignees.includes(this.user.uid)) {
            if (this.currentRoomID != roomAssignment.roomID) {
              this.$router.push(`/class/${this.classID}/room/${roomAssignment.roomID}`); 
            }
          }
        }
      }
    },
    currentRoomDoc (newVal, oldVal) {
      if (newVal === null) return;
      
      // Initialize expandedPanels
      if (!this.isExpandedPanelsInitialized) {
        for (const [idx, roomType] of this.roomTypes.entries()) {
          if (roomType === newVal.roomType) {
            this.expandedPanels = [idx];
          }
        }
        this.isExpandedPanelsInitialized = true;
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
    disconnectFromRoom () {
      console.log("disconnectFromRoom()")
      this.$router.push(`/class/${this.$route.params.class_id}`);
      this.$root.$emit(`show-snackbar`, `Succesfully disconnected from the room.`);
    },
    async clearRoomStatuses (roomType) {
      const querySnapshot = await db
        .collection(`classes/${this.classID}/rooms`)
        .where('roomType', '==', roomType)
        .get();

      for (const docSnapshot of querySnapshot.docs) {
        docSnapshot.ref.update({
          status: ""
        });
      }
    },
    setRoomStatusPopup (show, roomID) {
      console.log("show =", show);
      console.log("roomID =", roomID);
      this.roomStatusPopup = {
        show: show,
        roomID: roomID
      };
    },
    setRoomStatus (status) {
      db.doc(`classes/${this.classID}/rooms/${this.roomStatusPopup.roomID}`).update({status});
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
      
      // Get all UIDs in rooms or roomType, no duplicates
      const targetUIDSet = new Set();
      for (const room of targetRooms) {
        for (const participant of this.roomIDToParticipants[room.id]) {
          targetUIDSet.add(participant.uid);
        }
      }
      const targetUIDs = Array.from(targetUIDSet);
      console.log("Breaking out participants:", targetUIDs);
    
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
        Math.floor(targetUIDs.length / this.minRoomSizeOnShuffle)
      ));
      console.log(`Shuffling to ${numRoomsToUse} rooms...`);
      
      shuffle(targetUIDs);
      for (const [idx, uid] of targetUIDs.entries()) {
        roomAssignments[idx % numRoomsToUse].assignees.push(uid);
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
    showMakeAnnouncementPopup (roomType) {
      this.makeAnnouncementPopup = {
        show: true,
        roomType: roomType
      }
    },
    async makeAnnouncement (message, roomType) {      
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
          announcement: {
            message: message,
            
            // TODO: Change this to just writing uid
            // To do this, we need to provide a global way to get information
            // about a user from their uid. This is needed because the author
            // could disconnect after sending an announcement.
            author: {
              firstName: this.user.firstName,
              lastName: this.user.lastName,
            }
          },
          announcementCounter: firebase.firestore.FieldValue.increment(1)
        });
      }
      this.makeAnnouncementPopup['show'] = false;
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
    // bringAllToRoom (roomId, roomType) {
    //   const allToRoomRef = firebase.database().ref(`class/${this.classID}/${roomType}/toRoom`);
    //   allToRoomRef.set({ roomId: roomId }).then(() => {
    //     allToRoomRef.set( { roomId: "" }); //We want to clear it after it notifies everyone
    //   });
    // },
    changeAudioDevices (devices) {
      console.log('new audio devices', devices);
      this.audioDevices = devices;
    }
  }
}
</script>

<style scoped>
.panel-header {
  /* font-weight: 500; */
  font-weight: 500;
  /* text-transform: uppercase; */
  color: #555;
  /* font-size: 0.9em; */
  font-size: 0.8em;
}
.panel-header.v-expansion-panel-header--active {
  color: var(--v-accent-darken1);
}

.room-title {
  font-size: 1em !important;
  font-weight: 400;
  color: #555;
}
.single-room:not(.active-blackboard) {
  background: #f5f5f5;
}
.active-blackboard {
  color: #555;
  position: relative;
  left: -3px;
  border-left: 4px solid var(--v-accent-base);
}
.active-blackboard:before  {
  background: white;
}
.active-blackboard .room-title {
  color: black;
  font-weight: 700;
}
.room-title .active-count {
  font-style: italic;
  font-weight: 400;
  font-size: 0.85em;
  background: blue;
  /* background: var(--v-accent-lighten4); */
  padding: 1px 6px 1px 4px;
  border-radius: 5px;
  /* color: #222; */
  color: white;
}
</style>

<style>
.v-expansion-panel-content__wrap {
  padding: 0
}

.spaces-list .v-expansion-panel-header {
  background: white;
}
.spaces-list .v-expansion-panel-content__wrap {
  padding: 0 5px;
}
.spaces-list .v-expansion-panel--active > .v-expansion-panel-header {
  min-height: unset;
  background-color: #d8d8d8 !important;
}
</style>