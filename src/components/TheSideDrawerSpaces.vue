<template>
  <div class="spaces-list">   
    <v-expansion-panels v-if="roomCategories.length !== 0" :value="expandedPanels" multiple accordion>
      <template v-for="(category, i) in roomCategories">
        <v-expansion-panel :key="i">
          <v-expansion-panel-header :class="(blackboardRoom && blackboardRoom.roomType === category.title) ? 'py-2 px-4': 'px-4'">
            <v-row align="center" style="overflow: hidden;">
              <v-col cols="12" class="py-0">
                <span class="panel-header-title">
                  {{ category.title }} &nbsp;
                </span>
              </v-col>
              <v-col cols="12" class="py-0 px-0 mr-1">
                <template v-if="blackboardRoom && blackboardRoom.roomType === category.title">
                  <template v-if="user.lastName === 'Dourmashkin' || user.lastName === 'Lin'">
                    <!-- Split to random groups -->
                    <BaseButton
                      @click="shuffleParticipants(category.title)"
                      icon="mdi-call-split"
                      small
                      :stopPropagation="true"
                      color="black"
                    >
                      Split up
                    </BaseButton>

                    <!-- Make announcement -->
                    <BaseButton 
                      @click="setAnnouncementPopup(true, category.title)"
                      icon="mdi-bullhorn"
                      small
                      color="black"
                      :stopPropagation="true"
                    >
                      Announce
                    </BaseButton>

                    <!-- TODO: Bring everyone back to common room -->
                    <!-- <BaseButton 
                      icon="mdi-account-group"
                      small
                      color="black"
                    >
                      Re-group
                    </BaseButton> -->
                    
                    <BaseButton 
                      @click="muteParticipantsInRooms(category.title)"
                      icon="mdi-microphone-off"
                      small
                      :stopPropagation="true"
                      color="black"
                    >
                      Mute all
                    </BaseButton>
                  </template>
                  
                  <!-- TODO: use ID instead of title -->     
                  <!-- <v-btn
                    @click.stop="moveStudentsToRooms(category.title)"
               
                  >
                    Break-out to rooms
                  </v-btn> -->
                  
                  <!-- Announcement Popup-->
                  <v-dialog :value="(announcementPopup.show && (announcementPopup.roomType === category.title))" persistent max-width="600px">
                    <v-card>
                      <v-card-title>
                        <span class="headline">
                          Make Announcement
                        </span>
                      </v-card-title>
                      <v-card-text>
                        <v-text-field v-model="updatedAnnouncement" placeholder="Type announcement here..."/>
                      </v-card-text>
                      <v-card-actions>
                        <v-spacer/>
                        <v-btn @click="setAnnouncementPopup(false)" color="secondary" text>
                          Cancel
                        </v-btn>
                        <v-btn @click="makeAnnouncement(updatedAnnouncement, category.title)" color="secondary" text>
                          Make announcement
                        </v-btn>
                      </v-card-actions>
                    </v-card>
                  </v-dialog>
                </template>
              </v-col>
            </v-row>
          </v-expansion-panel-header>

          <v-expansion-panel-content> 
            <v-list dense>
              <template v-for="(blackboard, i) in category.rooms">
                <v-list-item :to="`/class/${classID}/room/${blackboard.id}`" :key="blackboard.id">

                  <!-- Update status popup -->
                  <template v-if="blackboardRoom">
                    <v-dialog :value="(roomStatusPopup.show && (roomStatusPopup.roomID === blackboard.id))" persistent max-width="600px">
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



                  <!-- 
                    THE CURRENT ROOM 
                  -->
                  <template v-if="blackboardRoom">
                    <template v-if="blackboard.id === blackboardRoom.id">
                      <!-- 
                        :key ensures <TwilioRoom/> is destroyed and re-created when the user moves 
                      -->
                      <RealtimeSpaceTwilioRoom :roomID="blackboardRoom.id" :key="blackboardRoom.id">
                        <template v-slot="{ 
                          hasConnectedToTwilio,
                          dominantSpeakerUID,
                          toggleMute,
                          isMuted
                        }"
                        >
                          <div class="accent--text headline">Room {{ i+1 }}</div>
                          <v-col class="d-flex accent--text"> 
                            {{ blackboard.status }}
                            <BaseButton @click="setRoomStatusPopup(true, blackboard.id)" icon="mdi-message-alert" color="black">
                              Update status
                            </BaseButton>
                          </v-col> 
                          <v-divider/>
                      
                          <v-list-item-content>
                            <template v-for="(participant, i) in roomParticipantsMap[blackboard.id]">
                              <div :key="i">
                                <!-- MYSELF -->
                                <template v-if="participant.sessionID === sessionID">
                                  <v-col class="d-flex">
                                    <v-icon>mdi-account</v-icon>

                                    <p class="font-weight-bold">{{ participant.firstName }} </p>

                                    <p v-if="!hasConnectedToTwilio">Connecting audio...</p>

                                    <BaseButton v-else
                                      @click="toggleMute()" 
                                      :icon="isMuted ? 'mdi-microphone' : 'mdi-microphone-off'" 
                                      color="black" 
                                      :stopPropagation="false"
                                    >
                                      {{ isMuted ? "Unmute" : "Mute" }}
                                    </BaseButton>
                                  </v-col>
                                </template>
                                
                                <!-- OTHER PEOPLE -->
                                <template v-else>
                                  <v-col class="d-flex">
                                    <v-icon>mdi-account</v-icon>
                                    {{ participant.firstName }} 
                                    <v-icon :color="dominantSpeakerUID === participant.uid ? 'accent' : 'black'">
                                      mdi-microphone
                                    </v-icon>    
                                  </v-col>
                                </template>               
                              </div>
                            </template>
                          </v-list-item-content>
                        </template>
                      </RealtimeSpaceTwilioRoom>
                    </template>

                    <!-- OTHER ROOMS -->
                    <template v-else>
                      <div>Room {{ i+1 }}</div>
                      <div>{{ blackboard.status }}</div>
                      <v-col v-for="(participant, i) in roomParticipantsMap[blackboard.id]" class="d-flex" :key="i">
                        <v-icon>mdi-account</v-icon>
                        {{ participant.firstName }}
                      </v-col>
                    </template>
                  </template>
                </v-list-item>
                <v-divider v-if="i + 1 < blackboards.length" :key="i"/>
              </template>
            </v-list>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </template>
    </v-expansion-panels>

    <!-- CREATE BLACKBOARD -->
    <!-- <v-btn v-if="blackboards"
      outlined
      large
      block
      @click="isCreatePopupOpen = true"
      color="secondary"
    >
      <v-icon class="pr-2">mdi-plus</v-icon>
      Create Open Space
    </v-btn> -->

    <CreateBlackboardPopup 
      :isCreatePopupOpen="isCreatePopupOpen"
      :roomTypes="roomTypes"
      @popup-closed="isCreatePopupOpen = false"
      @create-blackboard="roomType => createBlackboard(roomType)"
    />
  </div>
</template>

<script>
import db from "@/database.js";
import firebase from "firebase/app";
import "firebase/firestore";
import BasePopupButton from "@/components/BasePopupButton.vue"; 
import BaseButton from "@/components/BaseButton.vue";
import BaseIconButton from "@/components/BaseIconButton.vue";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import CreateBlackboardPopup from "@/components/CreateBlackboardPopup.vue";
import RealtimeSpaceTwilioRoom from "@/components/RealtimeSpaceTwilioRoom.vue";
import { mapState } from "vuex";
import Vue from 'vue';

export default {
  props: {
    roomParticipantsMap: Object
  },
  mixins: [
    DatabaseHelpersMixin
  ],
  components: {
    BasePopupButton,
    BaseButton,
    BaseIconButton,
    CreateBlackboardPopup,
    RealtimeSpaceTwilioRoom
  },
  data () {
    return {
      snapshotListeners: [],
      centerTableParticipants: [],
      blackboards: [],
      // hasLoadedMedia: false,
      // hasJoinedMedia: false,
      savedRoomId: "",
      roomTypes: [],
      roomCategories: [],
      expandedPanels: [],
      roomStatusPopup: { show: false, roomID: null },
      announcementPopup: { show: false, roomType: null },
      updatedStatus: "",
      updatedAnnouncement: "",
      mitClassDoc: null,
      isCreatePopupOpen: false,
      minRoomSizeOnShuffle: 2, // at least 2 so people aren't lonely
    };
  },
  computed: {
    ...mapState([
      "user",
      "blackboardRoom",
      "twilioRoom",
      "dominantSpeakerUID",
      "isConnectedToAudio",
      "mitClass",
      "session"
    ]),
    sessionID () {
      return this.session.currentID;
    },
    classID () {
      return this.$route.params.class_id;
    },
    roomID () {
      return this.$route.params.room_id;
    },
  },
  watch: {
    blackboards () {
      this.setRoomCategories() // reconstruct the roomCategories
    },
    mitClassDoc (newVal, oldVal) {
      this.roomTypes = this.mitClassDoc.roomTypes;
            
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
    },
    roomTypes () {
      this.setRoomCategories() //reconstruct the roomCategories: warning may be race conditions between this and blackboard watch hook
    },
    blackboardRoom () {
      if (this.expandedPanels.length <= 0) { //only for init we open the panels of where the user is
        const ind = this.roomTypes.indexOf(this.blackboardRoom.roomType);
        this.expandedPanels = [ind];
      }
    },
    // TODO
    numberOfBlackboards () {
      this.blackboards.forEach(blackboard => {
        const blackboardsRef = db.collection(`classes/${this.classID}/rooms`);
        const participantsRef = blackboardsRef.doc(blackboard.id).collection("participants");
        Vue.set(this.roomParticipantsMap, blackboard.id, []); // this makes each entry in the object reactive.
        this.$_listenToCollection(participantsRef, this.roomParticipantsMap, blackboard.id).then(snapshotListener => {
          this.snapshotListeners.push(snapshotListener);
        });
      })
    }
  },
  created () {
    const blackboardsRef = db.collection(`classes/${this.classID}/rooms`);
    const participantsRef = db.collection(`classes/${this.classID}/participants`);
    const classRef = db.doc(`classes/${this.classID}`)
    
    this.$_listenToCollection(blackboardsRef, this, "blackboards").then(snapshotListener => {
      this.snapshotListeners.push(snapshotListener);
    });
    this.$_listenToCollection(participantsRef, this, "centerTableParticipants").then(snapshotListener => {
      this.snapshotListeners.push(snapshotListener);
    });
    this.$_listenToDoc(classRef, this, "mitClassDoc").then(snapshotListener => {
      this.snapshotListeners.push(snapshotListener);
    });
    this.initSlides();
  },
  beforeDestroy () {
    for (const detachListener of this.snapshotListeners) {
      detachListener();
    }
  },
  methods: {
    /**
     * TODO: 
     *  1. DRY: the same method is currently re-declared in TheSiderawerSpaces.vue and TwilioRoom.vue
     *  2. Apparently the mic does not turn off even when you leave explain.mit.edu
     */
    /*async shareAudio () {
      console.log("shareAudio");
      const { createLocalAudioTrack } = require('twilio-video');
      createLocalAudioTrack().catch(error => this.tellUserHowToFixError(error));
      const localAudioTrack = await createLocalAudioTrack({ name: `${this.user.firstName}'s audio stream` });
      this.twilioRoom.localParticipant.publishTrack(localAudioTrack);
      this.$store.commit("SET_IS_CONNECTED_TO_AUDIO", true);
    },*/
    /**
     * Mutes/unmutes the user's microphone
     * 
     */
    /*muteMicrophone () {
      console.log("muteMicrophone() twilioRoom =", this.twilioRoom);
      const { audioTracks } = this.twilioRoom.localParticipant; 
      audioTracks.forEach(audioTrack => {
        audioTrack.unpublish();
        console.log("audioTrack is now unpublished =", audioTrack);
      });
      console.log("after muting, twilioRoom =", this.twilioRoom);
      this.$store.commit("SET_IS_CONNECTED_TO_AUDIO", false);
    },*/
    // TODO: put the method in Vuex
    /*tellUserHowToFixError (error) {
      this.isShowingErrorPopup = true; 

      // give a specific, helpful error message
      if (error.name === "NotFoundError") {
        this.whyItFailed = `Your laptop or iPad's audio device is currently disabled in this browser.`;
        this.howToFix = `Enable your audio device for the browser in the system settings.`;
      } else if (error.name === "NotAllowedError") {
        this.whyItFailed = `At some point, you dismissed or denied the popup that asked for access to your microphone`
        this.howToFix = `
          Give access to your microphone by doing the following steps: 
            1. Click the small, circular "i" button near the left of "https://explain.mit.edu/...." 
            2. Find the settings somewhere for the audio microphone and switch to "allow" 
            3. Reload the entire website. 
        `;
      } else {
        this.whyItFailed = `Failed to acquire audio media because: ${error.message}`;
        this.howToFix = "";
      }
    },*/
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
    },
  }
};
</script>

<style scoped>
.panel-header-title {
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