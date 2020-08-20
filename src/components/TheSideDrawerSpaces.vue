<template>
  <div class="spaces-list">   
    <v-expansion-panels v-if="roomCategories.length !== 0" multiple :value="expandedPanels" accordion>
      <template v-for="(category, i) in roomCategories">
        <v-expansion-panel :key="i">
          <v-expansion-panel-header>
            <v-row align="center">
              <v-col class="py-0">
                <span class="panel-header-title">
                  {{ category.title }} &nbsp;
                  <!-- <span class="active-count accent--text"> ({{category.rooms.length}} rooms) </span> -->
                </span>
              </v-col>
              <v-col cols="auto" class="py-0 mr-1">
                <template v-if="blackboardRoom && blackboardRoom.roomType === category.title">
                  <BaseIconButton 
                    @click="setAnnouncementPopup(true, category.title)"
                    icon="mdi-bullhorn"
                    color="accent"
                  >Make Announcement</BaseIconButton>
                  
                  <BaseIconButton 
                    @click="bringAllToRoom(blackboardRoom.id, blackboardRoom.roomType)"
                    icon="mdi-share-variant"
                  >Break-out to rooms
                  </BaseIconButton>
                  
                  
                  <v-dialog :value="(announcementPopup.show && (announcementPopup.roomType === category.title))" persistent max-width="600px">
                    <v-card>
                      <v-card-title>
                        <span class="headline">
                          Make Announcement
                        </span>
                      </v-card-title>
                      <v-card-text>
                        <v-text-field v-model="updatedAnnouncement"/>
                      </v-card-text>
                      <v-card-actions>
                        <v-spacer/>
                        <v-btn @click="setAnnouncementPopup(false)" color="secondary" text>
                          Cancel
                        </v-btn>
                        <v-btn @click="makeAnnouncement(updatedAnnouncement, category.title)" color="secondary" text>
                          Update status
                        </v-btn>
                      </v-card-actions>
                    </v-card>
                  </v-dialog>

                  <!--<BasePopupButton actionName="Make Announcement"
                    :inputFields="['Message']"
                    @action-do="payload => makeAnnouncement(payload, category.title)"
                  >
                    <template v-slot:activator-button="{ on }">
                      <v-btn v-on="on" color="accent" text>Announce</v-btn>
                    </template>
                  </BasePopupButton>-->
                </template>
              </v-col>
            </v-row>
          </v-expansion-panel-header>

          <v-expansion-panel-content> 
            <v-list dense>
              <template v-for="(blackboard, i) in category.rooms">
                <!-- we use `$router.push` instead of the `:to` attribute 
                    see https://explain.mit.edu/class/mDbUrvjy4pe8Q5s5wyoD/posts/HQamsmNvtAcYv8xsOIwb 
                -->
                <!-- @click="$router.push(`/class/${classID}/room/${blackboard.id}`)" -->
                  <v-list-item
                    :to="`/class/${classID}/room/${blackboard.id}`"
                    :key="blackboard.id"
                    color="accent"
                    active-class="active-blackboard"
                  >
                    <v-list-item-icon>
                      <v-icon class="pt-2">mdi-monitor-screenshot</v-icon>
                    </v-list-item-icon>
                    <v-list-item-content>
                      <v-list-item-title class="d-flex align-center room-title mb-2">
                        <v-col class="px-0 pb-0 pt-1">
                          {{ category.title.substring(0, category.title.length) }} {{ i }}
                          <!-- <span class="active-count accent--text">({{ blackboard.participants.length }} active)</span> -->
                          <span class="active-count accent--text" v-if="blackboard.status">{{ blackboard.status }}</span>
                        </v-col>
                        <v-col cols="auto" class="px-1 py-0">
                          <template v-if="blackboardRoom">
                            
                            <!-- TODO: causes an infinite loop for some reason -->
                            <BaseIconButton 
                              v-if="blackboardRoom.id === blackboard.id"
                              @click="setRoomStatusPopup(true, blackboard.id)"
                              icon="mdi-message-alert"
                              color="#555"
                            >
                              Label Room
                            </BaseIconButton>
                            
                            <BaseIconButton 
                              v-if="blackboardRoom.id === blackboard.id"
                              @click="bringAllToRoom(blackboardRoom.id, blackboardRoom.roomType)"
                              icon="mdi-account-arrow-left-outline"
                              color="#555"
                              >
                              Bring All to Room
                            </BaseIconButton>
                            <!-- Update status popup -->
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
                        </v-col>
                      </v-list-item-title>



                      <div class="active-blackboard-users pl-4">
                        <template v-for="(participant, i) in roomParticipantsMap[blackboard.id]">
                          <div class="d-flex align-center py-2" :key="i">
                            <v-icon>mdi-account</v-icon>
                            <div :class="['pl-1', 'col', 'py-0', participant.sessionID === sessionID ? 'font-weight-bold':'']">
                              {{ participant.firstName }}
                            </div>
                          </div>
                        </template>
                      </div>
                  </v-list-item-content>
                </v-list-item>
                <v-divider v-if="i + 1 < blackboards.length" :key="i"/>
              </template>
            </v-list>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </template>
    </v-expansion-panels>


    <!-- Create blackboard -->
    <!-- <v-btn v-if="blackboards"
      outlined
      large
      block
      @click="isCreatePopupOpen = true"
      color="secondary"
    >
      <v-icon class="pr-2">mdi-plus</v-icon>
      Create Open Space
    </v-btn>
    <CreateBlackboardPopup 
      :isCreatePopupOpen="isCreatePopupOpen"
      :roomTypes="roomTypes"
      @popup-closed="isCreatePopupOpen = false"
      @create-blackboard="roomType => createBlackboard(roomType)"
    /> -->
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
    CreateBlackboardPopup
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
      roomStatusPopup: {show: false, roomID: null},
      announcementPopup: {show: false, roomType: null},
      updatedStatus: "",
      updatedAnnouncement: "",
      mitClassDoc: {},
      isCreatePopupOpen: false,
    };
  },
  computed: {
    ...mapState([
      "user",
      "blackboardRoom",
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
    mitClassDoc () {
      this.roomTypes = this.mitClassDoc.roomTypes;
    },
    roomTypes () {
      this.setRoomCategories() //reconstruct the roomCategories: warning may be race conditions between this and blackboard watch hook
    },
    blackboardRoom () {
      if (this.expandedPanels.length <= 0) { //only for init we open the panels of where the user is
        const ind = this.roomTypes.indexOf(this.blackboardRoom.roomType)
        this.expandedPanels = [ind]
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
    async shareAudio () {
      const { createLocalAudioTrack } = require('twilio-video');
      createLocalAudioTrack().catch(error => this.tellUserHowToFixError(error));
      const localAudioTrack = await createLocalAudioTrack({ name: `${this.user.firstName}'s audio stream` });
      this.twilioRoom.localParticipant.publishTrack(localAudioTrack);
    },
    setRoomCategories () {
      if (this.roomTypes) {
        this.roomCategories = [];
        for (const type of this.roomTypes) {
          this.roomCategories.push({
            title: type, 
            rooms: this.blackboards.filter(room => room.roomType === type)
          });
        }
      }
      else {
        this.roomCategories = [{ title: "Blackboard Rooms", rooms: this.blackboards }];
      }
    },
    setRoomStatusPopup (show, room=null) {
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
      console.log('the announcement', message);
      console.log("roomType =", roomType);
      const querySnapshot = await db.collection(`classes/${this.classID}/rooms`).where('roomType', '==', roomType).get(); 
      console.log("querySnapshot =", querySnapshot);
      querySnapshot.forEach(doc => {
        // expect this to be run 3 times
        console.log("doc =", doc); 
        doc.ref.update({
          announcement: message
        }); 
      });
      this.announcementPopup['show'] = false;
    },
    bringAllToRoom (roomId, roomType) {
      const allToRoomRef = firebase.database().ref(`class/${this.classId}/${roomType}/toRoom`);
      allToRoomRef.set({ roomId: roomId }).then(() => {
        allToRoomRef.set( { roomId: "" }); //We want to clear it after it notifies everyone
      })
    },
  }
};
</script>

<style scoped>
.panel-header-title {
  font-size: 1.1em;
  font-weight: 700;
}
.room-title {
  font-size: 1em !important;
  font-weight: 400;
}
.room-title .active-count {
  font-style: italic;
  font-weight: 400;
  font-size: 0.9em;
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