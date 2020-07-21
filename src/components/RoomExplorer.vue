<template>
  <!-- 
  <v-btn v-if="blackboards"
    outlined
    large
    block
    :disabled="blackboards.length > 20" 
    @click="createBlackboard()"
    color="secondary"
  >
    <v-icon class="pr-2">mdi-plus</v-icon>
    CREATE BLACKBOARD
  </v-btn> -->
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
            {{ category.title }}
          </v-expansion-panel-header>

           <v-expansion-panel-content> 
            <v-list>
              <template v-for="(blackboard, i) in category.rooms">
                <!-- we use `$router.push` instead of the `:to` attribute 
                    see https://explain.mit.edu/class/mDbUrvjy4pe8Q5s5wyoD/posts/HQamsmNvtAcYv8xsOIwb 
                -->
                <!-- @click="$router.push(`/class/${classID}/room/${blackboard.id}`)" -->
                  <v-list-item
                    @click="$router.push(`/class/${classID}/room/${blackboard.id}`)"
                    :key="blackboard.id"
                    color="accent"
                    class="active-blackboard"
                    active-class="active-blackboard"
                  >
                    <v-list-item-content >
                      <v-list-item-title>
                        Space {{ i }}
                        <!-- <span class="active-count accent--text">({{ blackboard.participants.length }} active)</span> -->
                        <span class="active-count accent--text" v-if="blackboard.status">{{ blackboard.status }}</span>
                      </v-list-item-title>
                      <div class="active-blackboard-users pl-4 pt-2">
                        <template v-for="(participant, i) in roomParticipantsMap[blackboard.id]">
                          <div class="d-flex align-center py-2" :key="i">
                            <v-icon>mdi-account</v-icon>
                            <div :class="['pl-1', 'col', 'py-0', participant.uid === user.uid ? 'font-weight-bold':'']">
                              {{ participant.firstName }}
                            </div>

                            <template v-if="user.uid === participant.uid">
                              <ButtonNew @click="roomStatusPopup = true" outlined rounded icon="mdi-account-alert">
                                Re-label Space
                              </ButtonNew>
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
                                                
                              <ButtonNew @click="hasJoinedMedia=!hasJoinedMedia" 
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
                              </ButtonNew>
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
  </v-list>
  <LiveBoardAudio 
      v-if="user"
      :roomId="lastBlackboardRoomId"
      :hasJoinedMedia="hasJoinedMedia"
      :blackboardRoom="blackboardRoom"
      @left-room="hasJoinedMedia=false; hasLoadedMedia=false;"
      @media-connected="hasLoadedMedia=true"
      :key="lastBlackboardRoomId"
    />
  </div>
</template>

<script>
import db from "@/database.js";
import BasePopupButton from "@/components/BasePopupButton.vue"; 
import ButtonNew from "@/components/ButtonNew.vue";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import LiveBoardAudio from "@/components/LiveBoardAudio.vue";
import { mapState } from "vuex";
import Vue from 'vue';

export default {
  mixins: [
    DatabaseHelpersMixin
  ],
  components: {
    BasePopupButton,
    ButtonNew,
    LiveBoardAudio
  },
  data () {
    return {
      snapshotListeners: [],
      centerTableParticipants: [],
      blackboards: [],
      hasLoadedMedia: false,
      hasJoinedMedia: false,
      savedRoomId: "",
      roomTypes: [],
      roomCategories: [],
      expandedPanels: [],
      roomStatusPopup: false,
      updatedStatus: "",
      roomParticipantsMap: {}
    };
  },
  computed: {
    ...mapState([
      "user",
      "blackboardRoom",
      "mitClass"
    ]),
    classID () {
      return this.$route.params.class_id;
    },
    roomID () {
      return this.$route.params.room_id;
    },
    lastBlackboardRoomId () {
      if (this.roomID) {
        this.savedRoomId = this.roomID;
      }
      return this.savedRoomId;
    }
  },
  watch: {
    blackboards () {
      console.log("triggeredBlackboards", this.blackboards)
      if (this.mitClass.roomTypes) {
        this.roomCategories = [];
        for (const type of this.mitClass.roomTypes) {
          this.roomCategories.push({
            title: type, 
            rooms: this.blackboards.filter(room => room.roomType === type)
          });
        }
      }
      else {
        this.roomCategories = [{ title: "Blackboard Rooms", rooms: this.blackboards }]
      }
      // the collapsible should be completely open by default
      this.expandedPanels = []; 
      for (let i = 0; i < this.roomCategories.length; i++) {
        this.expandedPanels.push(i);
      }

      this.blackboards.forEach( blackboard => {
        const blackboardsRef = db.collection(`classes/${this.classID}/blackboards`);
        const participantsRef = blackboardsRef.doc(blackboard.id).collection('participants');
        Vue.set(this.roomParticipantsMap, blackboard.id, []) //this makes each entry in the object reactive.
        this.$_listenToCollection(participantsRef, this.roomParticipantsMap, blackboard.id).then(snapshotListener => {
          // console.log("fetched participants", this.roomParticipantsMap)
          this.snapshotListeners.push(snapshotListener);
        });
      })

    },
    // roomParticipantsMap:
    //  {
    //    deep: true,
    //    handler () {
    //   console.log("roomParts", this.roomParticipantsMap)
    //    }
    // }
  },
  created () {

    const blackboardsRef = db.collection(`classes/${this.classID}/blackboards`);
    const participantsRef = db.collection(`classes/${this.classID}/participants`);

    this.$_listenToCollection(blackboardsRef, this, "blackboards").then(snapshotListener => {
      this.snapshotListeners.push(snapshotListener);
    });
    this.$_listenToCollection(participantsRef, this, "centerTableParticipants").then(snapshotListener => {
      this.snapshotListeners.push(snapshotListener);
    });

  },
  beforeDestroy () {
    for (const detachListener of this.snapshotListeners) {
      detachListener();
    }
  },
  methods: {
    setRoomStatus (status) {
      db.doc(`classes/${this.classID}/blackboards/${this.roomID}`).update({
        status
      });
      this.roomStatusPopup = false;
    },
    createBlackboard () {
      const blackboardsRef = db.collection(`classes/${this.classID}/blackboards`);
      const newBlackboard = blackboardsRef.add({
        participants: []
      });
    },
    // toggleMic () {
    //   this.isMicOn = !this.isMicOn;
    //   this.updateMicStatus()
    // },
    // updateMicStatus () {
    //   var updatedParticipants = this.blackboards.find(room => room.id === this.roomID).participants;
    //   updatedParticipants.find(participant => participant.uid === this.user.uid).isMicOn = this.isMicOn;
    //   const blackboardRoomRef = db.doc(`classes/${this.classID}/blackboards/${this.roomID}`);
    //   blackboardRoomRef.update({
    //     participants: updatedParticipants
    //   })
    // }
  }
};
</script>
