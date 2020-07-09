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
      <h4>
        Main Lobby
      </h4>
    </v-list-item>

    <v-divider/>
    <!-- <v-list-item> -->
    
    <v-expansion-panels>
      <template v-for="(category, i) in roomCategories">
        <v-expansion-panel :key="i">
          <v-expansion-panel-header><h4>{{category.title}}</h4></v-expansion-panel-header>
            <v-expansion-panel-content> 
              <v-list >
                <template v-for="(blackboard, i) in category.rooms">
    <!-- <template v-for="(blackboard, i) in blackboards"> -->
      <!-- 
      Complication: 
          clicking activator button i.e. v-on="on" inside <BasePopupButton> 
          will uncontrollably force a page refresh. I'm guessing it's because
          the click event propagates to the parent <v-list-item> which 
          has a :to attribute and triggers a URL redirect, though it's not clear
          why it's a slow, real URL request rather than a fast simulated URL request,
          which is the normal behavior for all our route navigations. 

          The workaround is that I removed the :to attribute, and use @click="$router.push()".
          The drawback is now no room can detect if it is currently active 
          (:to attribute use to highlight items that match with the current URL)
          so I now expand all blackboards and make everything "active-blackboard".
      
          class="blackboard-item" 
          :to="(`/class/${classId}/room/${blackboard.id}`)" 
      -->
                  <v-list-item
                    @click="$router.push(`/class/${classID}/room/${blackboard.id}`)"
                    :key="blackboard.id"
                    color="accent"
                    class="active-blackboard"
                    active-class="active-blackboard"
                  >
                    <v-list-item-content v-if="blackboard.participants">
                      <v-list-item-title>
                        Room {{ i }}
                        <!-- <span class="active-count accent--text">({{ blackboard.participants.length }} active)</span> -->
                        <span class="active-count accent--text" v-if="blackboard.status">{{ blackboard.status }}</span>
                      </v-list-item-title>
                      <div class="active-blackboard-users pl-4 pt-2">
                        <template v-for="(participant, i) in blackboard.participants">
                          <div class="d-flex align-center py-2" :key="i">
                            <v-icon>mdi-account</v-icon>
                            <div :class="['pl-1', 'col', 'py-0', participant.uid === user.uid ? 'font-weight-bold':'']">
                              {{ participant.firstName }}
                            </div>

                            <template v-if="user.uid === participant.uid">
                              <BasePopupButton
                                @action-do="({ 'Status': status }) => setRoomStatus(status)" 
                                :inputFields="['Status']"
                                actionName="Set room status"
                              >
                                <template v-slot:activator-button="{ on }">
                                  <v-btn 
                                    v-on="on"
                                    color="accent lighten-1"
                                    :outlined="true"
                                    rounded
                                    style="margin:3px">
                                    <v-icon>mdi-account-alert</v-icon>
                                  </v-btn> 
                                </template>
                              </BasePopupButton>

                              <v-btn 
                                @click="toggleMic()" 
                                :color="isMicOn ? 'accent' : 'accent lighten-1'" 
                                :outlined="isMicOn" 
                                rounded
                              >
                                <template v-if="hasConnectedAudio">
                                  <v-icon class="">{{ isMicOn ? 'mdi-microphone': 'mdi-microphone-off' }}</v-icon>
                                </template>
                                <template v-else-if="!hasConnectedAudio && isMicOn">
                                  <v-progress-circular
                                    indeterminate
                                    size="20"
                                    width="2"/>
                                </template>
                                <template v-else>
                                  Join Audio
                                </template>

                              </v-btn>
                            </template>
                            <template v-else>
                              <v-icon class="">{{ participant.isMicOn ? 'mdi-microphone': 'mdi-microphone-off' }}</v-icon>
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
      :isMicOn="isMicOn"
      @left-room="isMicOn=false; hasConnectedAudio=false"
      @audio-connected="hasConnectedAudio=true"
      :key="lastBlackboardRoomId"
    />
  </div>
    
</template>
<script>
import db from "@/database.js";
import BasePopupButton from "@/components/BasePopupButton.vue"; 
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import LiveBoardAudio from "@/components/LiveBoardAudio.vue";
import { mapState } from "vuex";

export default {
  mixins: [
    DatabaseHelpersMixin
  ],
  components: {
    BasePopupButton,
    LiveBoardAudio
  },
  data () {
    return {
      snapshotListeners: [],
      centerTableParticipants: [],
      blackboards: [],
      isMicOn: false,
      hasConnectedAudio: false,
      savedRoomId: "",
      roomTypes: [],
      roomCategories: []
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
      if (this.mitClass.roomTypes) {
        this.roomCategories = []
        for (const type of this.mitClass.roomTypes) {
          this.roomCategories.push({title: type, rooms: this.blackboards.filter(room => room.roomType === type)})
        }
      }
      else {
        this.roomCategories = [{title: "Blackboard Rooms", rooms: this.blackboards}]
      }
    }
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
    },
    createBlackboard () {
      const blackboardsRef = db.collection(`classes/${this.classID}/blackboards`);
      const newBlackboard = blackboardsRef.add({
        participants: []
      });
    },
    toggleMic () {
      this.isMicOn = !this.isMicOn;
      this.updateMicStatus()
    },
    updateMicStatus () {
      var updatedParticipants = this.blackboards.find(room => room.id === this.roomID).participants;
      updatedParticipants.find(participant => participant.uid === this.user.uid).isMicOn = this.isMicOn;
      const blackboardRoomRef = db.doc(`classes/${this.classID}/blackboards/${this.roomID}`);
      blackboardRoomRef.update({
        participants: updatedParticipants
      })
    }
  }
};
</script>
