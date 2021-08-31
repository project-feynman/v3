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
            <!-- <v-col cols="12" md="4">
              <h2>Friends</h2>
              <v-list shaped style="max-height: 250px" class="overflow-y-auto">
                <v-list-item-group
                  v-model="model"
                  multiple
                >
                  <template v-for="(item, i) in user.emailsOfFriends">
                    <v-divider v-if="!item"
                      :key="`divider-${i}`"
                    ></v-divider>

                    <v-list-item
                      v-else
                      :key="`item-${i}`"
                      :value="item"
                      active-class="purple--text text--accent-4"
                    >
                      <template v-slot:default="{ active }">
                        <v-list-item-content>
                          <v-list-item-title v-text="item"></v-list-item-title>
                        </v-list-item-content>

                        <v-list-item-action>
                          <v-checkbox
                            :input-value="active"
                            color="purple accent-4"
                          ></v-checkbox>
                        </v-list-item-action>
                      </template>
                    </v-list-item>
                  </template>
                </v-list-item-group>
              </v-list>
              <v-text-field v-model="newUserEmail" 
                label="Add new friend" 
                placeholder="newfriend@gmail.com"
                hide-details
              />
            </v-col> -->

            <v-col cols="12" md="4">
              <div style="display: flex; align: center">
                <div>
                  <b>Your familiar topics:</b> pset 1, Singular Value Decomposition
                </div> 
              </div>

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
            </v-col>

            <template>

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
                    v-for="email in [...volunteerStaff, ...volunteerClassmates]"
                    :key="email"
                  >
                    <!-- Name -->
                    <td>Elton Lin</td>

                    <!-- Familiar topics -->
                    <td>Vector review, pset 3</td>
                    <td>
                      <v-btn>Invite</v-btn>
                    </td>
                  </tr>
                </tbody>
              </template>
            </v-simple-table>
          </template>
            
          </v-row>

          <!-- <v-textarea v-model="emailMessage"
            label="Details"
            :placeholder="textAreaPlaceholder"
            class="mt-4"
            color="purple"
          />
          <v-spacer/>
          <v-btn @click="sendAllNecessaryEmails(newUserEmail)"
            class="purple" dark block
          >
            <v-icon class="mr-2">mdi-send</v-icon>Send invite
          </v-btn> -->
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
      textAreaPlaceholder: `Despite using Taylor's Theorem, I still cannot obtain the special result. I've recorded my current workings so far on board 1, hope someone can help, thanks!`,
      model: [],
      switch1: true,
      volunteers: [] // AF(null) and AF([]) can't be differentiated, but I don't care about this right now,
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
      return this.volunteers.filter(v => v.kind !== 'staff').map(v => v.email)
    },
    volunteerStaff () {
      return this.volunteers.filter(v => v.kind === 'staff').map(v => v.email)
    }
  },
  created () {
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
    addFriend (newEmail) {
      db.doc(`users/${this.user.uid}`).update({
        emailsOfFriends: firebase.firestore.FieldValue.arrayUnion(newEmail)
      })
    },
    sendEmailInvite (invitee) {
      const sendEmailToPerson = firebase.functions().httpsCallable("sendEmailToPerson");
      const { class_id, section_id, room_id } = this.$route.params;
      sendEmailToPerson({ 
        emailOfPerson: invitee.email, 
        title: `${this.mitClass.name} Invite`, 
        contentHTML: `
          <p>${this.user.firstName + ' ' + this.user.lastName} invited you to their room on</p> 
          <a href="https://explain.education/class/${class_id}/section/${section_id}/room/${room_id}">
            explain.education/class/${class_id}/section/${section_id}/room/${room_id}
          </a>
          <p>"${this.emailMessage}"</p>
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

