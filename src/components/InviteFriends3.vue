<template>
    <v-card>
      <MapleMusicPlayer v-if="user.likesMapleStoryMusic"
        :incrementToToggleMusic="incrementToToggleMusic"
        @music-fetched="incrementToToggleMusic += 1"
      />  
      <!-- <v-container> -->
        <!-- <v-card-title style="font-size: 2rem; margin-bottom: 20px">
          Find helper
        </v-card-title> -->

         <v-card-title class="text-h5 grey white--text">
          Find Helper
        </v-card-title>

        <!-- Friends, Helpers, Group Chat -->
        <v-card-text>
        <v-row>
          <v-col cols="4">
            <v-card
              class="mx-auto"
              max-width="400"
            >
              <v-card-title>Friends</v-card-title>

              <v-list-item two-line>
                <v-list-item-content>
                  <v-list-item-title>Great Friend</v-list-item-title>
                  <v-list-item-subtitle>14.32</v-list-item-subtitle>
                </v-list-item-content>

                <v-list-item-action>
                  <v-btn small>Invite</v-btn>
                </v-list-item-action>
              </v-list-item>

              <!-- TODO: friend chat -->
              <div>Friends chat</div>

              <div style="display: flex; align-items: center; margin-right: 5px">
                  Get notifications
                <v-switch hide-details class="ml-5 mb-5">   </v-switch>
              </div>
                
             
              <div style="display: flex; align-items: center; margin-right: 5px">
                Maplestory music
                <v-switch :input-value="user.likesMapleStoryMusic" @change="newBool => toggleMusicAutoplay(newBool)" class="ml-5 mb-5" hide-details>
                  Music
                </v-switch>
              </div>
                
            </v-card>
            
            
          </v-col>
          <v-col cols="4">
            <v-card
              class="mx-auto"
              max-width="400"
              tile
            >
              <v-card-title>Volunteers</v-card-title>

              <v-list-item v-for="v in sortedVolunteers" :key="v.id" two-line>
                <v-list-item-content>
                  <v-list-item-title>
                    <v-icon v-if="v.kind === 'engineer'" x-small style="opacity: 70%;">mdi-wrench</v-icon>
                    <v-icon v-else-if="v.kind === 'pioneer'" x-small style="opacity: 70%;">mdi-cowboy</v-icon>
                    <v-icon v-else-if="v.isAdmin" x-small style="opacity: 70%;">mdi-account-tie</v-icon>
                    <v-icon v-else x-small style="opacity: 70%;">mdi-account</v-icon>
                    {{ v.firstName + ' ' + v.lastName }}
                  </v-list-item-title>
                  
                  <v-list-item-subtitle>
                    <div style="display: flex">
                      <v-icon v-if="v.isOnline" color="green" x-small class="mr-1">mdi-circle</v-icon>
                      <div v-if="v.kind === 'staff'">Office Hours</div>
                      <div v-else></div>
                      {{ v.kind  === 'staff' ? v[`goodTimesToAskInClass:${$route.params.class_id}`] : v[`familiarTopicsInClass:${$route.params.class_id}`] }}
                    </div>
                  </v-list-item-subtitle>
                </v-list-item-content>

                <v-list-item-action>
                  <template v-if="v.isOnline">
                    <v-btn v-if="!isWaitingForReply" 
                      @click="sendRealtimeInviteRequest(v.uid)"
                      color="cyan" dark x-small
                    >
                      Invite
                    </v-btn>
                    <p v-else class="mb-0">
                      {{ 20 - waitDuration}}
                    </p>
                  </template>
                  
                  <template v-else>
                    <!-- TODO: t should be a popup, where you can write a message, and select a topic -->
                    <v-btn v-if="!isWaitingForEmailReply" @click="sendEmailInvite(v)" small>
                      Message
                    </v-btn>
                    <p v-else class="mb-0">
                      {{ 120 - emailWaitDuration }}
                    </p>
                  </template>
                </v-list-item-action>
              </v-list-item>

              <v-card-text>

                <div style="display: flex; align: center; margin-top: 5px; padding-right: 5px">
                  <!-- <div style="display: flex; align: center"> -->

                    <!-- <v-spacer/> -->
                    <p class="mb-0 mr-2" style="margin-top: 5px">
                      Volunteer
                    </p>
                    <v-switch
                      :input-value="didUserVolunteer"
                      @change="newBool => toggleVolunteer(newBool)"
                      hide-details
                      class="mt-0"
                      color="cyan"
                    />
                  </div>

                  <v-textarea v-if="user.kind === 'staff'"
                    label="Office Hours"
                    v-model="goodTimesToAsk"
                    :rows="2"
                    hide-details
                    placeholder=""
                    :disabled="!didUserVolunteer"
                    @input="debounced(updateGoodTimesToAsk)"
                  />

                  <v-textarea v-else
                    label="Favorite topics"
                    v-model="familiarTopics"
                    :rows="2"
                    hide-details
                    placeholder=""
                    :disabled="!didUserVolunteer"
                    @input="debounced(updateFamiliarTopics)"
                  />
                <!-- </div> -->
              </v-card-text>
            </v-card>
          
          </v-col>
          <v-col cols="4">
            <v-card
              class="mx-auto"
              max-width="400"
              tile
            >
              <v-card-title>Everyone</v-card-title>
              <ZoomChat
                :messagesDbPath="`classes/${$route.params.class_id}/roomTypes/${$route.params.section_id}/messages`"
                :participantsDbRef="participantsRef"
                :notifFieldName="`numOfUnreadMsgsInArea:${$route.params.section_id}`"
              />
              <v-card-actions>
                Get notifications
                 <v-switch
                  :input-value="true"
                  @change="newBool => toggleAreaChatNotifications(newBool)"
                  hide-details
                  class="mt-0"
                  color="cyan"
                />
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
              <!-- </v-card-text> -->
                  <!-- <br>
          <v-spacer/> -->

    
        </v-card-text>
    </v-card>
</template>

<script>
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js"; 
import MapleMusicPlayer from "@/components/MapleMusicPlayer.vue"; 
import db from "@/database.js";
import { mapState } from "vuex"; 
import firebase from "firebase/app"; 
import "firebase/firestore"; 
import "firebase/functions";
import 'firebase/analytics'
import ZoomChat from '@/components/ZoomChat.vue'

export default {
  mixins: [
    DatabaseHelpersMixin
  ],
  components: {
    MapleMusicPlayer,
    ZoomChat
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
      countdownTimer: null,
      familiarTopics: '',
      goodTimesToAsk: '',
      isWaitingForEmailReply: false,
      emailWaitDuration: 0,
      emailCountdownTimer: null,

      debounceTimeout: null
    }; 
  },
  computed: {
    ...mapState([
      "mitClass",
      "user"
    ]),
    participantsRef () {
      const { class_id, section_id } = this.$route.params
      return db.doc(`classes/${class_id}`).collection("participants").where("roomTypeID", "==", section_id);
    },
    isUserATutor () {
      if (!this.user.notifyOnTutorRequest) return false; 
      else return this.user.notifyOnTutorRequest.includes(this.mitClass.id);
    },
    didUserVolunteer () {
      if (!this.user.classesVolunteered) return false
      else return this.user.classesVolunteered.includes(this.mitClass.id)
    },
    sortedVolunteers () {
      return this.volunteers.sort((v1, v2) => v2.isOnline - v1.isOnline)
    },
    volunteerClassmates () {
      return this.volunteers.filter(v => v.kind !== 'staff')
    },
    volunteerStaff () {
      return this.volunteers.filter(v => v.kind === 'staff')
    }
  },
  created () {
    firebase.analytics().logEvent('request_helper', { className: this.mitClass.name })

    this.familiarTopics = this.user[`familiarTopicsInClass:${this.$route.params.class_id}`]
    this.goodTimesToAsk = this.user[`goodTimesToAskInClass:${this.$route.params.class_id}`]

    // fetch volunteer classmates
    this.$_bindVarToDB({
      varName: 'volunteers',
      dbRef: db.collection('users').where('classesVolunteered', 'array-contains', this.mitClass.id),
      component: this
    })
  },
  methods: {
    toggleMusicAutoplay (newBoolean) {
      const userRef = db.collection('users').doc(this.user.uid)
      if (newBoolean) userRef.update({ likesMapleStoryMusic: true })
      else userRef.update({ likesMapleStoryMusic: false })
    },
    toggleVolunteer (newBoolean) {
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
    debounced (func) {  
      if (this.debounceTimeout) clearTimeout(this.timeout)
      this.debounceTimeout = setTimeout(() => {
        func()
      }, 500); // delay
    },
    updateFamiliarTopics () {
      console.log('familiarTopics =', this.familiarTopics)
      db.doc(`users/${this.user.uid}`).update({
        [`familiarTopicsInClass:${this.$route.params.class_id}`]: this.familiarTopics
      })
    },
    updateGoodTimesToAsk () {
      db.doc(`users/${this.user.uid}`).update({
        [`goodTimesToAskInClass:${this.$route.params.class_id}`]: this.goodTimesToAsk
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
      this.isWaitingForEmailReply = true
      this.emailCountdownTimer = setInterval(
        () => {
          this.emailWaitDuration += 1
          if (this.emailWaitDuration === 120) {
            this.isWaitingForEmailReply = false
            clearInterval(this.emailCountdownTimer)
          }
        },
        1000
      )
      const sendEmailToPerson = firebase.functions().httpsCallable("sendEmailToPerson");
      const { class_id, section_id, room_id } = this.$route.params;
      sendEmailToPerson({ 
        emailOfPerson: invitee.email, 
        title: `${this.mitClass.name} Invite`, 
        contentHTML: `
          <p>${this.user.firstName + ' ' + this.user.lastName} invited you to explain something</p> 
          <a href="https://explain.web.app/class/${class_id}/section/${section_id}/room/${room_id}">
            explain.web.app/class/${class_id}/section/${section_id}/room/${room_id}
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

