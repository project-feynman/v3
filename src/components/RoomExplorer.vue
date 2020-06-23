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
  <v-list class="pt-0">
    <v-list-item 
      :to="(`/class/${classID}/room/center-table`)"
      color="accent"
      class="blackboard-item"
      active-class="active-blackboard"
    >
      MAIN LOBBY ({{ centerTableParticipants.length }} active)
    </v-list-item>
    <template v-for="(blackboard, i) in blackboards">
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
            Lounge {{ i }}
            <span class="active-count accent--text">({{ blackboard.participants.length }} active)</span>
            <p v-if="blackboard.status">{{ blackboard.status }}</p>
          </v-list-item-title>
          <div class="active-blackboard-users pl-4 pt-2">
            <template v-for="(participant, i) in blackboard.participants">
              <div class="d-flex align-center py-2" :key="i">
                <v-icon>mdi-account</v-icon>
                <div :class="['pl-1', 'col', 'py-0', participant.uid === user.uid ? 'font-weight-bold':'']">
                  {{ participant.firstName }}
                </div>
                
                <BasePopupButton 
                  @action-do="({ 'Status': status }) => setRoomStatus(status)" 
                  :inputFields="['Status']"
                  actionName="Set room status"
                >
                  <template v-slot:activator-button="{ on }">
                    <v-btn v-if="user.uid === participant.uid" 
                      v-on="on"
                      color="accent lighten-1"
                      :outlined="true"
                      rounded
                      style="margin:3px">
                      <v-icon>mdi-account-alert</v-icon>
                    </v-btn> 
                  </template>
                </BasePopupButton>

                <v-btn v-if="user.uid === participant.uid" 
                  @click="toggleMic()" 
                  :color="isMicOn ? 'accent' : 'accent lighten-1'" 
                  :outlined="isMicOn" 
                  rounded
                >
                  <v-icon class="">{{ isMicOn ? 'mdi-microphone': 'mdi-microphone-off' }}</v-icon>
                </v-btn>
              </div>
            </template>
          </div>
        </v-list-item-content>
      </v-list-item>
      <v-divider v-if="i + 1 < blackboards.length" :key="i"/>
    </template>
  </v-list>
</template>

<script>
import db from "@/database.js";
import BasePopupButton from "@/components/BasePopupButton.vue"; 
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import { mapState } from "vuex";

export default {
  mixins: [
    DatabaseHelpersMixin
  ],
  components: {
    BasePopupButton,
  },
  data () {
    return {
      snapshotListeners: [],
      centerTableParticipants: [],
      blackboards: [],
      isMicOn: false
    };
  },
  computed: {
    ...mapState([
      "user",
      "blackboardRoom"
    ]),
    classID () {
      return this.$route.params.class_id;
    },
    roomID () {
      return this.$route.params.room_id;
    }
  },
  created () {
    this.$root.$on("leftRoom", () => this.isMicOn = false);
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
      const blackboardsRef = db.collection(`classes/${this.classId}/blackboards`);
      const newBlackboard = blackboardsRef.add({
        participants: []
      });
    },
    toggleMic () {
      this.isMicOn = !this.isMicOn;
      this.$root.$emit('toggleMic', this.isMicOn);
    }
  }
};
</script>
