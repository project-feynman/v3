<template>
  <v-card>
    <v-card-title>Army of Helpers</v-card-title>
    <v-card-subtitle>
      <div style="display: flex">
        <p class="mb-0 mr-2" style="margin-top: 10px">
          Participate
        </p>
        <v-switch
          :input-value="didUserVolunteer"
          @change="newBool => toggleSetting({ name: 'classesVolunteered', newBool })"
          hide-details
          style="margin-top: 6px; margin-left: 2px"
          color="purple"
        />
      </div>
    </v-card-subtitle>

     <!-- TODO: 
        4. Push notifications (real-time and offline, but same logic) 
        5. Checkbox for chat notifications (maximum 3 times/day, at least 1 hour apart) is default, otherwise it's real-time
        6. Banner and badge for new messages
        7. ...more things will inevitably come up, remember, just be k-optimal, be an execution machine, now is not planning time anymore
      -->

    <v-card-text v-if="!didUserVolunteer">
      <b>How it works:</b>
      <ol>
        <li><b>Collaborate without scheduling</b>: invite your classmates, TAs who are already active in {{ mitClass.name }}</li>
        <li><b>Record your explanations</b>: so everyone can benefit from each other's explanation videos</li>
      </ol>
    </v-card-text>

    <!-- List of participants -->
    <v-container v-else style="display: flex">
      <div style="min-width: 250px; max-height: 500px" class="overflow-y-auto">
        <template v-for="volunteer of sortedVolunteers">
          <v-list-item two-line :key="volunteer.id">
            <v-list-item-content>
              <v-list-item-title>
                <v-icon v-if="volunteer.kind === 'engineer'" small style="opacity: 70%; margin-bottom: 2px">mdi-wrench</v-icon>
                <v-icon v-else-if="volunteer.kind === 'pioneer'" small style="opacity: 70%; margin-bottom: 2px">mdi-cowboy</v-icon>
                <v-icon v-else-if="volunteer.kind === 'staff' || isTA(volunteer)" small style="opacity: 70%; margin-bottom: 2px">mdi-account-tie</v-icon>
                <v-icon v-else small style="opacity: 70%; margin-bottom: 2px">mdi-account</v-icon>
                {{ volunteer.firstName + ' ' + volunteer.lastName }}
              </v-list-item-title>
              
              <v-list-item-subtitle>
                {{ volunteer[`numOfVideosInClass:${mitClass.id}`] || 0 }} videos
              </v-list-item-subtitle>

            </v-list-item-content>

            <v-list-item-action>
              <div style="display: flex">
                <v-icon v-if="volunteer.isOnline" color="green" x-small class="mr-3">mdi-circle</v-icon>
                <template v-if="volunteer.isOnline">
                  <v-btn v-if="!isWaitingForReply" 
                    @click="sendRealtimeInviteRequest(volunteer.uid)"
                    color="cyan" dark
                    x-small
                  >
                    Invite
                  </v-btn>
                  <p v-else class="mb-0">
                    Time remaining: {{ 20 - waitDuration}}
                  </p>
                </template>
                
                <template v-else>
                  <v-btn v-if="!isWaitingForEmailReply" @click="sendEmailInvite(volunteer)" x-small :disabled="!didUserVolunteer">
                    Invite
                  </v-btn>
                  <p v-else class="mb-0">
                    Time remaining: {{ 120 - emailWaitDuration }}
                  </p>
                </template>
              </div>
            </v-list-item-action>
          </v-list-item>

          <!-- Simple collapsible, make it a component -->
          <InviteFriendsVideoPortfolio 
            :personID="volunteer.id" 
            :key="volunteer.id + 'video-portfolio'"
            class="ml-5" 
          />
        </template>
      </div>
      
      <!-- GROUP CHAT -->
      <!-- Text communication is just really good to have, if possible add badges and banners -->
      <div style="flex-grow: 1; margin-left: 25px">
        <b>Group Chat</b>
        <ZoomChat
          :messagesDbPath="`classes/${$route.params.class_id}/roomTypes/${$route.params.section_id}/messages`"
          :participantsDbRef="participantsRef"
          :notifFieldName="`numOfUnreadMsgsInArea:${$route.params.section_id}`"
          :areaID="$route.params.section_id"
        />
      </div>
    </v-container>

    <v-divider/>

    <v-card-text v-if="didUserVolunteer" style="margin-top: 15px">
      <template>
        <h3>Get notified when</h3>
        <div style="display: flex; justify-content: space-between">
          <template>
            <!-- Change the number of area messages in each place, unread message count
              As a person can be in multiple group chats
            -->
            <div>
              New group message
              <v-switch
                :input-value="willGetNotifFromNewMsgInArea"
                @change="toggleGroupChatNotifSetting"
                hide-details
                class="mt-0"
                color="orange"
              />
            </div>

            <div>
              <!-- <v-checkbox hide-details style="margin-top: 0px"/> -->
              Instructors come online
              <v-switch
                :input-value="willGetNotifFromInstructors"
                @change="newBool => toggleSetting({ name: 'getNotifiedWhenInstructorsComeOnline', newBool })"
                hide-details
                class="mt-0"
                color="orange"
                :disabled="!didUserVolunteer"
              />
            </div>

            <div>
              Classmates come online
              <v-switch
                :input-value="willGetNotifFromClassmates"
                @change="newBool => toggleSetting({ name: 'getNotifiedWhenClassmatesComeOnline', newBool })"
                hide-details
                class="mt-0"
                color="orange"
                :disabled="!didUserVolunteer"
              />
            </div>
            
            <v-divider vertical/>

          </template>

          <div style="">
            Maplestory music
            <v-switch :input-value="user.likesMapleStoryMusic" @change="newBool => toggleMusicAutoplay(newBool)" color="red" hide-details class="mt-0">

            </v-switch>

            <!-- Invisible element -->
            <MapleMusicPlayer v-if="user.likesMapleStoryMusic"
              color="cyan"
              :incrementToToggleMusic="incrementToToggleMusic"
              @music-fetched="incrementToToggleMusic += 1"
            />  
          </div>

          <div>
            I'm a TA
            <v-switch 
              :input-value="userIsTA"
              color="orange"
              @change="newBool => toggleSetting({ name: 'classesTAing', newBool })" hide-details class="mt-0"
            />
          </div>
        </div>
      </template>
    </v-card-text>
  </v-card>
</template>

<script>
import ZoomChat from '@/components/ZoomChat.vue'
import InviteFriendsVideoPortfolio from '@/components/InviteFriendsVideoPortfolio.vue'
import MapleMusicPlayer from '@/components/MapleMusicPlayer.vue'
import DatabaseHelpersMixin from '@/mixins/DatabaseHelpersMixin.js'
import { mapState } from 'vuex'
import db from '@/database.js'
import firebase from 'firebase/app'
import 'firebase/firestore'

export default {
  mixins: [
    DatabaseHelpersMixin
  ],
  components: {
    ZoomChat,
    InviteFriendsVideoPortfolio,
    MapleMusicPlayer
  },
  data () {
    return {
      volunteers: [],
      waitDuration: 0,
      emailWaitDuration: 0,
      emailCountdownTimer: null,
      isWaitingForEmailReply: false,
      isWaitingForReply: false,

      incrementToToggleMusic: 0
    }
  },
  computed: {
    ...mapState([
      'user',
      'mitClass'
    ]),
    didUserVolunteer () {
      if (!this.user.classesVolunteered) return false
      else return this.user.classesVolunteered.includes(this.mitClass.id)
    }, 
    willGetNotifFromClassmates () {
      const { user, mitClass } = this
      if (!user.getNotifiedWhenClassmatesComeOnline) return false
      return user.getNotifiedWhenClassmatesComeOnline.includes(mitClass.id)
    },
    willGetNotifFromInstructors () {
      const { user, mitClass } = this
      if (!user.getNotifiedWhenInstructorsComeOnline) return false
      return user.getNotifiedWhenInstructorsComeOnline.includes(mitClass.id)
    },  
    willGetNotifFromNewMsgInArea () {
      const { user } = this
      // note the plural in "areas"
      if (!user.willGetNotifFromNewMsgInAreas) return false      
      return user.willGetNotifFromNewMsgInAreas.includes(this.$route.params.section_id)
    },
    userIsTA () {
      const { user, mitClass } = this 
      if (!user.classesTAing) return false 
      return user.classesTAing.includes(mitClass.id)
    },
    sortedVolunteers () {
      return this.volunteers.sort((v1, v2) => {
        if (v1.isOnline !== v2.isOnline) return v2.isOnline - v1.isOnline
        else return (v2[`numOfVideosInClass:${this.mitClass.id}`] || 0) - (v1[`numOfVideosInClass:${this.mitClass.id}`] || 0)
      })
    },
    participantsRef () {
      const { class_id, section_id } = this.$route.params
      return db.doc(`classes/${class_id}`).collection("participants").where("roomTypeID", "==", section_id);
    }
  },
  created () {
    this.$_bindVarToDB({
      varName: 'volunteers',
      dbRef: db.collection('users').where('classesVolunteered', 'array-contains', this.mitClass.id),
      component: this
    })
  },
  methods: {
    isTA (person) {
      if (!person.classesTAing) return false 
      return person.classesTAing.includes(this.mitClass.id)
    },
    toggleMusicAutoplay (newBoolean) {
      const userRef = db.collection('users').doc(this.user.uid)
      if (newBoolean) userRef.update({ likesMapleStoryMusic: true })
      else userRef.update({ likesMapleStoryMusic: false })
    },
    toggleSetting ({ name, newBool }) {
      const { user, mitClass } = this 
      const userRef = db.collection('users').doc(user.uid) 
      const { arrayUnion, arrayRemove } = firebase.firestore.FieldValue
      const updatePayload = {} 
      updatePayload[name] = newBool ? arrayUnion(mitClass.id) : arrayRemove(mitClass.id)
      userRef.update(updatePayload)
    },
    toggleGroupChatNotifSetting () {
      const ref = db.doc(`users/${this.user.uid}`)
      const { arrayUnion, arrayRemove } = firebase.firestore.FieldValue
      const { section_id } = this.$route.params
      if (this.willGetNotifFromNewMsgInArea) {
        ref.update({ willGetNotifFromNewMsgInAreas: arrayRemove(section_id) })  
      } else {
        ref.update({ willGetNotifFromNewMsgInAreas: arrayUnion(section_id) })
      }
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
          <a href="${window.location.origin}/class/${class_id}/section/${section_id}/room/${room_id}">
            ${window.location.origin}/class/${class_id}/section/${section_id}/room/${room_id}
          </a>
          <p>If you're busy, no need to do anything.</p>
          <p>
            To get notifications, press the "From: eltonlin@mit.edu" near the top, then press "Add to VIP". 
            Meanwhile, I'm working on a way to send notifications without emails to minimize inbox clutter. 
          </p>
        `,
      })
    }
  }
}
</script>