<template>
  <div style="width: 100%;">
    <div style="display: flex;">
      <slot>
        <!-- CLOSE button is injected here -->
      </slot>
      <v-tabs height="28">
        <!-- AREA CHAT TAB -->
        <v-tab @click="chatType = 'AREA'">
          <v-badge
            :value="user['numOfUnreadMsgsInArea:' + sectionID]"
            :content="user['numOfUnreadMsgsInArea:' + sectionID]"
            right color="info" overlap style="z-index: 1;" offset-x="-5" offset-y="16"
          >
            AREA
          </v-badge>
        </v-tab>

        <!-- GROUP CHAT TAB -->
        <v-tab @click="chatType = 'ROOM'">
          <v-badge 
            :value="numOfUnreadMsgsInTable"
            :content="numOfUnreadMsgsInTable"
            right color="info" overlap style="z-index: 1;" offset-x="-5" offset-y="16"
          >
            TABLE
          </v-badge>
        </v-tab>
      </v-tabs>
    </div>
    <div>
      <GroupChatListOfMessages v-if="chatType === 'AREA' && areaMessages"
        :allMessages="areaMessages"
        :chatWindowHeight="MINI_CHAT_WINDOW_HEIGHT"
      />
      <GroupChatListOfMessages v-else-if="chatType === 'ROOM' && roomMessages"
        :allMessages="roomMessages"
        :chatWindowHeight="MINI_CHAT_WINDOW_HEIGHT"
      />
      <!-- Type a new message -->
      <div style="display: flex; align-items: center;" class="px-1 pb-1 pt-0">
          <v-text-field 
            @keyup.enter="sendMessage()" 
            placeholder="Type message here..." 
            v-model="newlyTypedMessage" 
            hide-details dense style="font-size: 0.9rem;"
          />
          <v-btn fab icon @click="sendMessage()" color="info" x-small>
            <v-icon>mdi-send</v-icon>
          </v-btn>
      </div>
    </div>
  </div>
</template>

<script>
import GroupChatListOfMessages from "@/components/GroupChatListOfMessages.vue"; 
import firebase from "firebase/app"; 
import "firebase/firestore"; 
import db from "@/database.js";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js"; 
import { mapState, mapGetters } from "vuex"; 

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
      chatType: "AREA", // APP, CLASS, AREA, ROOM, DM "" represents my own direct communication
      areaMessages: null,
      roomMessages: null,
      unsubscribeAreaMessagesListener: null,
      unsubscribeRoomMessagesListener: null,
      newlyTypedMessage: "",
      MINI_CHAT_WINDOW_HEIGHT: 135
    };
  },
  computed: {
    ...mapState([
      "user"
    ]),
    ...mapGetters([
      "numOfUnreadMsgsInArea",
      "numOfUnreadMsgsInTable"
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
    chatType: {
      immediate: true,
      handler () {
        switch (this.chatType) {
          case "AREA":
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
        if (uid !== this.user.uid) {
          const pUserRef = db.doc(`users/${uid}`); 
          const updatePayload = {};
          updatePayload[notifFieldName] = firebase.firestore.FieldValue.increment(1); 
          batch.update(pUserRef, updatePayload);
        }
      }
      await batch.commit(); 
    },
  }
}
</script>