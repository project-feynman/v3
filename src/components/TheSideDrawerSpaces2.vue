<template>
  <v-expansion-panels v-if="isDataReady" multiple accordion>
    <v-expansion-panel v-for="roomType in mitClass.roomTypes" :key="roomType">
      <v-expansion-panel-header>{{ roomType }}</v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-list dense>
          <template v-for="(room, i) in roomTypeToRooms[roomType]">
            <v-list-item
              :to="`/class/${$route.params.class_id}/room/${room.id}`"
              :key="room.id"
            >
            
              <!-- Current room -->
              <template v-if="room.id === roomID">
                <RealtimeSpaceTwilioRoom :roomID="room.id" :key="room.id">
                  <template v-slot="{
                    hasConnectedToTwilio,
                    dominantSpeakerUID,
                    toggleMute,
                    isMuted
                  }">
                    <div class="d-flex">
                      <v-col class="room-title">
                        <div class="accent--text headline">Room {{ i+1 }}</div>
                        <span class="active-count">{{ room.status }}</span>
                      </v-col>
                      <v-col class="d-flex accent--text px-0">
                        <BaseButton
                          @click="setRoomStatusPopup(true, room.id)"
                          icon="mdi-message-alert" color="black"
                        >
                          Update status
                        </BaseButton>
                      </v-col>
                    </div>

                    <v-divider/>

                    <v-list-item-content>
                      <template v-for="participant in roomIDToParticipants[room.id]">
                        <div :key="participant.sessionID">
                          <!-- MYSELF -->
                          <template v-if="participant.sessionID === sessionID">
                            <v-col class="d-flex">
                              <v-icon>mdi-account</v-icon>

                              <p class="font-weight-bold">{{ participant.firstName }} </p>

                              <p v-if="!hasConnectedToTwilio">Connecting audio...</p>

                              <BaseButton v-else
                                @click="toggleMute()"
                                :icon="isMuted ? 'mdi-microphone-off' : 'mdi-microphone'"
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

              <!-- Not current room -->
              <template v-else>
                <div class="d-flex flex-column">
                  <div class="room-title">
                    <div>Room {{ i+1 }}</div>
                    <div v-if="room.status" class="active-count">{{ room.status }}</div>
                  </div>
                  <div
                    class="d-flex"
                    v-for="participant in roomIDToParticipants[room.id]"
                    :key="participant.id"
                  >
                    <v-icon>mdi-account</v-icon>
                    {{ participant.firstName }}
                  </div>
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

export default {
  mixins: [
    DatabaseHelpersMixin
  ],
  components: {
    BaseButton,
    RealtimeSpaceTwilioRoom
  },
  data () {
    return {
      unsubFuncs: [],

      // Firebase doc objects
      roomDocs: null,
      participantDocs: null,

      roomStatusPopup: { show: false, roomID: null },
      updatedStatus: "",
    };
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
  computed: {
    ...mapState([
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
      // console.log("roomIDToParticipants changed =", this.roomIDToParticipants);
      const roomIDToParticipants = {};
      for (const room of this.roomDocs) {
        roomIDToParticipants[room.id] =
          this.participantDocs.filter(p => p.currentRoom === room.id);
      }
      return roomIDToParticipants;
    }
  },
  methods: {
    setRoomStatusPopup (show, roomID = null) {
      console.log("show =", show);
      console.log("roomID =", roomID);
      this.roomStatusPopup = {
        show: show,
        roomID: roomID
      }
    },
    setRoomStatus (status) {
      db.doc(`classes/${this.classID}/rooms/${this.roomID}`).update({status});
      this.roomStatusPopup['show'] = false;
    },
  }
}
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