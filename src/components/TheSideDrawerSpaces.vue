<template>
  <div>
  <v-list class="pt-0">
    <v-list-item 
      :to="(`/class/${classID}/room/center-table`)"
      color="accent"
      class="blackboard-item"
      active-class="active-blackboard"
    >
      Lecture Hall
    </v-list-item>

    <v-divider/>
    
    <v-expansion-panels v-if="roomCategories.length !== 0" multiple :value="expandedPanels">
      <template v-for="(category, i) in roomCategories">
        <v-expansion-panel :key="i">
          <v-expansion-panel-header>
            {{ category.title }} &nbsp;
            <span class="active-count accent--text"> ({{category.rooms.length}} rooms) </span>
          </v-expansion-panel-header>

           <v-expansion-panel-content> 
            <v-list>
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
                    <v-list-item-content>
                      <v-list-item-title>
                        {{ category.title.substring(0, category.title.length) }} {{ i }}
                        <!-- <span class="active-count accent--text">({{ blackboard.participants.length }} active)</span> -->
                        <span class="active-count accent--text" v-if="blackboard.status">{{ blackboard.status }}</span>
                      </v-list-item-title>
                      <div class="active-blackboard-users pl-4 pt-2">
                        <template v-for="(participant, i) in roomParticipantsMap[blackboard.id]">
                          <div class="d-flex align-center py-2" :key="i">
                            <v-icon>mdi-account</v-icon>
                            <div :class="['pl-1', 'col', 'py-0', participant.rToken === rToken ? 'font-weight-bold':'']">
                              {{ participant.firstName }}
                            </div>

                            <template v-if="participant.rToken === rToken">
                              <BaseButton @click="roomStatusPopup = true" outlined rounded icon="mdi-account-alert">
                                Re-label Space
                              </BaseButton>
                              <v-dialog v-model="roomStatusPopup" persistent max-width="600px">
                                <v-card>
                                  <v-card-title>
                                    <span class="headline">
                                      Update Status
                                    </span>
                                  </v-card-title>

                                  <v-card-text>
                                    <v-text-field v-model="updatedStatus"/>
                                  </v-card-text>

                                  <v-card-actions>
                                    <v-spacer/>

                                    <v-btn @click="roomStatusPopup = false" color="secondary" text>
                                      Cancel
                                    </v-btn>

                                    <v-btn @click="setRoomStatus(updatedStatus)" color="secondary" text>
                                      Update Status
                                    </v-btn>
                                  </v-card-actions>
                                </v-card>
                              </v-dialog>
                                                
                              <!-- <BaseButton @click="hasJoinedMedia=!hasJoinedMedia" 
                                :color="hasJoinedMedia ? 'accent' : 'accent lighten-1'" 
                                :outlined="hasJoinedMedia" 
                                rounded
                                :icon="hasJoinedMedia ? 'mdi-microphone': 'mdi-microphone-off'"
                              >
                                <template v-if="!hasLoadedMedia">
                                  <template v-if="!hasJoinedMedia">Join Video Chat</template>
                                  <v-progress-circular v-else indeterminate size="20" width="2"/>
                                </template>
                                
                                <template v-else>Exit Video Chat</template>
                              </BaseButton> -->
                            </template>
                            <template v-else>
                              <v-icon style="right: 7%">{{participant.isMicOn ? 'mdi-microphone': 'mdi-microphone-off'}}</v-icon>
                              <v-icon style="right: 5%">{{participant.isCameraOn ? 'mdi-video': 'mdi-video-off'}}</v-icon>
                            </template>
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
    <v-btn v-if="blackboards"
      outlined
      large
      block
      @click="isCreatePopupOpen = true"
      color="secondary"
    >
      <v-icon class="pr-2">mdi-plus</v-icon>
      ADD BLACKBOARD
    </v-btn>
    <CreateBlackboardPopup 
      :isCreatePopupOpen="isCreatePopupOpen"
      :roomTypes="roomTypes"
      @popup-closed="isCreatePopupOpen = false"
      @create-blackboard="roomType => createBlackboard(roomType)"
    />
  </v-list>
  </div>
</template>

<script>
import db from "@/database.js";
import firebase from "firebase/app";
import "firebase/firestore";
import BasePopupButton from "@/components/BasePopupButton.vue"; 
import BaseButton from "@/components/BaseButton.vue";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import RealtimeAudio from "@/components/RealtimeAudio.vue";
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
    RealtimeAudio,
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
      roomStatusPopup: false,
      updatedStatus: "",
      mitClassDoc: {},
      isCreatePopupOpen: false,
    };
  },
  computed: {
    ...mapState([
      "user",
      "blackboardRoom",
      "mitClass",
      "rToken"
    ]),
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
    }
  },
  created () {
    const blackboardsRef = db.collection(`classes/${this.classID}/blackboards`);
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
  },
  beforeDestroy () {
    for (const detachListener of this.snapshotListeners) {
      detachListener();
    }
  },
  methods: {
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
    setRoomStatus (status) {
      db.doc(`classes/${this.classID}/blackboards/${this.roomID}`).update({
        status
      });
      this.roomStatusPopup = false;
    },
    createBlackboard (roomType) {
      const blackboardsRef = db.collection(`classes/${this.classID}/blackboards`);
      if (roomType) {
        if (!this.roomTypes.find(type => type === roomType)) {
          const classRef = db.doc(`classes/${this.classID}`);
          classRef.update({
            roomTypes: firebase.firestore.FieldValue.arrayUnion(roomType)
          });
        }
        const newBlackboard = blackboardsRef.add({
          roomType: roomType
        });
        this.isCreatePopupOpen = false;
      }
      else {
        this.$root.$emit("show-snackbar", "Error: Not a valid room type name")
      }
    }
  }
};
</script>
