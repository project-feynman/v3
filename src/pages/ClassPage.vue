<template>
  <v-app>
    <TheAppBar 
      :key="$route.name + ($route.params.class_id || '')" 
      @toggle-drawer="drawer = !drawer"
    >
      <!-- Email notifications -->
      <MenuEmailSettings>
        <template v-slot:activator="{ on }">
          <ButtonNew :on="on" icon="mdi-bell">Email Settings</ButtonNew>
        </template>
      </MenuEmailSettings>

      <TheDropdownMenu 
        @sign-out="signOut()" 
        @settings-changed="(S) => updateSettings(S)"
      >
        <template v-slot:activator="{ on }">
          <ButtonNew :on="on" icon="mdi-account-circle">Account</ButtonNew>
        </template>
        <template v-slot:menu-buttons>
          <v-btn @click="leaveClass()" block text color="accent">
            {{ isUserEnrolled ? 'DROP' : 'JOIN' }} Class
          </v-btn>
        </template>
      </TheDropdownMenu>
    </TheAppBar>
    <TheSideDrawer v-model="drawer"/>
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
import db from "@/database.js";
import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/auth";
import { DefaultEmailSettings } from "@/CONSTANTS.js";

export default {
  components: { 
    TheSideDrawer,
    TheAppBar,
    TheDropdownMenu,
    MenuEmailSettings,
    ButtonNew
  },
  data: () => ({
    drawer: true
  }),
  computed: {
    user () {
      return this.$store.state.user;
    },
    mitClass () {
      return this.$store.state.mitClass;
    },
    isUserEnrolled () {
      if (!this.user) { return; }
      if (!this.user.enrolledClasses) { return; }
      return this.user.enrolledClasses.filter((course) => course.id === this.$route.params.class_id).length === 1;
    }
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
      this.$root.$emit("show-snackbar", "Successfully dropped class.")
    },
    signOut () { 
      firebase.auth().signOut(); 
      this.$router.push("/");
    }
  }
}
</script>

<style>
/* Make the side-drawer vertically scrollable  */
html {
  overflow-y: auto; 
}
</style>


