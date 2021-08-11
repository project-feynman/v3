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
        <CurrentClassDropdown @logo-click="isAppPopupOpen = !isAppPopupOpen">
          <template v-slot:add-join-leave-class>
            <v-list-item @click="isAddClassPopupOpen = !isAddClassPopupOpen">
              <v-icon left class="mr-2">mdi-plus</v-icon> Add/join class
            </v-list-item>
          </template>
        </CurrentClassDropdown>

        <!-- Have the app overview, updates, news, as well as the chats -->
        <v-dialog v-model="isAppPopupOpen" max-width="500">
          <v-card>     
            <v-card-title>Explain</v-card-title>
            <v-card-text>
              Explain is open source, see 
              <a href="https://github.com/project-feynman/explain" target="_blank">Github</a>
            </v-card-text>

            <v-card-actions>
              <v-spacer/>
              <v-btn v-if="user.enrolledClasses.length >= 2" large @click="leaveClass()">
                LEAVE CLASS
              </v-btn>
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

import CurrentAreaDropdown from "@/components/CurrentAreaDropdown.vue"; 
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
    CurrentAreaDropdown,
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
    isAppPopupOpen: false
  }),
  computed: {
    ...mapState([
      "user",
      "mitClass",
      "isBoardFullscreen",
      "isViewingLibrary",
      "isViewingForum"
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
    isBoardFullscreen (newVal) {
      if (newVal) this.isShowingDrawer = false; 
      else this.isShowingDrawer = true; 
    },
    // REFACTOR THIS
    // setting isViewingForum to true will display the AppOverViewPopup because it's computed property relies on it, 
    // and the right tab will be selected because the tab is set here. Not a great solution, but <v-tabs> is really hard to get to work
    isViewingForum: {
      immediate: true,
      handler () {
        if (this.isViewingForum) this.tab = 1; 
      }
    },
    isViewingLibrary: {
      immediate: true, 
      handler () {
        if (this.isViewingLibrary) this.tab = 2; 
      }
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
    async leaveClass () {
      const { user } = this; 
      let classToRemove = null; 
      for (const enrolledClass of user.enrolledClasses) {
        if (enrolledClass.id === this.$route.params.class_id) {
          classToRemove = enrolledClass;
          break; 
        }
      }

      // bad quickfix code to find a different classID to become the default redirected class
      let newDefaultRedirectedClass = null; 
      for (const enrolledClass of user.enrolledClasses) {
        if (enrolledClass.id !== classToRemove.id) {
          newDefaultRedirectedClass = enrolledClass; 
          break; 
        }
      }

      const { id } = newDefaultRedirectedClass; 
      this.$router.push(`/class/${id}/section/${id}/room/${id}`);

      await db.collection("users").doc(user.uid).update({
        enrolledClasses: firebase.firestore.FieldValue.arrayRemove(classToRemove),
        mostRecentClassID: newDefaultRedirectedClass.id,
        emailOnNewQuestion: firebase.firestore.FieldValue.arrayRemove(classToRemove.id),
        emailOnNewReply: firebase.firestore.FieldValue.arrayRemove(classToRemove.id)
      });
    }
  }
}
</script>