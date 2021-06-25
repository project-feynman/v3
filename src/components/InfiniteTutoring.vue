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
      <div class="headline">Introduction</div> 

      <b>1-on-1 tutoring is an extremely scarce resource</b>
      <div>
        In an ideal world with infinite resources, we can get high quality tutoring whenever we want. 
        But in reality, everyone is very busy with their lives, and simply can't afford to help too much.

        One of my motivations for creating Explain is that, I struggled a lot in school - and even though many people helped me along the way,
        in reality, I needed much more tutoring for how behind I was. I think the best analogy is that of homelessness - you can give me $5, but 
        the sad truth is, I need $500 to even rent a place for a month - something nobody can afford to give to a homeless person for nothing in return.
        To put it simply, high quality tutoring is an extremely scarce resource.
      </div>

      <br>

      <b>I believe videos can make high quality, free tutoring available to everyone</b>
      <div>
        I believe KhanAcademy revealed a clue about how to solve that - videos. Explanation videos have a magical property in that, high quality explanations can be made once,
        then viewed by an infinite number of people an infinite number of times. The problem is, even today, virtually nobody records explanation videos at MIT, for the simple reason that 
        who'd suddenly devote an hour of their day to record videos on YouTube in the hopes that it'll be helpful to some random viewers? People 
        much prefer to explain things to someone in-person - what if there is some way to leverage those interactions into video explanations?
      </div>

      <br>

      <b>How it works</b>
      <div>
        You sign up as a tutor, and you help people one at a time (if you request for help, your helper will be notified, and can just come to your workspace directly). But that is not enough - you will soon be overwhelmed with requests. So what you do is, 
        while you are helping just a single person, you record your explanation (two birds with one stone), so that helping one person is equivalent to helping everyone. 
        That's how you achieve infinite scalability. In fact, once the video materials have become complete over time, the need for live tutoring be minimized.
        That's the concept of infinite tutoring. To see things from both perspectives, you can sign up as a tutor and request help from yourself and see what happens : ) 
      </div>

      <br>

      <div class="headline">Sign up as a volunteer helper</div>
      <v-switch 
        :input-value="isUserATutor"
        @change="newBoolean => toggleNotifyOnTutorRequest(newBoolean)"
      />

      <div class="headline">Volunteer helpers / study group</div> 
      <v-list>
        <template v-for="helper of allHelpers">
          <v-list-item :key="helper.id">
            <v-list-item-title>{{ helper.firstName + " " + helper.lastName }}</v-list-item-title>
            <v-list-item-subtitle>Tutored 0 times and shared 0 videos</v-list-item-subtitle> 
            <v-btn @click="tutor = helper; isHelpRequestPopupOpen = true;">Request for help</v-btn>
          </v-list-item>
        </template>
      </v-list>

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

      <ExplanationGroupDisplay
        style="margin-top: 10px;"
        postID="PW7PmplbODxlxVTxomj3"
        originalExplDbPath="classes/mDbUrvjy4pe8Q5s5wyoD/posts/PW7PmplbODxlxVTxomj3"
        :replyExplsDbPath="'classes/mDbUrvjy4pe8Q5s5wyoD/posts/PW7Pmplb0DxlxVTxomj3/explanations'"
      />

      <!-- STATISTICS -->
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