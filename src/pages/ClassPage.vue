<template>
  <!-- :key="...class_id" forces <router-view/> to re-render -->
  <router-view v-if="mitClass" :key="$route.params.class_id"/>
</template>

<script>
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
    sessionID () { 
      return this.session.currentID; 
    },
    classID () { 
      return this.$route.params.class_id; 
    },
  },
  created () {
    const { class_id } = this.$route.params; 
    if (class_id) {
      this.$store.commit("SET_CLASS", null); // otherwise the other class lingers for 1 second
      this.$store.dispatch("fetchClass", class_id);  
    }
  },
  methods: {
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