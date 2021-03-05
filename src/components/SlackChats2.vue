<template>
  <div style="display: flex;">
    <v-list max-height="400" style="overflow-y: auto; width: 200;">
      <v-list-item @click="currentChatRoomID = 'NEW_MESSAGE'">
        <v-icon class="mr-2">mdi-plus</v-icon> New Chat
      </v-list-item>

      <v-list-item v-for="chatRoom in myChatRooms" :key="chatRoom.id"
        @click="currentChatRoomID = chatRoom.id"
      >   
        <v-badge
          :value="user['numOfUnreadMsgsInChatRoom:' + chatRoom.id] || 0"
          :content="user['numOfUnreadMsgsInChatRoom:' + chatRoom.id] || 0"
          right color="info" overlap style="z-index: 1;" offset-x="-5" offset-y="16"
        >
          <v-list-item-title>{{ chatRoom.name }}</v-list-item-title>
        </v-badge>
      </v-list-item>
    </v-list>

    <v-card width="500">
      <template v-if="currentChatRoomID === 'NEW_MESSAGE'">
        <v-text-field 
          v-model="currentInviteeFirstName"
          placeholder="Type the exact first name of someone"
          @keyup.enter="addInvitee({ firstName: currentInviteeFirstName })"
        />
        <v-btn v-if="currentInviteeFirstName" @click="addInvitee({ firstName: currentInviteeFirstName })">
          Search
        </v-btn>

        <!-- Possible users -->
        <v-list v-if="possibleUsers.length > 0">
          <b>Possible users</b>
          <v-list-item v-for="user in possibleUsers" :key="user.id"
            @click="allInvitees.push(user); currentInviteeFirstName = ''; possibleUsers = []"
          >
            <p>{{ user.firstName }} {{ user.lastName }} {{ user.email }}</p>
          </v-list-item>
        </v-list>

        <v-list v-if="allInvitees.length > 0">
          <b>Current list of invitees</b>
          <v-list-item v-for="invitee of allInvitees" :key="invitee.id">
            {{ invitee.firstName }} {{ invitee.lastName }} {{ invitee.email }}
          </v-list-item>
        </v-list>

        <v-text-field v-if="allInvitees.length > 1"
          v-model="roomName"  
          placeholder="Name this chat"
        /> 

        <v-btn v-if="allInvitees.length > 0" @click="createNewChatRoom()">Create chat</v-btn>
      </template>

      <template v-else>
        <RenderlessListenToMessages 
          :chatRoomID="currentChatRoomID"
          @created="resetUnreadCountToZero(currentChatRoomID)"
        >
          <template v-slot="{ allMessages }">
            <GroupChatListOfMessages :allMessages="allMessages"/>
          </template>
        </RenderlessListenToMessages>

        <!-- Type a new message -->
        <div style="display: flex; align-items: center;" class="px-1 pb-1 pt-0">
          <v-text-field 
            @keyup.enter="sendMessage({ chatRoomID: currentChatRoomID })" 
            placeholder="Type message here..." 
            v-model="newlyTypedMessage" 
            hide-details dense style="font-size: 0.9rem;"
          />
          <v-btn fab icon @click="sendMessage({ chatRoomID: currentChatRoomID })" color="info" x-small>
            <v-icon>mdi-send</v-icon>
          </v-btn>
        </div>
      </template>
    </v-card>
  </div>
</template>

<script>
import { mapState } from "vuex"; 
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js"; 
import db from "@/database.js";
import GroupChatListOfMessages from "@/components/GroupChatListOfMessages.vue"; 
import RenderlessListenToMessages from "@/components/RenderlessListenToMessages.vue";
import firebase from "firebase/app";
import "firebase/firestore"; 

export default {
  mixins: [
    DatabaseHelpersMixin
  ],
  components: {
    GroupChatListOfMessages,
    RenderlessListenToMessages
  },
  data () {
    return {
      myChatRooms: [],
      unsubChatsListener: null,
      currentChatRoomID: "NEW_MESSAGE",
      currentInviteeFirstName: "",
      possibleUsers: [],
      allInvitees: [],
      roomName: "",
      newlyTypedMessage: ""
    };
  },
  computed: {
    ...mapState([
      "user"
    ])
  },
  created () {
    this.unsubChatsListener = this.$_bindVarToDB({
      varName: "myChatRooms",
      dbRef: db.collection("chatRooms").where("participantUIDs", "array-contains", this.user.uid),
      component: this
    });
  },
  destroyed () {
    this.unsubChatsListener(); 
  },
  methods: {
    async addInvitee ({ firstName }) {
      this.possibleUsers = await this.$_getCollection(db.collection("users").where("firstName", "==", firstName));
    },
    createNewChatRoom () {
      let roomName = ""; 
      if (this.allInvitees.length === 1) roomName = this.user.firstName + "/" + this.allInvitees[0].firstName;
      else roomName = this.roomName; 
      db.collection("chatRooms").add({
        name: roomName,
        participantUIDs: [this.user.uid, ...this.allInvitees.map(invitee => invitee.uid)]
      });
    },
    resetUnreadCountToZero (chatRoomID) {
      const updatePayload = {}; 
      updatePayload["numOfUnreadMsgsInChatRoom:" + chatRoomID] = 0; 
      db.doc(`users/${this.user.uid}`).update(updatePayload); 
    },  
    async sendMessage ({ chatRoomID }) {
      db.collection(`chatRooms/${chatRoomID}/messages`).add({
        author: {
          firstName: this.user.firstName,
          lastName: this.user.lastName,
          uid: this.user.uid
        },
        content: this.newlyTypedMessage,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      this.newlyTypedMessage = ""; 

      // notify each person
      const { user, currentChatRoomID } = this; 
      const chatRoomDoc = await this.$_getDoc(db.doc(`chatRooms/${currentChatRoomID}`));
      for (const uid of chatRoomDoc.participantUIDs) {
        if (uid !== user.uid) {
          const updatePayload = {};
          updatePayload["numOfUnreadMsgsInChatRoom:" + currentChatRoomID] = firebase.firestore.FieldValue.increment(1);
          db.doc(`users/${uid}`).update(updatePayload); 
        }
      }
    }
  }
};
</script>