<template>
  <!-- Commented out z-index so dropdown menus will show, but now tabs are submerged-->
  <v-card >
    <!-- A width of 260 is needed otherwise the 4 button's don't fit when the scrolling up and down thingy appears -->
    <v-navigation-drawer 
      :value="value" @input="newVal => $emit('input', newVal)" 
      app 
      width="300"
      class="the-side-drawer"
      permanent
    >
      <v-app-bar class="mb-4">
        <img src="/logo.png" @click="$router.push('/')" height="40" class="home-logo pl-2" style="filter:drop-shadow(0px 0px 10px white) contrast(2); cursor: pointer;"/>
        
        <v-toolbar-title v-if="mitClass" :class="['headline', 'ml-2']">
          {{ mitClass.name }}
        </v-toolbar-title>

        <v-spacer/>

        <BasePopupButton actionName="Help" 
          :inputFields="['Describe your problem']"
          @action-do="bugReport => submitBug(bugReport)"
        >
          <template v-slot:activator-button="{ on }">
            <BaseButton :on="on" icon="mdi-help" color="secondary">
              Help
            </BaseButton>
          </template>
          <template v-slot:message-to-user>
            For help with problems, write here or email <u>eltonlin@mit.edu</u>. 
            I'll reply ASAP (with exception to 2:30 pm - 9:30 pm). 
            <br>
            <br>
            Meanwhile, <u>closing the website and re-opening it</u> is the best quickfix for most problems.
            <br>
            <br>
            If you are a fellow hacker and know how to fix the issue,
            the project is <a href="https://github.com/feynman-project/explain-mit" target="_blank">open source</a> 
            and I'd love for more help.
          </template>
        </BasePopupButton>  

        <!-- Create new space -->
        <!-- <BaseButton :on="on" icon="mdi-plus" v-bind="attrs" small color="secondary">
          Create new space
        </BaseButton> -->

        <!-- Library of saved explanations -->
        <v-dialog v-model="showLibrary">
          <template v-slot:activator="{ on, attrs }">
            <BaseButton :on="on" icon="mdi-bookshelf" v-bind="attrs" small filled color="accent">
              Library
            </BaseButton>
          </template>

          <LibraryDialog/>
        </v-dialog>
      </v-app-bar>

      <!-- Displays all the open spaces -->
      <SideDrawerListOfSpaces2 v-if="!currentRoomType"
        @update:room-type="newValue => currentRoomType = newValue"
      />

      <!-- Display all the SideDrawers -->
      <SideDrawerListOfRooms v-if="currentRoomType"
        :roomType="currentRoomType"
        @update:room-type="newValue => currentRoomType = newValue"
      /> 

      <!-- Permanently displays the current user status -->
      <template v-slot:append>
        <v-card color="black"  >
          <v-card-title class="mb-0 pb-0 white--text">
            {{ user.firstName + " " + user.lastName }}
          </v-card-title>

          <v-card-text>
            <portal-target name="destination2">

            </portal-target>

            <portal-target name="instructor-only-buttons">

            </portal-target>
          </v-card-text>
        </v-card>
      </template>
    </v-navigation-drawer>
  </v-card>
</template>

<script>
import SideDrawerListOfSpaces2 from "@/components/SideDrawerListOfSpaces2.vue";
import SideDrawerListOfRooms from "@/components/SideDrawerListOfRooms.vue";  
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
    SideDrawerListOfSpaces2,
    SideDrawerListOfRooms,
    TheDropdownMenu,
    BasePopupButton,
    BaseButton,
    LibraryDialog
  },
  data () {
    return {
      showLibrary: false,
      currentRoomType: null
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
