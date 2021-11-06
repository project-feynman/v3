
<template>
   <!-- Might need `width: 100%` here -->
  <div style="width: 100%" class="px-3">
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
        outlined rounded hide-details dense style="font-size: 0.9rem;"
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
import 'firebase/functions'

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
    },
    areaID: {
      type: String,
      required: false // just for the new group chat implementation, don't want to break existing code
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
      miniChatWindowHeight: 280,
      newlyTypedMessage: ""
    };
  },
  computed: {
    ...mapState([
      "user",
      'mitClass'
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
      const messageCopy = this.newlyTypedMessage
      this.newlyTypedMessage = ''
      db.collection(this.messagesDbPath).add({
        author: {
          firstName: this.user.firstName,
          lastName: this.user.lastName,
          uid: this.user.uid
        },
        content: messageCopy,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });

      // this.notifyRelevantUsers();
      this.notifyRelevantUsers2(messageCopy)
    },
    async notifyRelevantUsers2 (message) {
      const relevantUsers = await this.$_getCollection(
        db.collection('users').where('willGetNotifFromNewMsgInAreas', 'array-contains', this.areaID)
      )

      const sendEmailToPerson = firebase.functions().httpsCallable('sendEmailToPerson')
      for (const relevantUser of relevantUsers) {
        const { class_id, section_id, room_id } = this.$route.params;
        sendEmailToPerson({ 
          emailOfPerson: relevantUser.email, 
          title: `New area message in ${this.mitClass.name}`, 
          contentHTML: `
            <p>Someone said: "${message}"</p> 
            <a href="${window.location.origin}/class/${class_id}/section/${section_id}/room/${room_id}">
              ${window.location.origin}/class/${class_id}/section/${section_id}/room/${room_id}
            </a>
            <p>
              To get notifications, press the "From: eltonlin@mit.edu" near the top, then press "Add to VIP". 
              Meanwhile, I'm working on a way to send notifications without emails to minimize inbox clutter. 
            </p>
          `,
        })
      }
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