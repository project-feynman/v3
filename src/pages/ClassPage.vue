<template>
  <v-app>
    <!-- `:key` attribute ensures components re-render when `class_id` changes -->
    <TheAppBar 
      :key="$route.name + ($route.params.class_id || '')" 
      @toggle-drawer="drawer = !drawer"
    >
      <template v-if="!user">
        <BasePopupButton actionName="Log in" 
          :inputFields="['email', 'password']" 
          @action-do="user => $_logIn(user)"
          outlined
          color="secondary"
        >
          <template v-slot:activator-button="{ on }">
            <ButtonNew :on="on" icon="mdi-account-circle" data-qa="log-in-btn">Log In</ButtonNew>
          </template>
        </BasePopupButton>

         <BasePopupButton actionName="Sign Up" 
            :inputFields="['first name', 'last name', 'email', 'password']" 
            @action-do="user => $_signUp(user)"
            outlined
            color="secondary"
          >
            <template v-slot:activator-button="{ on }">
              <ButtonNew :on="on" icon="mdi-account-circle">Sign Up</ButtonNew>
            </template>
            <template v-slot:message-to-user>
              Sign up for an account so you can enroll in classes to ask questions and create explanations. 
              Passwords are handled by Google Firebase Authentication.
            </template>
          </BasePopupButton>
      </template>

      <template v-else>
        <!-- Account Circle -->
        <TheDropdownMenu 
          @sign-out="$_signOut()" 
          @settings-changed="(S) => updateSettings(S)"
        > 
          <template v-slot:activator="{ on }">
            <v-avatar v-if="user" v-on="on" color="#ff5b24" style="cursor: pointer;">
              <span v-if="user.firstName && user.lastName" class="white--text headline">
                {{ user.firstName[0] + user.lastName[0] }}
              </span>
            </v-avatar>
          </template>

          <template v-slot:menu-buttons>
            <!-- Email notifications -->
            <MenuEmailSettings>
              <template v-slot:activator="{ on }">
                <v-btn v-on="on" block text color="accent">Email Settings</v-btn>
                <!-- <ButtonNew :on="on" icon="mdi-bell">Email Settings</ButtonNew> -->
              </template>
            </MenuEmailSettings>
            <v-divider/>
            <v-btn @click="leaveClass()" block text color="accent">
              {{ isUserEnrolled ? 'DROP' : 'JOIN' }} Class
            </v-btn>
          </template>
        </TheDropdownMenu>
      </template>
    </TheAppBar>

    <TheSideDrawer
      v-model="drawer"
      :roomParticipantsMap="roomParticipantsMap"/>
    <div v-if="lastBlackboardRoomId" style="border-style; solid; z-index: 100; position: fixed; right: 0px; bottom: 0px">
        <LiveBoardAudio 
          v-if="user"
          :roomId="lastBlackboardRoomId"
          :classId="classID"
          :roomParticipants="roomParticipantsMap[lastBlackboardRoomId]"
          :portalToLiveBoard="portalToLiveBoard"
          :hasJoinedMedia="hasJoinedMedia"
          @left-room="hasJoinedMedia=false; hasLoadedMedia=false;"
          @media-connected="hasLoadedMedia=true"
          :key="lastBlackboardRoomId"
        />
      <ButtonNew @click="hasJoinedMedia=!hasJoinedMedia" 
        :color="hasJoinedMedia ? 'accent' : 'accent lighten-1'" 
        :outlined="hasJoinedMedia" 
        rounded
        :icon="hasJoinedMedia ? 'mdi-microphone': 'mdi-microphone-off'"
      >
        <template v-if="!hasLoadedMedia">
          <template v-if="!hasJoinedMedia">Join Video Chat</template>
          <v-progress-circular v-else indeterminate size="20" width="2"/>
        </template>
        
        <template v-else>Exit Video Chat</template>
      </ButtonNew>

      <ButtonNew @click="portalToLiveBoard=!portalToLiveBoard" 
        color='accent'
        rounded
        outlined
        icon="mdi-video"
      >
        <template v-if="portalToLiveBoard">
          Put video to bottom
        </template>
        
        <template v-else>Put video in Room</template>
      </ButtonNew>
    </div>
    <v-content>
      <RouterView :key="$route.fullPath"/>
    </v-content>
  </v-app>
</template>

<script>
import MenuEmailSettings from "@/components/MenuEmailSettings.vue";
import TheSideDrawer from "@/components/TheSideDrawer.vue";
import TheAppBar from "@/components/TheAppBar.vue";
import TheDropdownMenu from "@/components/TheDropdownMenu.vue";
import ButtonNew from "@/components/ButtonNew.vue";
import BasePopupButton from "@/components/BasePopupButton.vue";
import LiveBoardAudio from "@/components/LiveBoardAudio.vue";
import db from "@/database.js";
import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/auth";
import AuthHelpers from "@/mixins/AuthHelpers.js";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import { DefaultEmailSettings } from "@/CONSTANTS.js";
import { mapState } from "vuex";
import Vue from 'vue';

export default {
  mixins: [
    AuthHelpers,
    DatabaseHelpersMixin
  ],
  components: { 
    TheSideDrawer,
    TheAppBar,
    TheDropdownMenu,
    MenuEmailSettings,
    ButtonNew,
    BasePopupButton,
    LiveBoardAudio
  },
  data: () => ({
    drawer: true,
    blackboards: [],
    snapshotListeners: [],
    roomParticipantsMap: {},
    hasJoinedMedia: false,
    hasLoadedMedia: false,
    portalToLiveBoard: false
  }),
  computed: {
    ...mapState([
      "user",
      "mitClass"
    ]),
    isUserEnrolled () {
      if (!this.user) return; 
      if (!this.user.enrolledClasses) return; 
      return this.user.enrolledClasses.filter((course) => course.id === this.$route.params.class_id).length === 1;
    },
    classID () {
      return this.$route.params.class_id;
    },
    roomID () {
      return this.$route.params.room_id;
    },
    lastBlackboardRoomId () {
      if (this.roomID) {
        this.savedRoomId = this.roomID;
      }
      return this.savedRoomId;
    },
    numberOfBlackboards () {
      return this.blackboards.length;
    }
  },
  watch : {
    numberOfBlackboards () {
      
      this.blackboards.forEach( blackboard => {
        const blackboardsRef = db.collection(`classes/${this.classID}/blackboards`);
        const participantsRef = blackboardsRef.doc(blackboard.id).collection('participants');
        Vue.set(this.roomParticipantsMap, blackboard.id, []) //this makes each entry in the object reactive.
        this.$_listenToCollection(participantsRef, this.roomParticipantsMap, blackboard.id).then(snapshotListener => {
          this.snapshotListeners.push(snapshotListener);
        });
      })
      console.log("listening for map")
    },
    roomParticipantsMap () {
      console.log("MAP", this.roomParticipantsMap)
    }
  },
  created () {
    console.log("created Classpage")
    const blackboardsRef = db.collection(`classes/${this.classID}/blackboards`);
    this.$_listenToCollection(blackboardsRef, this, "blackboards").then(snapshotListener => {
      console.log("listening to blackboard")
      this.snapshotListeners.push(snapshotListener);
    });
  },
  beforeDestroy () {
    for (const detachListener of this.snapshotListeners) {
      detachListener();
    };
  },
  methods: {
    async updateSettings (payload) {
      const userRef = db.doc(`users/${this.user.uid}`);
      userRef.update({ 
        enrolledClasses: payload 
      });
    },
    async leaveClass () {
      const emailSettingsUpdate = {};
      for (let emailOption of Object.keys(DefaultEmailSettings)) {
        emailSettingsUpdate[emailOption] = firebase.firestore.FieldValue.arrayRemove(this.mitClass.id);
      }
      const updatedEnroll = this.user.enrolledClasses.filter((course) => course.id !== this.$route.params.class_id);
      await db.collection("users").doc(this.user.uid).update({
        enrolledClasses: updatedEnroll,
        ...emailSettingsUpdate
      });
      this.$router.push({path: '/'});
      this.$root.$emit("show-snackbar", "Successfully dropped class.");
    }
  }
}
</script>

<style scoped>
/* Make the side-drawer vertically scrollable  */
html {
  overflow-y: auto; 
}
</style>


