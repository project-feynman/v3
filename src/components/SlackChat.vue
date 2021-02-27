<template>
  <div style="display: flex;">
    <div>
      <!-- LEFT PANE -->
      <!-- announcements -->
      <v-list>
        <!-- <v-list-item>Explain-wide</v-list-item> -->
        <!-- AREA CHAT -->
        <!-- <v-badge 
          :value="user.numOfUnreadExplainWideMessages"
          :content="user.numOfUnreadWebsiteWideMessages"
          left color="info" overlap style="z-index: 1;"
        >
          <v-list-item @click="chatType = 'AREA'">
            Current Area
          </v-list-item>
        </v-badge> -->

        <!-- AREA CHAT -->
        <v-badge 
          :value="user['numOfUnreadMsgsInArea:' + sectionID]"
          :content="user['numOfUnreadMsgsInArea:' + sectionID]"
          left color="info" overlap style="z-index: 1;"
        >
          <v-list-item @click="chatType = 'AREA'">
            Current Area
          </v-list-item>
        </v-badge>

        <!-- ROOM CHAT -->

        <v-badge 
          :value="user['numOfUnreadMsgsInTable:' + $route.params.room_id]"
          :content="user['numOfUnreadMsgsInTable:' + $route.params.room_id]"
          left color="info" overlap style="z-index: 1;"
        >
          <v-list-item @click="chatType = 'ROOM'">
            Current Table 
          </v-list-item>
        </v-badge>

        <!-- direct messages -->
        <!-- <v-list-item>Direct Message</v-list-item> -->
      </v-list>
    </div>

    <div v-if="!chatType">
      <v-card>
        <v-card-text>
        How to use these chats: 
          <ul>
            <li>Keep track of Office Hours wait-lines</li>
            <li>Study with new classmates and answer each others' questions</li>
            <li>Report technical difficulties</li>
            <li>...anything</li>
          </ul>
        </v-card-text>
      </v-card>
    </div>

    <div v-else>
      <h2>{{ chatType }} CHAT</h2>

      <GroupChatListOfMessages v-if="chatType === 'AREA' && areaMessages"
        :allMessages="areaMessages"
      />
      <GroupChatListOfMessages v-else-if="chatType === 'ROOM' && roomMessages"
        :allMessages="roomMessages"
      />
      <!-- Type a new message -->
      <v-container class="py-0">
        <v-row class="pa-0">
          <v-col cols="10" class="mr-0 pr-0">
            <v-text-field 
              @keyup.enter="sendMessage()" 
              placeholder="Type message here..." 
              v-model="newlyTypedMessage" 
              hide-details
            />
          </v-col>

          <v-col cols="2" class="px-0">
            <v-btn fab icon @click="sendMessage()" color="secondary">
              <v-icon>mdi-send</v-icon>
            </v-btn>
          </v-col>
        </v-row>
      </v-container>
    </div>
  </div>
</template>

<script>
// for version 1, to speed up decisions, non-obvious decisions will just copy Slack
import GroupChatListOfMessages from "@/components/GroupChatListOfMessages.vue"; 
import firebase from "firebase/app"; 
import "firebase/firestore"; 
import db from "@/database.js";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js"; 
import { mapState } from "vuex"; 

export default {
  name: "SlackChat", 
  mixins: [
    DatabaseHelpersMixin
  ],
  components: {
    GroupChatListOfMessages
  },
  data () {
    return {
      chatType: "", // APP, CLASS, AREA, ROOM, DM "" represents my own direct communication
      areaMessages: null,
      roomMessages: null,
      unsubscribeAreaMessagesListener: null,
      unsubscribeRoomMessagesListener: null,
      newlyTypedMessage: ""
    };
  },
  computed: {
    ...mapState([
      "user"
    ]),
    areaMessagesRef () {
      const { class_id } = this.$route.params; 
      return db.collection(`classes/${class_id}/roomTypes/${this.sectionID}/messages`); 
    },
    roomMessagesRef () {
      const { class_id, room_id } = this.$route.params; 
      return db.collection(`classes/${class_id}/rooms/${room_id}/messages`); 
    },
    sectionID () {
      return this.$route.params.section_id;
    }
  },
  watch: {
    chatType () {
      switch (this.chatType) {
        case "AREA":
          // clear the notification count
          const updatePayload1 = {}; 
          updatePayload1["numOfUnreadMsgsInArea:" + this.sectionID] = 0; 
          db.doc(`users/${this.user.uid}`).update(updatePayload1);

          this.unsubscribeAreaMessagesListener = this.$_bindVarToDB({
            varName: "areaMessages",
            dbRef: this.areaMessagesRef.orderBy("timestamp"),
            component: this
          });
          break;
        case "ROOM":
          const updatePayload2 = {}; 
          updatePayload2["numOfUnreadMsgsInTable:" + this.$route.params.room_id] = 0; 
          db.doc(`users/${this.user.uid}`).update(updatePayload2);

          this.unsubscribeRoomMessagesListener = this.$_bindVarToDB({
            varName: "roomMessages",
            dbRef: this.roomMessagesRef.orderBy("timestamp"),
            component: this
          });
          break; 
      }
    }
  },
  destroyed () {
    if (this.unsubscribeAreaMessagesListener) this.unsubscribeAreaMessagesListener(); 
    if (this.unsubscribeRoomMessagesListener) this.unsubscribeRoomMessagesListener(); 
  },
  methods: {
    async sendMessage () {
      let messagesRef; 
      if (this.chatType === 'AREA') messagesRef = this.areaMessagesRef; 
      if (this.chatType === 'ROOM') messagesRef = this.roomMessagesRef; 
      messagesRef.add({
        author: {
          firstName: this.user.firstName,
          lastName: this.user.lastName,
          uid: this.user.uid
        },
        content: this.newlyTypedMessage,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      this.newlyTypedMessage = "";

      // NOTIFY THE RELEVANT PEOPLE
      const { class_id, room_id } = this.$route.params; 
      const participantsRef = db.collection(`classes/${class_id}/participants`);
      switch (this.chatType) {
        case "AREA": 
          this.notifyRelevantUsers({
            usersQueryRef: participantsRef.where("roomTypeID", "==", this.sectionID),
            notifFieldName: "numOfUnreadMsgsInArea:" + this.sectionID
          });
          break;

        case "ROOM": 
          this.notifyRelevantUsers({
            usersQueryRef: participantsRef.where("currentRoom", "==", room_id),
            notifFieldName: "numOfUnreadMsgsInTable:" + room_id
          });
          break;
      }
    },
    async notifyRelevantUsers ({ usersQueryRef, notifFieldName }) {
      const participantsInArea = await this.$_getCollection(usersQueryRef);
      const participantUIDs = participantsInArea.map(p => p.uid); 
      const deduplicatedUIDs = [...new Set(participantUIDs)]; // otherwise if I have an iPad and computer, my message count increments by 2
      console.log("uniqueParticipants =", deduplicatedUIDs);

      const batch = db.batch(); 
      for (const uid of deduplicatedUIDs) {
        const pUserRef = db.doc(`users/${uid}`); 
        const updatePayload = {};
        updatePayload[notifFieldName] = firebase.firestore.FieldValue.increment(1); 
        batch.update(pUserRef, updatePayload); 
      }
      await batch.commit(); 
    },
  }
}
</script>