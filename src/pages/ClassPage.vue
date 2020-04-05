<template>
  <v-app>
    <TheAppBar 
      :key="$route.name + ($route.params.class_id || '')" 
      @toggle-drawer="drawer = !drawer"
    >
      <ButtonNew :icon="isUserEnrolled ? 'mdi-logout' : 'mdi-login'" @click="leaveClass">{{isUserEnrolled ? 'Leave' : 'Join'}} Class</ButtonNew>
      <TheDropdownMenu 
        @sign-out="signOut()" 
        @settings-changed="(S) => updateSettings(S)"
      >
        <template v-slot:default="{ on }">
          <ButtonNew :on="on" filled icon="mdi-settings">Settings</ButtonNew>
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
      return this.user.enrolledClasses.filter(course=>course.id===this.$route.params.class_id).length>0
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
      const updatedEnroll = this.user.enrolledClasses.filter(course=>course.id!==this.$route.params.class_id);
      db.collection("users").doc(this.user.uid).update({
        enrolledClasses: updatedEnroll
      });
      this.$router.push({path: '/'})
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


