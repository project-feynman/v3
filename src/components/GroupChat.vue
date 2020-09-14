<template>
  <div>
    <template>
      <div class="text-center">
        <v-menu
          v-model="menu"
          :close-on-content-click="false"
          :nudge-width="250"
          offset-x
          offset-y
        >
          <!-- Activator Button -->
          <template v-slot:activator="{ on, attrs }">
            <v-badge overlap :value="isShowingBadge">
              <v-btn
                color="white"
                v-bind="attrs"
                v-on="on"
              >
                <v-icon class="mr-2">mdi-chat</v-icon>
                Group Chat
              </v-btn>
            </v-badge>
          </template>

          <!-- Actual Menu -->
          <v-card>
            <GroupChatListOfMessages v-if="allMessages" :allMessages="allMessages"/>

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
        </v-menu>
      </div>
    </template>
  </div>
</template>

<script>
import db from "@/database.js"; 
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js"; 
import GroupChatListOfMessages from "@/components/GroupChatListOfMessages.vue"; 
import { mapState } from "vuex"; 
import firebase from "firebase/app";
import "firebase/firestore";

export default {
  mixins: [
    DatabaseHelpersMixin
  ],
  components: {
    GroupChatListOfMessages
  },
  data () {
    return {
      allMessages: null,
      newlyTypedMessage: "",
      isShowingBadge: false,
      menu: false,
      unsubListeners: []
    };
  },
  computed: {
    ...mapState([
      "user",
      "mitClass"
    ]),
    classRef () {
      return db.doc(`classes/${this.mitClass.id}`); 
    },
  },
  watch: {
    allMessages () {
      // only alert new messages if the user doesn't have the menu open already
      if (!this.menu) {
        this.isShowingBadge = true; 
      }
    },
    menu () {
      // whether the user closes or opens the menu, the badge should always reset
      this.isShowingBadge = false; 
    }
  },
  created () {
    this.unsubListeners.push(
      this.$_bindVarToDB({
        varName: "allMessages",
        dbRef: this.classRef.collection("messages").orderBy("timestamp"),
        component: this
      })
    );
  },
  destroyed () {
    for (const unsubListener of this.unsubListeners) {
      unsubListener();
    }
  },
  methods: {
    sendMessage () {
      this.classRef.collection("messages").add({
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