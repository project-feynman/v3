<template>
  <v-app>
    <!-- `:key` attribute ensures components re-render when `class_id` changes -->
    <!-- TODO: refactor e.g. drawer prop -->
    <TheAppBar 
      :key="$route.name + ($route.params.class_id || '')" 
      @toggle-drawer="drawer = !drawer"
      :drawer="drawer"
    >
      <v-dialog v-model="showLibrary">
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            color="accent lighten-2"
            dark
            v-bind="attrs"
            v-on="on"
          >
            Library
          </v-btn>
        </template>
        <LibraryDialog></LibraryDialog>
      </v-dialog>
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
            <!-- <BaseButton :on="on" icon="mdi-bell">Email Settings</BaseButton> -->
            <!-- <MenuEmailSettings>
              <template v-slot:activator="{ on }">
                <v-btn v-on="on" block text color="accent">Email Settings</v-btn>
              </template>
            </MenuEmailSettings> -->
            <v-divider/>
            <v-btn @click="leaveClass()" block text color="accent">
              {{ isUserEnrolled ? 'DROP' : 'JOIN' }} Class
            </v-btn>
          </template>
        </TheDropdownMenu>
      </template>
    </TheAppBar>
    
    <!-- Open Spaces -->
    <TheSideDrawer
      v-model="drawer"
      :roomParticipantsMap="roomParticipantsMap"
    />
    
    <!-- Router View -->
    <v-content>
      <!-- 
        Without :key="$route.params.room_id", <RealtimeSpace/> will persist
        when the user is switching between different rooms,
        meaning created () and destroyed () hooks won't be called,
        and watch hooks have to be used, making the code hard to reason about.
       -->
      <RouterView :key="$route.params.room_id"/>
    </v-content>
  </v-app>
</template>

<script>
import MenuEmailSettings from "@/components/MenuEmailSettings.vue";
import TheSideDrawer from "@/components/TheSideDrawerBeta.vue";
import TheAppBar from "@/components/TheAppBar.vue";
import TheDropdownMenu from "@/components/TheDropdownMenu.vue";
import BaseButton from "@/components/BaseButton.vue";
import BasePopupButton from "@/components/BasePopupButton.vue";
import LibraryDialog from "@/components/LibraryDialog.vue";
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
    LibraryDialog,
  },
  data: () => ({
    drawer: true,
    rooms: [],
    snapshotListeners: [],
    roomParticipantsMap: {},
    hasJoinedMedia: false,
    hasLoadedMedia: false,
    isSharingScreen: false,
    portalToLiveBoard: false,
    firebaseRef: null,
    classParticipantsRef: null,
    isMinimizedView: false,
    showLibrary: false,
  }),
  computed: {
    ...mapState([
      "user",
      "mitClass",
      "session"
    ]),
    sessionID () {
      return this.session.currentID;
    },
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
      else{
        this.portalToLiveBoard = false;
      }
      return this.savedRoomId;
    },
    numberOfRooms () {
      return this.rooms.length;
    }
  },
  watch : {
    numberOfRooms () {
      this.rooms.forEach( room => {
        const roomParticipantsRef = this.classParticipantsRef.where("currentRoom", "==", room.id);
        Vue.set(this.roomParticipantsMap, room.id, []) //this makes each entry in the object reactive.
        this.$_listenToCollection(roomParticipantsRef, this.roomParticipantsMap, room.id).then(snapshotListener => {
          this.snapshotListeners.push(snapshotListener);
        });
      })
    }
  },
  created () {
    this.classParticipantsRef = db.collection(`classes/${this.classID}/participants`)
    const roomsRef = db.collection(`classes/${this.classID}/rooms`);
    this.$_listenToCollection(roomsRef, this, "rooms").then(snapshotListener => {
      this.snapshotListeners.push(snapshotListener);
    });
    this.setUserDisconnectHook();
  },
  beforeDestroy () {
    firebase.database().ref(".info/connected").off();
    for (const detachListener of this.snapshotListeners) {
      detachListener();
    };
    this.classParticipantsRef.doc(this.sessionID).delete()
    this.firebaseRef.onDisconnect().cancel();
  },
  methods: {
    handleVideoViewToggle () {
      if (!this.hasLoadedMedia && this.hasJoinedMedia){
        return;
      }
      if (this.roomID){
        this.portalToLiveBoard = !this.portalToLiveBoard;
      }
      else{
        this.portalToLiveBoard = false;
      }
    },
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
        await this.firebaseRef.onDisconnect().set({ uid: this.sessionID });

        //user hasn't always been fetched, but uid and email are set
        
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
  z-index: 100; 
  position: fixed; 
  right: 100px; 
  bottom: 0px; 
  text-align: right;
}
.button-container{
  z-index: 100; 
  position: fixed; 
  right: 0px; 
  bottom: 0px;
  text-align: right;
}
.button-container .button-bar{
  display: inline-block;
  opacity: 0.7;
}
.video-chat-container .button-bar:hover{
  opacity: 1
}
/* .video-chat-container .video-component{
  position: absolute; 
  margin-top: 50px;
  top: 0px;
  right: 0px;
  bottom: 0px;
  margin-bottom: 50px;
}
.minimize-video-btn{
  position: absolute;
  top:0%;
  right:0%;
} */
</style>

<style>
.button-bar .v-btn {
  background: #eee;
}
</style>