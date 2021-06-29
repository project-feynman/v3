<template>
  <v-card>
    <MapleMusicPlayer 
      :incrementToToggleMusic="incrementToToggleMusic"
      @music-fetched="incrementToToggleMusic += 1"
    />  

    <v-card-title>
      <!-- Infinite Tutoring -->
    </v-card-title>

    <v-card-text>
      <div class="headline"></div> 

      <h2>Invite</h2>

      <v-textarea 
        v-model="emailMessage"
      />
    
      <p>Friends</p>
      <v-list dense>
        <v-list-item v-for="friend of [
          { firstName: 'Elton', lastName: 'Lin', email: 'eltonlin@mit.edu' }, 
          { firstName: 'Nathan', lastName: 'Cheung', email: 'cheungntf@gmail.com' },
          { firstName: 'Tony', lastName: 'Wang', email: 'tony.t.wang@gmail.com' },
          { firstName: 'Francois', lastName: 'Le Roux', email: '' }
          ]" 
          :key="friend.email"
          dense
        >
          <v-list-item-title>
            {{ friend.firstName + ' ' + friend.lastName }}
          </v-list-item-title>
          <v-list-item-action>
            <v-btn small icon fab @click="sendEmailInvite(friend)">
              <v-icon>mdi-email</v-icon>
            </v-btn>
          </v-list-item-action>
        </v-list-item>
      </v-list>
      <div style="display: flex">
        <p class="pb-0">Classmates</p><v-btn small icon fab><v-icon>mdi-email</v-icon></v-btn>
      </div>
      <div style="display: flex">
        <p class="pb-0">Instructors</p><v-btn small icon fab><v-icon>mdi-email</v-icon></v-btn>
      </div>

      <br>

      <!-- <div class="headline">Sign up as a volunteer helper</div>
      <v-switch 
        :input-value="isUserATutor"
        @change="newBoolean => toggleNotifyOnTutorRequest(newBoolean)"
      /> -->

      <!-- <div class="headline">Volunteer helpers / study group</div> 
      <v-list>
        <template v-for="helper of allHelpers">
          <v-list-item :key="helper.id">
            <v-list-item-title>{{ helper.firstName + " " + helper.lastName }}</v-list-item-title>
            <v-list-item-subtitle>Tutored 0 times and shared 0 videos</v-list-item-subtitle> 
            <v-btn @click="tutor = helper; isHelpRequestPopupOpen = true;">Request for help</v-btn>
          </v-list-item>
        </template>
      </v-list> -->

      <v-dialog persistent v-model="isHelpRequestPopupOpen">
        <v-card>
          Request for help

          <v-select
            :items="['5', '10', '30']"
            filled
            label="Expected duration you'll need"
            @change="newDuration => helpDuration = newDuration"
          ></v-select>

          <v-select
            :items="['pset', 'concept review', 'others']"
            filled
            label="Topic"
            @change="newTopic => helpTopic = newTopic "
          >
          </v-select>

          <v-card-actions>
            <v-spacer/> 
            <v-btn @click="isHelpRequestPopupOpen = false">CANCEL</v-btn>
            <v-btn @click="requestForHelp(helper); isHelpRequestPopupOpen = false">Request help</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Then reach out to Ray Feller -->
      <!-- <ExplanationGroupDisplay
        style="margin-top: 10px;"
        postID="PW7PmplbODxlxVTxomj3"
        originalExplDbPath="classes/mDbUrvjy4pe8Q5s5wyoD/posts/PW7PmplbODxlxVTxomj3"
        :replyExplsDbPath="'classes/mDbUrvjy4pe8Q5s5wyoD/posts/PW7Pmplb0DxlxVTxomj3/explanations'"
      /> -->

      <!-- STATISTICS -->
      <!-- <div class="headline mt-5"><b>Your statistics</b></div>
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
        </div> -->
    </v-card-text>
  </v-card>
</template>

<script>
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js"; 
import ExplanationGroupDisplay from "@/components/ExplanationGroupDisplay.vue"; 
import MapleMusicPlayer from "@/components/MapleMusicPlayer.vue"; 
import db from "@/database.js";
import { mapState } from "vuex"; 
import firebase from "firebase/app"; 
import "firebase/firestore"; 
import "firebase/functions";

export default {
  mixins: [
    DatabaseHelpersMixin
  ],
  components: {
    ExplanationGroupDisplay,
    MapleMusicPlayer
  },
  data () {
    return {
      emailMessage: `
        Hi, I have a question about the pset - I was hoping for about 5/10/30/60 minutes of help.
        Click to link to join me. 
        If you're busy now, I'll write/record my question in this room so you can reply anytime.
      `,
      allHelpers: [], // AF(null) and AF([]) can't be differentiated, but I don't care about this right now,
      tutor: {},
      helpDuration: "",
      helpTopic: "",
      isHelpRequestPopupOpen: false,
      incrementToToggleMusic: 0
    }; 
  },
  computed: {
    ...mapState([
      "mitClass",
      "user"
    ]),
    isUserATutor () {
      if (!this.user.notifyOnTutorRequest) return false; 
      else return this.user.notifyOnTutorRequest.includes(this.mitClass.id);
    }
  },
  created () {
    // convert to a forum question if nobody replies, or ask someone else? 
    this.$_bindVarToDB({
      varName: "allHelpers",
      dbRef: db.collection("users").where("notifyOnTutorRequest", "array-contains", this.mitClass.id), // determine how the data structure will look soon
      component: this 
    });
  },
  methods: {
    toggleNotifyOnTutorRequest (newBoolean) {
      const userRef = db.collection("users").doc(this.user.uid); 
      if (newBoolean === true) {
        userRef.update({
          notifyOnTutorRequest: firebase.firestore.FieldValue.arrayUnion(this.mitClass.id)
        });
      } else {
        userRef.update({
          notifyOnTutorRequest: firebase.firestore.FieldValue.arrayRemove(this.mitClass.id)
        });
      }
    },
    sendEmailInvite (invitee) {
      const sendEmailToPerson = firebase.functions().httpsCallable("sendEmailToPerson");
      const { class_id, section_id, room_id } = this.$route.params;
      sendEmailToPerson({ 
        emailOfPerson: invitee.email, 
        title: `[explain.mit.edu] ${this.mitClass.name} Invite`, 
        contentHTML: `
          <p>Hello ${invitee.firstName} - ${this.user.firstName} invited you to his/her Explain room.
          <p>${this.emailMessage}</p>
          <p>If you're free, you can join their workspace <a href="https://explain.mit.edu/class/${class_id}/section/${section_id}/room/${room_id}">here</a>.</p>
          <p>If you're busy, no need to do anything.</p>
          <p>To get push notifications on your iPad and iPhone, press on "eltonlin@mit.edu", then press "Add to VIP". Meanwhile I'm working on a way for Explain to just send push notiications without any emails.</p>
        `,
      });
      this.$root.$emit('show-snackbar', 'Sent email invite!')
    },
    requestForHelp () {
      const sendEmailToPerson = firebase.functions().httpsCallable("sendEmailToPerson");
      const { class_id, section_id, room_id } = this.$route.params;
      sendEmailToPerson({ 
        emailOfPerson: this.tutor.email, 
        title: `[explain.mit.edu] Help Request for ${this.mitClass.name}`, 
        contentHTML: `
          <p>Hello ${this.tutor.firstName} - ${this.user.firstName} requested for your help in ${this.mitClass.name} related to ${this.helpTopic}. He/she expects it to take around ${this.helpDuration} minutes. If you're free, you can join their workspace <a href="https://explain.mit.edu/class/${class_id}/section/${section_id}/room/${room_id}">here</a>.
          <p>If you're busy, no need to do anything.</p>
          <p>To get push notifications on your iPad and iPhone, press on "eltonlin@mit.edu", then press "Add to VIP". Meanwhile I'm working on a way for Explain to just send push notiications without any emails.</p>
        `,
      });
    } 
  }
};
</script>