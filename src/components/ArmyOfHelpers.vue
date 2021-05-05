<template>
  <div>
    <MapleMusicPlayer 
      :incrementToToggleMusic="incrementToToggleMusic"
      @music-fetched="incrementToToggleMusic += 1"
    />  

    <div class="headline mb-2"><b>How it works</b></div>
    <h3>Step 1</h3>
    <p>Some people have voluntarily signed up as helpers - press the help button to notify them at any time</p>

    <div style="display: flex; margin-top: 5px; margin-left: 15px;">
      Sign up as a helper (there are {{ armyMembers.length }} helpers in {{ mitClass.name }})
    </div>
    <v-switch style="margin-top: 1px; margin-left: 15px;"
      hide-details
      :input-value="isUserAHelper" 
      @change="toggleEmailOnHelpRequest(!isUserAHelper)"
    />
    
    <div style="display: flex; margin-top: 10px; margin-left: 15px;">
      <v-btn @click="requestForHelpFromTheArmy()"
        :disabled="hasSentNotif"
        large color="cyan white--text"
      >
        <template v-if="!hasSentNotif">
          Request for help
        </template>
        <template v-else>
          Reinforcements are incoming.
        </template>
      </v-btn>
    </div>

    <h3 style="margin-top: 20px">Step 2</h3>
    If they're not all busy, a helper will arrive at your current Explain workspace within 30 seconds. Communicate over the board, chat and audio-video.
    <br>
    (Tip: if you are helping someone, record your explanation to re-use it later for everyone else. Two-birds-with-one-stone!)

    <ExplanationGroupDisplay
      style="margin-top: 10px;"
      postID="PW7PmplbODxlxVTxomj3"
      originalExplDbPath="classes/mDbUrvjy4pe8Q5s5wyoD/posts/PW7PmplbODxlxVTxomj3"
      :replyExplsDbPath="'classes/mDbUrvjy4pe8Q5s5wyoD/posts/PW7Pmplb0DxlxVTxomj3/explanations'"
    />

    <div class="headline mt-5"><b>Your statistics</b></div>
    <div style="justify-content: space-around; margin-top: 10px; margin-left: 20px;">
      <div style="display: flex; align-items: center;">
        <h1>0</h1>
        <v-list-item two-line>
          <v-list-item-content>
            <v-list-item-title>
              Assisted Upvotes
            </v-list-item-title>
            <v-list-item-subtitle>
              Upvotes on explanations that were created to answer your questions in the first place
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </div>

      <div style="display: flex; align-items: center;">
        <h1>0</h1>
        <v-list-item>
          <v-list-item-content>
            <v-list-item-title> 
              Upvotes
            </v-list-item-title>
            <v-list-item-subtitle>
              Upvotes on explanations you created 
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </div>
      
      <div style="display: flex; align-items: center;">
        <h1 style="flex-grow: 2">
          0
        </h1>
        <v-list-item style="flex-grow: 2">
          <v-list-item-content>
            <v-list-item-title> 
              Videos shared
            </v-list-item-title>
            <v-list-item-subtitle>
              To record a voiced explanation, press the "Explain" record button
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </div>

      <div style="display: flex; align-items: center;">
        <h1 style="flex-grow: 2">0</h1>
        <v-list-item style="flex-grow: 2">
          <v-list-item-content>
            <v-list-item-title> 
              Animations shared
            </v-list-item-title>
            <v-list-item-subtitle>
              To share an animation, press "Save board to library"
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import db from "@/database.js"; 
import firebase from "firebase/app"; 
import "firebase/firestore"; 
import "firebase/functions"; 
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js"; 
import MapleMusicPlayer from "@/components/MapleMusicPlayer.vue"; 
import ExplanationGroupDisplay from "@/components/ExplanationGroupDisplay.vue"; 

export default {
  mixins: [
    DatabaseHelpersMixin
  ],
  components: {
    MapleMusicPlayer,
    ExplanationGroupDisplay
  },
  data () {
    return {
      armyMembers: [],
      hasSentNotif: false,
      incrementToToggleMusic: 0
    };
  },
  computed: {
    ...mapState([
      "mitClass",
      "user"
    ]),
    isUserAHelper () {
      if (!this.user.emailOnHelpRequest) return false; 
      else return this.user.emailOnHelpRequest.includes(this.mitClass.id); 
    }
  },
  created () {    
    this.$_bindVarToDB({
      varName: "armyMembers",
      dbRef: db.collection("users").where("emailOnHelpRequest", "array-contains", this.mitClass.id),
      component: this
    });
  },
  methods: {
    async requestForHelpFromTheArmy () {
      for (const member of this.armyMembers) {
        console.log("member =", member); 
        const sendEmailToPerson = firebase.functions().httpsCallable("sendEmailToPerson");
        const { class_id, section_id, room_id } = this.$route.params;
        sendEmailToPerson({ 
          emailOfPerson: member.email, 
          title: `[explain.mit.edu] Help Request for ${this.mitClass.name}`, 
          contentHTML: `
            <p>${this.user.firstName} requested for help on ${this.mitClass.name}, join their workspace <a href="https://explain.mit.edu/class/${class_id}/section/${section_id}/room/${room_id}">here</a>.</p>
            <p>If you're currently busy, no need to do anything.</p>
            <p>To get push notifications on your iPad and iPhone, press on "eltonlin@mit.edu", then press "Add to VIP". Meanwhile I'm working on a way for Explain to just send push notiications without any emails.</p>
          `,
        });
      }
      this.hasSentNotif = true; 
      this.$root.$emit("show-snackbar", "Hopefully someone will show up within 30 seconds!");
    },
    toggleEmailOnHelpRequest (isEnabled) {
      const ref = db.doc(`users/${this.user.uid}`); 
      if (isEnabled) {
        ref.update({  
          emailOnHelpRequest: firebase.firestore.FieldValue.arrayUnion(this.mitClass.id)
        });
      } else {
        ref.update({
          emailOnHelpRequest: firebase.firestore.FieldValue.arrayRemove(this.mitClass.id)
        });
      }
    }
  }
};
</script>