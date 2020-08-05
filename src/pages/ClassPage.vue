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
            <BaseButton :on="on" icon="mdi-account-circle" data-qa="log-in-btn">Log In</BaseButton>
          </template>
        </BasePopupButton>

         <BasePopupButton actionName="Sign Up" 
            :inputFields="['first name', 'last name', 'email', 'password']" 
            @action-do="user => $_signUp(user)"
            outlined
            color="secondary"
          >
            <template v-slot:activator-button="{ on }">
              <BaseButton :on="on" icon="mdi-account-circle">Sign Up</BaseButton>
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
                <!-- <BaseButton :on="on" icon="mdi-bell">Email Settings</BaseButton> -->
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
    <div v-if="lastBlackboardRoomId" class="video-chat-container">
        <RealtimeAudio 
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
      <BaseButton @click="hasJoinedMedia=!hasJoinedMedia" 
        :color="hasJoinedMedia ? 'accent' : 'accent lighten-1'" 
        :outlined="hasJoinedMedia" 
        rounded
        :icon="hasJoinedMedia ? 'mdi-microphone': 'mdi-microphone-off'"
        style="right: 0px; bottom: 0px; position: relative"
      >
        <template v-if="!hasLoadedMedia">
          <template v-if="!hasJoinedMedia">Join Video Chat</template>
          <v-progress-circular v-else indeterminate size="20" width="2"/>
        </template>
        
        <template v-else>Exit Video Chat</template>
      </BaseButton>

      <BaseButton @click="portalToLiveBoard=!portalToLiveBoard" 
        color='accent'
        rounded
        outlined
        icon="mdi-video"
        style="bottom: 0px; right: 0px; position: relative"
      >
        <template v-if="portalToLiveBoard">
          Put video to bottom
        </template>
        
        <template v-else>Put video in Room</template>
      </BaseButton>
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
import BaseButton from "@/components/BaseButton.vue";
import BasePopupButton from "@/components/BasePopupButton.vue";
import RealtimeAudio from "@/components/RealtimeAudio.vue";
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
    BaseButton,
    BasePopupButton,
    RealtimeAudio
  },
  data: () => ({
    drawer: true,
    blackboards: [],
    snapshotListeners: [],
    roomParticipantsMap: {},
    hasJoinedMedia: false,
    hasLoadedMedia: false,
    portalToLiveBoard: false,
    firebaseRef: null,
    classParticipantsRef: null
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
        const roomParticipantsRef = this.classParticipantsRef.where("currentRoom", "==", blackboard.id);
        Vue.set(this.roomParticipantsMap, blackboard.id, []) //this makes each entry in the object reactive.
        this.$_listenToCollection(roomParticipantsRef, this.roomParticipantsMap, blackboard.id).then(snapshotListener => {
          this.snapshotListeners.push(snapshotListener);
        });
      })
    }
  },
  created () {
    this.classParticipantsRef = db.collection(`classes/${this.classID}/participants`)
    const blackboardsRef = db.collection(`classes/${this.classID}/blackboards`);
    this.$_listenToCollection(blackboardsRef, this, "blackboards").then(snapshotListener => {
      this.snapshotListeners.push(snapshotListener);
    });
    this.setUserDisconnectHook();
  },
  beforeDestroy () {
    firebase.database().ref(".info/connected").off();
    for (const detachListener of this.snapshotListeners) {
      detachListener();
    };
    this.classParticipantsRef.doc(this.user.uid).delete()
    this.firebaseRef.onDisconnect().cancel();
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
    },
    /**
     * Push the user object onto the room's `participants` array, and ensures that 
     * Firebase will remove the user object if he/she disconnects for whatever reason.
     * 
     * @see https://explain.mit.edu/class/mDbUrvjy4pe8Q5s5wyoD/posts/2srLvmhGXPVtmgNyNeCH
     * @see https://firebase.google.com/docs/firestore/solutions/presence
     * @see https://firebase.google.com/docs/database/web/offline-capabilities
     */
    setUserDisconnectHook () {
      // ".info/connected" is a special location on Firebase Realtime Database 
      // that keeps track of whether the current client is conneceted or disconnected (see doc above)
      firebase.database().ref(".info/connected").on("value", async snapshot => {
        const isUserConnected = snapshot.val(); 
        if (isUserConnected === false){
          return;
        } 
        this.firebaseRef = firebase.database().ref(`/class/${this.classID}/participants`);
        // 1. User leaves, and his/her identity is saved to Firebase
        // 2. Firestore detects the new user in Firebase, and uses that information to `arrayRemove` the user from the room
        
        // step 1 (step 2 is executed in Cloud Functions)
        await this.firebaseRef.onDisconnect().set({ uid: this.user.uid });

        //user hasn't always been fetched, but uid and email are set
        this.classParticipantsRef.doc(this.user.uid).set({
          uid: this.user.uid,
          email: this.user.email
        }); 
        
        this.firebaseRef.set({ // Firebase will not detect change if it's set to an empty object
          email: "", 
          uid: "", 
          firstName: "" 
        });
      });
    }
  }
}
</script>

<style scoped>
/* Make the side-drawer vertically scrollable  */
html {
  overflow-y: auto; 
}
.video-chat-container{
  border-style: solid; 
  z-index: 100; 
  position: fixed; 
  right: 0px; 
  bottom: 0px; 
  background-color: #eee;
}
</style>


