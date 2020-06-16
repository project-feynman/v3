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
            <ButtonNew :on="on" icon="mdi-account-circle" data-qa="account-btn">Account</ButtonNew>
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
import BasePopupButton from "@/components/BasePopupButton.vue";
import db from "@/database.js";
import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/auth";
import AuthHelpers from "@/mixins/AuthHelpers.js";
import { DefaultEmailSettings } from "@/CONSTANTS.js";
import { mapState } from "vuex";

export default {
  mixins: [
    AuthHelpers,
  ],
  components: { 
    TheSideDrawer,
    TheAppBar,
    TheDropdownMenu,
    MenuEmailSettings,
    ButtonNew,
    BasePopupButton
  },
  data: () => ({
    drawer: true
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


