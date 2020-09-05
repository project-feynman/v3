<template>
  <v-app>
    <v-navigation-drawer app width="300" permanent>
      <SmallAppBar>
        <portal-target name="app-bar">

        </portal-target>
      </SmallAppBar>
      <portal-target name="side-drawer">

      </portal-target>

      <template v-slot:append>
        <portal-target name="side-drawer-bottom-region">

        </portal-target>
      </template>

    </v-navigation-drawer>

    <v-content>
      <portal-target name="main-content">

      </portal-target>
    </v-content>

    <!-- :key="...class_id" forces <router-view/> to re-render -->
    <!-- Many things from <router-view> will teleport to the portals above -->
    <router-view v-if="mitClass" :key="$route.params.class_id"/>
  </v-app>
</template>

<script>
import db from "@/database.js";
import firebase from "firebase/app";
import "firebase/firestore";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import { DefaultEmailSettings } from "@/CONSTANTS.js";
import { mapState } from "vuex";
import SmallAppBar from "@/components/SmallAppBar.vue"; 

export default {
  name: "ClassOverview",
  mixins: [
    DatabaseHelpersMixin
  ],
  components: {
    SmallAppBar
  },
  data: () => ({
    firebaseRef: null,
    classParticipantsRef: null,
  }),
  computed: {
    ...mapState([
      "user",
      "mitClass"
    ]),
    classID () {
      return this.$route.params.class_id;
    }
  },
  created () {
    if (this.classID) {
      this.$store.commit("SET_CLASS", null); // otherwise the other class lingers for 1 second
      this.$store.dispatch("fetchClass", this.classID);  
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
      this.$router.push({ path: '/' });
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