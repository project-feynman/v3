<template>
  <v-app>
    <TheSideDrawer v-model="drawer"/>
    <v-content>
      <!-- :key="...room_id" forces <RealtimeSpace/> to re-render -->
      <RouterView :key="$route.params.room_id"/>
    </v-content>
  </v-app>
</template>

<script>
import TheSideDrawer from "@/components/TheSideDrawer.vue";
import db from "@/database.js";
import firebase from "firebase/app";
import "firebase/firestore";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import { DefaultEmailSettings } from "@/CONSTANTS.js";
import { mapState } from "vuex";

export default {
  mixins: [
    DatabaseHelpersMixin
  ],
  components: { 
    TheSideDrawer
  },
  data: () => ({
    drawer: true,
    firebaseRef: null,
    classParticipantsRef: null,
  }),
  computed: {
    ...mapState([
      "user",
      "mitClass",
      "session"
    ]),
    sessionID () { return this.session.currentID; },
    classID () { return this.$route.params.class_id; },
    roomID () { return this.$route.params.room_id; },
    isUserEnrolled () {
      if (!this.user) return; 
      if (!this.user.enrolledClasses) return; 
      return this.user.enrolledClasses.filter((course) => course.id === this.$route.params.class_id).length === 1;
    }
  },
  created () {
    const { class_id } = this.$route.params; 
    if (class_id) {
      this.$store.commit("SET_CLASS", null);
      this.$store.dispatch("fetchClass", class_id);  
    }
    this.classParticipantsRef = db.collection(`classes/${this.classID}/participants`);
    this.setUserDisconnectHook();
  },
  beforeDestroy () {
    firebase.database().ref(".info/connected").off();
    this.classParticipantsRef.doc(this.sessionID).delete()
    this.firebaseRef.onDisconnect().cancel();
  },
  methods: {
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
        if (isUserConnected === false) {
          return;
        } 
        this.firebaseRef = firebase.database().ref(`/class/${this.classID}/participants/${this.sessionID}`);
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
    },
    async submitBug ({ "Describe your problem": title }) {
      if (!title) {
        this.$root.$emit("show-snackbar", "Error: don't forget to write something")
        return;
      }
      const sendEmailToTeam = firebase.functions().httpsCallable("sendEmailToCoreTeam");
      sendEmailToTeam({ 
        userEmail: this.user ? this.user.email : "anonymous@mit.edu",
        userFeedback: title  
      });
      await db.collection("bugs").add({ 
        title,
        email: this.user ? this.user.email : "anonymous@mit.edu"
      }); 
      this.$root.$emit("show-snackbar", "Successfully sent feedback.");
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