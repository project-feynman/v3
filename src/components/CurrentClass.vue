<template>
  <!-- This 100vh is key, it means all the subsequent <div> will maintain its size regardless of how big the blackboard is (it'll just allow for 
    horizontal and vertical scrolling), which is what we want -->
  <div style="height: 100%">
    <MyParticipantDocUpdater
      :classID="classID"
      :areaID="areaID"
      :roomID="tableID"
    />

    <!-- Elevation ranges from 0 to 24 -->
    <!-- width 240; anything below, if the scrollbar appears (for laptops), then the right margin gets squished and invaded -->
    <!-- Sets the designated mobile breakpoint for the component. This will apply alternate styles for mobile devices such as the temporary prop, or activate the bottom prop when the breakpoint value is met. Setting the value to 0 will disable this functionality. -->
    <!-- Height: 100% is a workaround for Vuetify's bug with iOS Safari page hiding interactions -->
    <v-navigation-drawer v-model="isShowingDrawer" 
      app 
      style="height: 100%"
      class="elevation-24" 
      width="270" 
      disable-resize-watcher
      mobile-breakpoint="0"
      touchless 
    >      
      <v-sheet class="pt-0" style="margin-bottom: 26px;" elevation="8">    
        <div style="display: flex">
          <v-list-item-avatar @click="isAppPopupOpen = !isAppPopupOpen"
            style="cursor: pointer; margin-left: 4px; margin-bottom: 11px; margin-top: 16px; margin-right: 2px" tile width="71" height="53"
          >
            <img src="/logo.png" width="40" height="53" style="margin-left: 2px">
          </v-list-item-avatar>

          <CurrentClassDropdown @logo-click="isAppPopupOpen = !isAppPopupOpen">
          <template v-slot:add-join-leave-class>
            <v-list-item @click="isAddClassPopupOpen = !isAddClassPopupOpen">
              <v-icon left class="mr-2">mdi-plus</v-icon> Manage classes
            </v-list-item>
          </template>
        </CurrentClassDropdown>
        </div>

        <!-- Have the app overview, updates, news, as well as the chats -->
        <v-dialog v-model="isAppPopupOpen" max-width="500">
          <v-card>     
            <v-card-title>App Overview</v-card-title>
            <v-card-text>
              <b>Intro</b><br>
              Explain is an <a href="https://github.com/project-feynman/explain" target="_blank">open-source</a> startup
              with the goal of creating a worldwide community of helpers who teach each other and share explanation videos.
              <br>
              <br>
              <b>Support</b>
              <br>
              For any feedback, bug reports and new requests, don't hesitate to simply call 503 3250 3868 or email eltonlin@mit.edu.
              <br>
              <br>
              <b>Recruitment</b>
              <br>
              I'm currently the only active developer (Elton Lin) looking to recruit a co-founder and founding engineers.
              Explain served ~1000 students & teachers at MIT from 2020-2021, and raised a $0.5M seed round with OSS Capital.
              I'm also looking for classes where Office Hours is at over-capacity and would benefit highly from Explain - any introductions would be life-savingly appreciated.
              
            </v-card-text>

            <v-card-actions>
              <v-spacer/>
              
              <v-btn v-if="user.email" 
                @click="$_signOut()" large  class="mx-5 grey darken-1 white--text"
              >
                <v-icon class="mr-2">mdi-logout</v-icon>
                SIGN OUT
              </v-btn>       
            </v-card-actions>
          </v-card>
        </v-dialog>

        <CurrentClassNewPopup 
          :isAddClassPopupOpen="isAddClassPopupOpen"
          @input="(newVal) => isAddClassPopupOpen = newVal"
        />
      </v-sheet>
      
      <AllAreas
      
      />
    </v-navigation-drawer>

    <v-main>
      <CurrentClassInviteBanner v-if="isShowingBanner" 
        :redirectURL="user.inviteRequestURL || ''"
        @input="isShowingBanner = false"
      />

      <CurrentRoom 
        :roomID="tableID" 
        :key="tableID"
      />
    </v-main>
  </div>
</template>

<script>
import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/storage";
import { mapState, mapGetters } from "vuex";

import db from "@/database.js";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";

import MyParticipantDocUpdater from "@/components/MyParticipantDocUpdater.vue"; 
import BasePopupButton from "@/components/BasePopupButton.vue";
import CurrentClassDropdown from "@/components/CurrentClassDropdown.vue";
import CurrentClassNewPopup from "@/components/CurrentClassNewPopup.vue";
import CurrentClassInviteBanner from '@/components/CurrentClassInviteBanner.vue'

import BaseButton from "@/components/BaseButton.vue";
import AllAreas from '@/components/AllAreas.vue'
import CurrentArea from "@/components/CurrentArea.vue"; 
import CurrentRoom from "@/components/CurrentRoom.vue";
import AuthHelpers from "@/mixins/AuthHelpers.js";

export default {
  name: "ClassPageLayout",
  props: {
    classID: {
      type: String,
      required: true
    },
    areaID: {
      type: String,
      required: true
    },
    tableID: {
      type: String,
      required: true
    }
  },
  mixins: [
    DatabaseHelpersMixin,
    AuthHelpers
  ],
  components: {
    AllAreas,
    BaseButton,
    BasePopupButton,
    CurrentClassDropdown,
    CurrentClassNewPopup,
    CurrentClassInviteBanner,
    MyParticipantDocUpdater,
    CurrentArea,
    CurrentRoom
  },
  data: () => ({
    firebaseRef: null,
    classParticipantsRef: null,
    isShowingDrawer: true,
    isAddClassPopupOpen: false,
    isClassActionsMenuOpen: false,
    unsubscribeClassDocListener: null,
    tab: 0, // 0, 1, 2
    isAppPopupOpen: false,
    isShowingBanner: false
  }),
  computed: {
    ...mapState([
      "user",
      "mitClass",
      "isBoardFullscreen"
    ]),
    ...mapGetters([
      "numOfUnreadGlobalMsgs"
    ]),
    currentClass () {
      for (const mitClass of this.user.enrolledClasses) {
        if (mitClass.id === this.classID) {
          return mitClass; 
        }
      }
    }
  },
  // TODO: refactor this quickfix
  watch: {
    'user.inviteRequestCounter': function () {
      this.isShowingBanner = true 
    },
    isBoardFullscreen (newVal) {
      if (newVal) this.isShowingDrawer = false; 
      else this.isShowingDrawer = true; 
    },
    areaID: {
      handler () {
        this.$store.commit('SET_CURRENT_AREA_ID', this.areaID)
      },
      immediate: true
    }
  },
  created () {
    this.unsubscribeClassDocListener = db.doc(`classes/${this.classID}`).onSnapshot(classDocSnapshot => {
      this.$store.commit("SET_CLASS", { id: classDocSnapshot.id, ...classDocSnapshot.data() });
    });

    // good place to ensure backwards compatibility for new features
    const { user } = this; 

    // note the email does not exist for an anonymous user
    if (user.email) {
      db.doc(`users/${user.uid}`).update({
        mostRecentClassID: this.classID,
        penColors: user.penColors ? user.penColors : ["#B8F2F9", "#F69637", "#A9F8BD", "#6EE2EA"],
        emailOnNewQuestion: user.emailOnNewQuestion ? user.emailOnNewQuestion : [],
        emailOnNewReply: user.emailOnNewReply ? user.emailOnNewReply : []
      });
    }
  },
  destroyed () {
    this.unsubscribeClassDocListener(); 
  },
  methods: {
    redirectToNewRoom () {

    },
    declineInvite () {
      this.gentleAlarm.pause()
      this.isShowingBanner = false
    }
  }
}
</script>