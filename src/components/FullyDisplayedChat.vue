<template>
  <v-card v-if="chatRoomDoc">
    <v-list-item style="font-size: 1.25rem;">
      <template v-if="chatRoomDoc.isGroupRoom">
        {{ chatRoomDoc.name }} 
      </template>
      <template v-else>
        {{ otherPerson.firstName + " " + otherPerson.lastName }}
      </template>
    </v-list-item>

    <v-divider/>

    <GroupChatListOfMessages v-if="allMessages" 
      :allMessages="allMessages"
    />

    <v-divider/>
    
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
  </v-card>
</template>

<script>
import db from "@/database.js"; 
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js"; 
import GroupChatListOfMessages from "@/components/GroupChatListOfMessages.vue"; 
import { mapState } from "vuex"; 
import firebase from "firebase/app";
import "firebase/firestore";
import { getRandomId } from "@/helpers.js";

export default {
  props: {
    chatRoomID: {
      type: String,
      required: true
    }
  },
  mixins: [
    DatabaseHelpersMixin
  ],
  components: {
    GroupChatListOfMessages
  },
  data () {
    return {
      chatRoomDoc: null,
      allMessages: null,
      newlyTypedMessage: "",
      unsubFuncs: [],
      isShowingBadge: false
    };
  },
  computed: {
    ...mapState([
      "user",
      "mitClass"
    ]),
    otherPerson () {
      if (!this.chatRoomDoc) return; 
      for (const p of this.chatRoomDoc.participants) {
        if (p.uid !== this.user.uid) {
          return p;
        }
      }
    },  
    classRef () {
      return db.doc(`classes/${this.mitClass.id}`); 
    },
    roomRef () {
      return db.doc(`${this.classRef.path}/chatRooms/${this.chatRoomID}`);
    },
    messagesRef () {
      return this.roomRef.collection("messages");
    }
  },
  async created () {
    this.unsubFuncs.push(
      this.$_bindVarToDB({
        varName: "allMessages",
        dbRef: this.messagesRef.orderBy("timestamp"),
        component: this
      })
    );
    this.chatRoomDoc = await this.$_getDoc(this.roomRef);
  },
  watch: {
    allMessages () {
      // only alert new messages if the user doesn't have the menu open already
      console.log("allMessages was changed =", this.allMessages); 
      if (!this.menu) {
        this.isShowingBadge = true; 
      }
    },
    menu () {
      // whether the user closes or opens the menu, the badge should always reset
      this.isShowingBadge = false; 
    }
  },
  destroyed () {
    for (const unsubFunc of this.unsubFuncs) {
      unsubFunc();
    }
  },
  methods: {
    sendMessage () {
      this.messagesRef.add({
        author: {
          firstName: this.user.firstName,
          lastName: this.user.lastName,
          uid: this.user.uid
        },
        content: this.newlyTypedMessage,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      this.newlyTypedMessage = "";
    }
  }
};
</script>