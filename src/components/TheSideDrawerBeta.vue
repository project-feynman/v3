<template>
  <!-- Commented out z-index so dropdown menus will show, but now tabs are submerged-->
  <v-card >
    <v-navigation-drawer 
      :value="value" @input="newVal => $emit('input', newVal)" 
      app 
      width="380"
      class="the-side-drawer"
    >
      <v-app-bar color="accent lighten-3" dark class="mb-4">
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
              <v-avatar v-if="user" v-on="on" style="border: 2px solid white; cursor: pointer;">
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
        
        <img src="/logo.png"
          height="40"
          @click="$router.push('/')"
          class="home-logo pl-2"
          style="filter:drop-shadow(0px 0px 10px white) contrast(2); cursor: pointer;"
        />
        <v-toolbar-title v-if="mitClass" 
          :class="['headline', 'ml-2']"
        >
          {{ mitClass.name }}
        </v-toolbar-title>
        <v-spacer/>
        <v-dialog v-model="showLibrary">
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              color="white"
              outlined
              v-bind="attrs"
              v-on="on"
            >
              Library
            </v-btn>
          </template>
          <LibraryDialog></LibraryDialog>
        </v-dialog>
      </v-app-bar>
      <TheSideDrawerSpaces
        :roomParticipantsMap="roomParticipantsMap"
      />
    </v-navigation-drawer>
  </v-card>
</template>

<script>
import TheSideDrawerSpaces from "@/components/TheSideDrawerSpaces.vue";
import TheDropdownMenu from "@/components/TheDropdownMenu.vue";
import BasePopupButton from "@/components/BasePopupButton.vue";
import BaseButton from "@/components/BaseButton.vue";
import LibraryDialog from "@/components/LibraryDialog.vue";
import AuthHelpers from "@/mixins/AuthHelpers.js";
import { DefaultEmailSettings } from "@/CONSTANTS.js";
import firebase from "firebase/app";
import db from "@/database.js";

import { mapState } from "vuex";

export default {
  props: {
    value: Boolean,
    roomParticipantsMap: Object
  },
  mixins: [
    AuthHelpers
  ],
  components: {
    TheSideDrawerSpaces,
    TheDropdownMenu,
    BasePopupButton,
    BaseButton,
    LibraryDialog
  },
  data () {
    return {
      activeTab: "rooms",
      showLibrary: false,
    }
  },
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
  },
  methods: {
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
  }
};
</script>

<style scoped>
.blackboard-item .active-count {
  font-size: 0.85em;
}
.blackboard-item .active-blackboard-users {
  display: none;
}
.blackboard-item.active-blackboard .active-count {
  display: none;
}
.blackboard-item.active-blackboard .active-blackboard-users {
  display: block;
}
.side-tabs {
  position: sticky;
  top: 0;
  z-index: 1;
}
.the-side-drawer {
  z-index: 8;
  max-width: 75%;
}
</style>
