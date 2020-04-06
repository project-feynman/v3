<template>
  <v-app>
    <TheAppBar 
      :key="$route.name + ($route.params.class_id || '')" 
      @toggle-drawer="drawer = !drawer"
    >
      <TheDropdownMenu 
        @sign-out="signOut()" 
        @settings-changed="(S) => updateSettings(S)"
      >
        <template v-slot:activator="{ on }">
          <ButtonNew :on="on" icon="mdi-settings">Settings</ButtonNew>
        </template>
        <template v-slot:menu-buttons>
          <v-btn @click="leaveClass()" block text color="accent">
            {{ isUserEnrolled ? 'UN-ENROLL' : 'ENROLL' }} Class
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
import TheSideDrawer from "@/components/TheSideDrawer.vue";
import TheAppBar from "@/components/TheAppBar.vue";
import TheDropdownMenu from "@/components/TheDropdownMenu.vue";
import ButtonNew from "@/components/ButtonNew.vue";
import db from "@/database.js";
import firebase from "firebase/app";
import "firebase/auth";

export default {
  components: { 
    TheSideDrawer,
    TheAppBar,
    TheDropdownMenu,
    ButtonNew
  },
  data: () => ({
    drawer: true
  }),
  computed: {
    user () {
      return this.$store.state.user;
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
    leaveClass () {
      const updatedEnroll = this.user.enrolledClasses.filter((course) => course.id !== this.$route.params.class_id);
      db.collection("users").doc(this.user.uid).update({
        enrolledClasses: updatedEnroll
      });
      this.$router.push({path: '/'})
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


