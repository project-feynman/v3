<template>
  <!-- This 100vh is key, it means all the subsequent <div> will maintain its size regardless of how big the blackboard is (it'll just allow for 
    horizontal and vertical scrolling), which is what we want -->
  <div style="height: 100%">
    <SteamNotificationInitiator v-if="mitClass"/>

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
      <v-sheet style="margin-bottom: 26px; padding-bottom: 2px" elevation="8">    
        <div style="display: flex">
          <v-list-item-avatar @click="isAppPopupOpen = !isAppPopupOpen"
            style="cursor: pointer; margin-left: 6px; margin-right: 2px;" tile width="60" height="60"
          >
            <v-img src="/logo.png" width="60" height="54" style="margin-top: 8px"/>
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
              <a href="https://github.com/project-feynman/explain" target="_blank">Explain's</a> goal is open education
              <br>
              <br>
              <b>Support</b>
              <br>
              For any feedback, bug reports and new requests, don't hesitate to simply call 503 3250 3868 or email eltonlin@mit.edu.
              <br>
              <br>
              <b>Recruitment</b>
              <br>
              Explain serves around 500 students/teachers across 8.01, ESG, etc. If you'd like to join our web dev team, email eltonlin@mit.edu
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
import { mapState, mapGetters } from "vuex";

import db from "@/database.js";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";

import MyParticipantDocUpdater from "@/components/MyParticipantDocUpdater.vue"; 
import BasePopupButton from "@/components/BasePopupButton.vue";
import CurrentClassDropdown from "@/components/CurrentClassDropdown.vue";
import CurrentClassNewPopup from "@/components/CurrentClassNewPopup.vue";
import CurrentClassInviteBanner from '@/components/CurrentClassInviteBanner.vue'
import SteamNotificationInitiator from '@/components/SteamNotificationInitiator.vue'

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
    CurrentRoom,
    SteamNotificationInitiator
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
      "mitClass"
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
    areaID: {
      handler () {
        this.$store.commit('SET_CURRENT_AREA_ID', this.areaID)
      },
      immediate: true
    }
  },
  created () {
    // listens for blackboard toolbar's toggle fullscreen
    this.$root.$on('fullscreen-toggle', () => this.isShowingDrawer = !this.isShowingDrawer)

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
    declineInvite () {
      this.gentleAlarm.pause()
      this.isShowingBanner = false
    }
  }
}
</script>