
<template>
   <!-- Might need `width: 100%` here -->
  <div>
    <slot>
      <!-- Close window button is injected here -->
    </slot>
    <GroupChatListOfMessages v-if="allMessages"
      :allMessages="allMessages"
      :chatWindowHeight="miniChatWindowHeight"
    /> 
    <!-- For new messages -->
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
</template>

<script>
import GroupChatListOfMessages from "@/components/GroupChatListOfMessages.vue"; 
import db from "@/database.js"; 
import { mapState} from "vuex"; 
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js"; 
import firebase from "firebase/app"; 
import "firebase/firestore"; 

// A chat where only people who are currently online and in the same place
// are notified of new messages
export default {
  props: {
    messagesDbPath: {
      type: String,
      required: true
    },
    participantsDbRef: {
      type: Object,
      required: true 
    },
    notifFieldName: {
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
      allMessages: null,
      unsusbcribeMessagesListener: null,
      miniChatWindowHeight: 135,
      newlyTypedMessage: ""
    };
  },
  computed: {
    ...mapState([
      "user"
    ])
  },
  created () {
    // reset number of unread messages for the user
    const updatePayload = {}; 
    updatePayload[this.notifFieldName] = 0; 
    db.doc(`users/${this.user.uid}`).update(updatePayload);

    this.unsubscribeMessagesListener = this.$_bindVarToDB({
      varName: "allMessages",
      dbRef: db.collection(this.messagesDbPath).orderBy("timestamp"),
      component: this
    });
  },
  destroyed () {
    this.unsubscribeMessagesListener(); 
  },
  methods: {
    async sendMessage () {
      db.collection(this.messagesDbPath).add({
        author: {
          firstName: this.user.firstName,
          lastName: this.user.lastName,
          uid: this.user.uid
        },
        content: this.newlyTypedMessage,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      this.newlyTypedMessage = ""; 

      // this.notifyRelevantUsers();
    },
    async notifyRelevantUsers () {
      const participantsInArea = await this.$_getCollection(this.participantsDbRef);
      const participantUIDs = participantsInArea.map(p => p.uid); 
      const deduplicatedUIDs = [...new Set(participantUIDs)]; // otherwise if I have an iPad and computer, my message count increments by 2
      console.log("uniqueParticipants =", deduplicatedUIDs);

      const batch = db.batch(); 
      for (const uid of deduplicatedUIDs) {
        if (uid !== this.user.uid) {
          const pUserRef = db.doc(`users/${uid}`); 
          const updatePayload = {};
          updatePayload[this.notifFieldName] = firebase.firestore.FieldValue.increment(1); 
          batch.update(pUserRef, updatePayload);
        }
      }
      await batch.commit(); 
    }
  }
};
</script>