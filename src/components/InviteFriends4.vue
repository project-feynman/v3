<template>
  <v-card>
    <v-card-title>Army of Helpers</v-card-title>
    <v-card-text>
      If you participate, you can invite fellow members for help, and can be notified whenever they come online in {{ mitClass.name }}.<br>
      The invite button sends a push notification (unfortunately via email for the time being), where the other person can click to join your room.<br> 
      It auto-expires in 20 seconds (which means the other person is busy for now)<br>
      Whenever you help each other, record videos - that's what makes the system positive sum. 
      The video portfolio is a way for you to help everyone without any additional time commitment. 
      Also, it gives an idea of what topics each person likes to explain.


            <div style="display: flex">
        <p class="mb-0 mr-2" style="margin-top: 5px">
          Participate
        </p>
        <!-- TODO: use a checkbox instead -->
        <v-switch
          :input-value="didUserVolunteer"
          @change="newBool => toggleVolunteer(newBool)"
          hide-details
          class="mt-0"
          color="cyan"
        />
      </div>

      <!-- Select notification group (group messages) -->
      <div style="display: flex">
        Get notified if people come online for {{ mitClass.name }}
        <!-- <v-checkbox v-for="">
          Hello world
        </v-checkbox> -->
      </div>

      <div style="display: flex">
        Get notified with new messages
        <v-checkbox>

        </v-checkbox>
      </div>

      <div style="display: flex; align-items: center; margin-right: 5px">
        Maplestory music
        <v-switch :input-value="user.likesMapleStoryMusic" @change="newBool => toggleMusicAutoplay(newBool)" class="ml-5 mb-5" hide-details>
          Music
        </v-switch>
      </div>

    </v-card-text>
    <!-- Explain how it works to the new users: 
        1. Toggle participation in "army of helpers"
        2. It's a positive-sum game
        3. By turning it on, you will be notified whenever someone comes online (maximum 3 times/day, at least 1 hour apart)
        4. Each person builds up a video portfolio, so you can have a sense of who'd be able to answer you question
        5. Group chat for general coordination / communication
     -->

     <!-- TODO: 
        2. Checkbox for notifications whenever someone is working in 14.02, including hte TAs (for remote Office Hours)
        4. Push notifications (real-time and offline, but same logic) 
        5. Checkbox for chat notifications (maximum 3 times/day, at least 1 hour apart) is default, otherwise it's real-time
        6. Banner and badge for new messages
        7. ...more things will inevitably come up, remember, just be k-optimal, be an execution machine, now is not planning time anymore
      -->
  

    <!-- List of participants -->
    <v-container style="display: flex">
      <!-- <v-card max-width="400"> -->
        <!-- <v-card-title>Members</v-card-title> -->
      <div style="width: 300px">
        <template v-for="volunteer of sortedVolunteers">
          <v-list-item two-line :key="volunteer.id">
            <v-list-item-content>
              <v-list-item-title>
                <v-icon v-if="volunteer.kind === 'engineer'" x-small style="opacity: 70%;">mdi-wrench</v-icon>
                <v-icon v-else-if="volunteer.kind === 'pioneer'" x-small style="opacity: 70%;">mdi-cowboy</v-icon>
                <v-icon v-else-if="volunteer.kind === 'staff'" x-small style="opacity: 70%;">mdi-account-tie</v-icon>
                <v-icon v-else x-small style="opacity: 70%;">mdi-account</v-icon>
                {{ volunteer.firstName + ' ' + volunteer.lastName }}
              </v-list-item-title>
              
              <v-list-item-subtitle>
                <v-icon v-if="volunteer.isOnline" color="green" x-small class="mr-1">mdi-circle</v-icon>
                {{ volunteer[`numOfVideosInClass:${mitClass.id}`] || 0 }} videos
              </v-list-item-subtitle>

              <!-- <v-list-item-title>{{ volunteer.firstName + ' ' + volunteer.lastName }}</v-list-item-title> -->
            </v-list-item-content>

            <v-list-item-action>
              <v-btn small :disabled="!didUserVolunteer">Invite</v-btn>
            </v-list-item-action>
          </v-list-item>

          <!-- Simple collapsible, make it a component -->
          <InviteFriendsVideoPortfolio class="ml-5" :personID="volunteer.id" :key="volunteer.id + 'video-portfolio'">
            
          </InviteFriendsVideoPortfolio>
        </template>
      </div>

      <div style="flex-grow: 1">
        <ZoomChat
          :messagesDbPath="`classes/${$route.params.class_id}/roomTypes/${$route.params.section_id}/messages`"
          :participantsDbRef="participantsRef"
          :notifFieldName="`numOfUnreadMsgsInArea:${$route.params.section_id}`"
        />
      </div>
    </v-container>


    <!-- 3 videos, can preview them -->
    <!-- <div>List of currently active users</div>  -->
      <!-- <v-card class="mx-auto" max-width="400">
        <v-card-title>Friends</v-card-title>

        <v-list-item two-line>
          <v-list-item-content>
            <v-list-item-title>Great Friend</v-list-item-title>
            <v-list-item-subtitle>14.32</v-list-item-subtitle>
          </v-list-item-content>

          <v-list-item-action>
            <v-btn small>Invite</v-btn>
          </v-list-item-action>
        </v-list-item> -->
        
        <!-- Get notified whenever someone comes online (maximum 3 notifications per day) -->
        <!-- Store timestamp -->

        <!-- Videos -->
        <!-- Title, views, sees the background change -->

        <!-- GROUP CHAT -->
        <!-- Text communication is just really good to have, if possible add badges and banners -->

        <!-- <v-list-item three-line>
          <v-list-item-content>
            <v-list-item-title>Three-line item</v-list-item-title>
            <v-list-item-subtitle>
              Secondary line text Lorem ipsum dolor sit amet,
            </v-list-item-subtitle>
            <v-list-item-subtitle>
              consectetur adipiscing elit.
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item> -->
        
      <!-- </v-card> -->
  </v-card>
</template>

<script>
import ZoomChat from '@/components/ZoomChat.vue'
import InviteFriendsVideoPortfolio from '@/components/InviteFriendsVideoPortfolio.vue'
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
    InviteFriendsVideoPortfolio
  },
  data () {
    return {
      volunteers: []
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
    sortedVolunteers () {
      return this.volunteers.sort((v1, v2) => v2.isOnline - v1.isOnline)
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
    }

  }
}
</script>