<template>
<div>
  <MapleMusicPlayer 
    :incrementToToggleMusic="incrementToToggleMusic"
    @music-fetched="incrementToToggleMusic += 1"
  />  
  <v-card>
    <v-container>

    <v-card-title style="font-size: 2rem; margin-bottom: 20px">
      Invite
    </v-card-title>

    <v-card-subtitle>
      You can invite other members of this class to explain something to you in real-time. 
      Invites auto-expire in 20 seconds: if they're available, they'll join right away.
      If they're not, try someone else.
    </v-card-subtitle>

    <v-card-text>      
      <v-form>
        <v-container>
          <v-row>
            <v-col cols="12" md="4">
              <div style="display: flex; align: center; margin-top: 5px">
                <p class="mb-0 mr-2" style="margin-top: 5px">
                  <b>Happy to explain</b>
                </p>
                <v-switch
                  :input-value="didUserVolunteer"
                  @change="newBool => toggleVolunteer(newBool)"
                  hide-details
                  class="mt-0"
                  color="cyan"
                />
              </div>

              <div style="display: flex; align: center">
                <v-textarea
                  label="Your familiar topics"
                  v-model="familiarTopics"
                  :rows="3"
                  hide-details
                  :disabled="!didUserVolunteer"
                />
              </div>
               <v-btn @click="updateFamiliarTopics()" class="mt-5" :disabled="!didUserVolunteer">
                 Update
                </v-btn>
            </v-col>

            <v-simple-table>
              <template v-slot:default>
                <thead>
                  <tr>
                    <th class="text-left">
                      Name
                    </th>
                    <th class="text-left">
                      Familiar Topics
                    </th>
                  </tr>
                </thead>

                <tbody>
                  <tr
                    v-for="volunteer in [...volunteerStaff, ...volunteerClassmates]"
                    :key="volunteer.email"
                  >
                    <td>
                      {{ volunteer.firstName + ' ' + volunteer.lastName }}
                      <v-icon v-if="volunteer.isOnline" color="green" x-small>mdi-circle</v-icon>
                    </td>

                    <!-- Familiar topics -->
                    <td>{{ volunteer[`familiarTopicsInClass:${$route.params.class_id}`] }}</td>
                    <td>
                      <template v-if="volunteer.isOnline">
                        <v-btn v-if="!isWaitingForReply" 
                          @click="sendRealtimeInviteRequest(volunteer.uid)">
                          Invite
                        </v-btn>
                        <p v-else class="mb-0">
                          Time remaining: {{ 20 - waitDuration}}
                        </p>
                      </template>
                      
                      <template v-else>
                        <v-btn @click="sendEmailInvite(volunteer)">
                          Email notify
                        </v-btn>
                      </template>
                    </td>
                  </tr>
                </tbody>
              </template>
            </v-simple-table>
          </v-row>
        </v-container>
      </v-form>
      <br>

      <!-- <v-dialog persistent v-model="isHelpRequestPopupOpen">
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
      </v-dialog> -->
    </v-card-text>
    </v-container>
  </v-card>
  </div>
</template>

<script>
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js"; 
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
    MapleMusicPlayer
  },
  data () {
    return {
      emailMessage: '',
      newUserEmail: '',
      // tutor: {},
      // helpDuration: "",
      // helpTopic: "",
      isHelpRequestPopupOpen: false,
      incrementToToggleMusic: 0,
      model: [],
      switch1: true,
      volunteers: [], // AF(null) and AF([]) can't be differentiated, but I don't care about this right now,
      isWaitingForReply: false,
      waitDuration: 0,
      countdownTimer: null
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
    },
    didUserVolunteer () {
      if (!this.user.classesVolunteered) return false
      else return this.user.classesVolunteered.includes(this.mitClass.id)
    },
    volunteerClassmates () {
      return this.volunteers.filter(v => v.kind !== 'staff')
    },
    volunteerStaff () {
      return this.volunteers.filter(v => v.kind === 'staff')
    }
  },
  created () {
    this.familiarTopics = this.user[`familiarTopicsInClass:${this.$route.params.class_id}`]

    // fetch volunteer classmates
    this.$_bindVarToDB({
      varName: 'volunteers',
      dbRef: db.collection('users').where('classesVolunteered', 'array-contains', this.mitClass.id),
      component: this
    })
  },
  methods: {
    toggleVolunteer (newBoolean) {
      console.log("toggleVolunteer, newBoolean =", newBoolean)
      const userRef = db.collection("users").doc(this.user.uid); 
      if (newBoolean === true) {
        userRef.update({
          classesVolunteered: firebase.firestore.FieldValue.arrayUnion(this.mitClass.id)
        });
      } else {
        userRef.update({
          classesVolunteered: firebase.firestore.FieldValue.arrayRemove(this.mitClass.id)
        });
      }
    },
    updateFamiliarTopics () {
      console.log('familiarTopics =', this.familiarTopics)
      db.doc(`users/${this.user.uid}`).update({
        [`familiarTopicsInClass:${this.$route.params.class_id}`]: this.familiarTopics
      })
    },
    async sendRealtimeInviteRequest (userUID) {
      console.log('userUID =', userUID)
      // update inviteRequestCounter 
      const userRef = db.doc(`/users/${userUID}`)
      // note using $route variables can introduce concurrency bugs
      const { class_id, section_id, room_id } = this.$route.params
      await userRef.update({
        inviteRequestCounter: firebase.firestore.FieldValue.increment(1),
        inviteRequestURL: `/class/${class_id}/section/${section_id}/room/${room_id}`
      })
      this.isWaitingForReply = true
      this.countdownTimer = setInterval(
        () => {
          this.waitDuration += 1
          if (this.waitDuration === 20) {
            this.isWaitingForReply = false
            clearInterval(this.countdownTimer)
          }
        },
        1000
      )
    },
    sendAllNecessaryEmails (newUserEmail) {
      if (newUserEmail) {
        this.model.push(newUserEmail)
        this.addFriend(newUserEmail)
        this.newUserEmail = ''
      }
      for (const email of this.model) {
        this.sendEmailInvite({ email })
      }
      this.$emit('emails-sent')
      this.$root.$emit('show-snackbar', 'Successfully sent email invites.')
      this.hasSentEmails = true
    }, 
    sendEmailInvite (invitee) {
      const sendEmailToPerson = firebase.functions().httpsCallable("sendEmailToPerson");
      const { class_id, section_id, room_id } = this.$route.params;
      sendEmailToPerson({ 
        emailOfPerson: invitee.email, 
        title: `${this.mitClass.name} Invite`, 
        contentHTML: `
          <p>${this.user.firstName + ' ' + this.user.lastName} invited you to explain something</p> 
          <a href="https://explain.education/class/${class_id}/section/${section_id}/room/${room_id}">
            explain.education/class/${class_id}/section/${section_id}/room/${room_id}
          </a>
          <p>If you're busy, no need to do anything. If you're free, there's a 2-minute window before this request expires.</p>
          <p>
            To get notifications, press the "From: eltonlin@mit.edu" near the top, then press "Add to VIP". 
            Meanwhile, I'm working on a way to send notifications without emails to minimize inbox clutter. 
          </p>
        `,
      })
    },
  }
};
</script>

