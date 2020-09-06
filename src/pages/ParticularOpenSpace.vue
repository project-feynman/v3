<template>
  <portal v-if="roomTypeDoc" to="side-drawer">
    <portal to="app-bar">

    </portal>

    <v-row justify="center" align="center" class="px-5">
      <v-btn @click="$router.push(`/class/${classID}`)" icon>
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>

      <v-subheader class="text-subtitle-2 text--secondary pl-2">
        {{ roomTypeDoc.name }}
      </v-subheader>

      <v-spacer/>
    </v-row>

    <v-row v-if="isAdmin" justify="center">
      <BasePopupButton actionName="Shuffle everyone" @action-do="shuffleParticipants(roomTypeDoc.id)">
        <template v-slot:activator-button="{ on }">
          <BaseButton :on="on" icon="mdi-shuffle-variant" small color="black">
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

      <BaseButton @click="showMakeAnnouncementPopup(roomTypeDoc.id)" small icon="mdi-bullhorn" color="black">
        Announce
      </BaseButton>
      
      <BaseButton @click="muteParticipantsInRooms(roomTypeDoc.id)" small icon="mdi-volume-mute" color="black">
        Mute all
      </BaseButton>

      <BaseButton @click="clearRoomStatuses(roomTypeDoc.id)" small icon="mdi-comment-remove" color="black">
        Clear statuses
      </BaseButton>
    </v-row>

    <v-divider class="my-2"/>

    <!-- COMMON ROOM-->
    <v-list-item v-if="commonRoomDoc" :key="commonRoomDoc.id"
      :to="`/class/${classID}/section/${sectionID}/`"
      exact exact-active-class="active-blackboard accent--text"
    >
      <div class="py-5" style="width: 100%">
        <div class="font-weight-medium" :class="$route.params.room_id ? 'text--secondary' : ''" style="font-size: 0.75em">
          COMMON ROOM
        </div>
        <portal-target v-if="!currentRoomID" name="current-room-participants">

        </portal-target>
      </div>
    </v-list-item> 

    <!-- OTHER ROOMS -->
    <v-list-item v-for="(room, i) in nonCommonRooms" :key="room.id"
      :to="`/class/${classID}/section/${sectionID}/room/${room.id}`"
      active-class="active-blackboard accent--text"
    >
      <!-- CASE 1: I'm in the room -->
      <template v-if="room.id === currentRoomID">
        <div class="py-5" style="width: 100%">
          <div class="text-uppercase font-weight-medium" style="font-size: 0.75em">
            Room {{ i + 1 }}
          </div>

          <div class="d-flex">
            <v-chip v-if="room.status" color="blue" class="mt-3" small outlined>
              {{ room.status }}
            </v-chip>

            <v-spacer/>

            <BaseButton @click="setRoomStatusPopup(true, room.id)" icon="mdi-message-alert" color="blue" small>
              Update status
            </BaseButton>
          </div>

          <!-- list of participants -->
          <!-- Get the current Twilio Participants -->
          <portal-target name="current-room-participants">

          </portal-target>
        </div>
      </template>

      <!-- CASE 2: I'm not in the room-->
      <template v-else>
        <div style="width: 100%;">
          <div class="d-flex">
            <div class="text-uppercase font-weight-medium text--secondary" style="font-size: 0.75em">
              Room {{ i+1 }}
            </div>
            <v-spacer/>

            <v-chip v-if="room.status" color="blue" outlined small>
            {{ room.status }}
            </v-chip>
          </div>

          <div class="pl-3">
            <p v-for="p in roomIDToParticipants[room.id]" :key="p.id"
              style="font-weight: 400; font-size: 0.8em"
              class="text--secondary mb-0"
            >
              {{ p.firstName + " " + p.lastName }}
            </p>
          </div>
        </div>
      </template>
    </v-list-item>  

    <BaseButton v-if="isAdmin && rooms.length !== 0" 
      @click="createNewRoom()" 
      block outlined icon="mdi-plus" color="grey"
    >
      New room
    </BaseButton>

    <!-- Twilio Room with Collaborative Blackboard -->
    <portal to="main-content">
      <router-view :key="$route.params.section_id + $route.params.room_id"/>
    </portal>

    <!-- Update status popup TODO: use base popupButton -->
    <template v-if="isInRoom">
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
    
    <!-- TODO: Refactor into TwilioRoom -->
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
    
    <!-- Refactor into RealtimeSpace -->
    <HandleAnnouncements v-if="currentRoomDoc" 
      :roomDoc="currentRoomDoc" 
      :key="currentRoomID + '1'"
    />

    <!-- CONTROL DASHBOARD -->
    <portal to="side-drawer-bottom-region">
      <v-card color="black"  >
        <v-card-title class="mb-0 pb-0 white--text">
          {{ user.firstName + " " + user.lastName }}
        </v-card-title>

        <v-card-text>
          <!-- User mute/deafen/etc. buttons -->
          <portal-target name="destination2">

          </portal-target>
        </v-card-text>
      </v-card>
    </portal>
  </portal>
</template>

<script>
import db from "@/database.js";
import { getRandomId } from "@/helpers.js";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import { mapState, mapGetters } from "vuex"; 
import BaseButton from "@/components/BaseButton.vue";
import BasePopupButton from "@/components/BasePopupButton.vue";
import HandleAnnouncements from "@/components/HandleAnnouncements.vue"; 
import SmallAppBar from "@/components/SmallAppBar.vue";
import firebase from "firebase/app";

export default {
  name: "ParticularOpenSpace",
  mixins: [
    DatabaseHelpersMixin
  ],
  components: {
    SmallAppBar,
    BaseButton,
    BasePopupButton,
    HandleAnnouncements
  },
  data () {
    return {
      roomTypeDoc: null,
      rooms: [],
      participants: [],
      updateParticipantsTimeout: null,
      unsubFuncs: [],
      makeAnnouncementPopup: {
        show: false,
        roomType: null,
        message: null
      },
      roomStatusPopup: {
        show: false,
        roomID: null,
        status: ""
      },
      minRoomSizeOnShuffle: 2
    }
  },
  computed: {
    ...mapState([
      "user",
      "mitClass"
    ]),
    ...mapGetters([
      "isAdmin"
    ]),
    classID () {
      return this.$route.params.class_id; 
    },
    sectionID () {
      return this.$route.params.section_id;
    },
    nonCommonRooms () {
      return this.rooms.filter(room => !room.isCommonRoom)
    },
    isInRoom () { 
      return "room_id" in this.$route.params; 
    },
    currentRoomID () {
      return this.$route.params.room_id;
    },
    commonRoomDoc () {
      for (const room of this.rooms) {
        if (room.isCommonRoom) {
          return room; 
        }
      }
    },
    currentRoomDoc () {
      for (const room of this.rooms) {
        if (room.id === this.currentRoomID) {
          return room; 
        }
      }
    },
    classDocRef () {
      return db.doc(`classes/${this.classID}`);
    },
    roomIDToParticipants () {
      const out = {}; 
      for (const room of this.rooms) {
        out[room.id] = this.participants.filter(p => p.currentRoom === room.id); 
      }
      return out; 
    }
  },
  watch: {
    // Performance-wise, hopefully it's just a pointer 
    roomIDToParticipants (newVal) {
      this.$store.commit("SET_ROOM_ID_TO_PARTICIPANTS", newVal); 
    }
  },
  async created () {
    this.roomTypeDoc = await this.$_getDoc(
      this.classDocRef.collection("roomTypes").doc(this.$route.params.section_id)
    ); 

    // listen to rooms 
    this.unsubFuncs.push(
      this.$_bindVarToDB({
        varName: "rooms",
        dbRef: this.classDocRef.collection("rooms").where("roomTypeID", "==", this.roomTypeDoc.id),
        component: this
      })
    );

    // listen to section participants
    this.unsubFuncs.push(
      this.$_bindVarToDB({
        varName: "participants",
        dbRef: this.classDocRef.collection("participants").where("roomTypeID", "==", this.roomTypeDoc.id),
        component: this
      })
    );
  },
  beforeDestroy () {
    for (const unsubFunc of this.unsubFuncs) {
      unsubFunc(); 
    }
  },
  methods: {
    /**
     * Creates a new room and initalized with 1 blackboard
     * TODO: rename roomType to roomTypeID
     * 
     */
    async createNewRoom () {
      const newDocID = getRandomId();
      await Promise.all([
        this.classDocRef.collection("blackboards").doc(newDocID).set({}),
        this.classDocRef.collection("rooms").add({
          roomTypeID: this.roomTypeDoc.id, 
          blackboards: [newDocID]
        })
      ])
    },
    // TODO: refactor
    setRoomStatusPopup (show, roomID) {
      this.roomStatusPopup = {
        show: show,
        roomID: roomID,
        status: ""
      };
    },
    setRoomStatus (status) {
      db.doc(`classes/${this.classID}/rooms/${this.roomStatusPopup.roomID}`).update({ 
        status 
      });
      this.roomStatusPopup['show'] = false;
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

      // const targetRooms = this.roomTypeToRooms[roomType];
      const targetRooms = this.rooms; 
  
      // Get all UIDs in rooms or roomType, no duplicates
      const targetUIDSet = new Set();
      for (const participant of this.participants) {
        targetUIDSet.add(participant.uid); 
      }
       
      // for (const room of targetRooms) {
      //   for (const participant of this.roomIDToParticipants[room.id]) {
      //     targetUIDSet.add(participant.uid);
      //   }
      // }
      const targetUIDs = Array.from(targetUIDSet);
      console.log("Shuffling participants", targetUIDs);
    
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
    }
  }
}
</script>

<style scoped>
.active-blackboard {
  position: relative;
  /* border-left: 1px solid var(--v-accent-base); */
}
</style>