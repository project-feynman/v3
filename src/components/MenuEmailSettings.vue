<template>
  <div class="text-xs-center">
    <v-menu
      v-model="menu" 
      :close-on-content-click="false"
      :nudge-width="200" 
      offset-x
    >
      <template v-slot:activator="{ on }">
        <slot name="activator" :on="on">

        </slot>
      </template>
      <v-card>
        <v-list v-if="user">
          <template v-for="mitClass in user.enrolledClasses">
            <v-list-item v-if="mitClass.id === $store.state.mitClass.id" :key="mitClass.id">
              <v-container class="px-0">
                <!-- <v-list-item-title class="font-weight-bold pr-0">{{ mitClass.name }}</v-list-item-title> -->
                <v-list-item-action>
                  <template v-for="option in emailOptions">
                    <v-row>
                      <p>{{ convertToSentenceCase(option) }}</p>
                      <v-switch 
                        v-model="emailSettings[option]"
                        :label="`${emailSettings[option]}`"
                        :key="option"
                      >
                      </v-switch>
                    </v-row>
                  </template>
                  <v-row>
                    <v-btn @click="saveSettings()">Save Settings</v-btn>
                    <v-btn @click="menu = false">Cancel</v-btn>
                  </v-row>
                </v-list-item-action>
              </v-container>
            </v-list-item>
          </template>
        </v-list>
      </v-card>
    </v-menu>
  </div>
</template>

<script>
import { NotifFrequency } from "@/CONSTANTS.js";
import firebase from "firebase/app";
import "firebase/firestore";
import db from "@/database.js";

export default {
  data: () => ({
    menu: false,
    showDialog: false,
    NotifFrequency,
    emailSettings: {
      emailOnNewPost: false,
      emailOnNewReply: false,
      emailDailySummary: false,
      emailWeeklySummary: false
    },
    // TODO: make it an enumeration
    emailOptions: [
      "emailOnNewPost", 
      "emailOnNewReply", 
      "emailDailySummary", 
      "emailWeeklySummary"
    ]
  }),
  computed: {
    dataReady () {
      return this.user && this.mitClass
    },
    user () { 
      return this.$store.state.user; 
    },
    mitClass () {
      return this.$store.state.mitClass;
    }
  },
  watch: {
    dataReady: {
      handler () {
        // TODO: despite of what's been done, sometimes `mitClass` is still undefined
        if (!this.dataReady) { return; }
        console.log("this.mitClass =", this.mitClass);
        console.log("this.user =", this.user);
        for (let option of this.emailOptions) {
          if (!this.user[option]) { continue; }
          this.emailSettings[option] = this.user[option].includes(this.mitClass.id);
        }
      },
      immediate: true
    },
  },
  methods: {
    async saveSettings () {
      const updatePayload = {};
      for (let [key, value] of Object.entries(this.emailSettings)) {
        if (value) {
          updatePayload[key] = firebase.firestore.FieldValue.arrayUnion(this.mitClass.id);
        } else {
          updatePayload[key] = firebase.firestore.FieldValue.arrayRemove(this.mitClass.id);
        }
      }
      console.log("updatePayload =", updatePayload);
      const userRef = db.collection("users").doc(this.user.uid);
      await userRef.update(updatePayload);
      this.menu = false; 
      this.$root.$emit("show-snackbar", "Successfully updated your email settings.")
    },
    convertToSentenceCase (text) {
      // Refer to https://stackoverflow.com/questions/7225407/convert-camelcasetext-to-sentence-case-text
      const result = text.replace( /([A-Z])/g, " $1" );
      return result.charAt(0).toUpperCase() + result.slice(1);
    },
    classNotifChanged ({ name, id }, notifFrequency) {
      const updateArray = this.user.enrolledClasses;
      for (let i = 0; i < updateArray.length; i++) {
        if (updateArray[i].id === id) {
          updateArray[i] = { name, id, notifFrequency };
        }
      }
      this.$emit("settings-changed", updateArray);
    }
  }
};
</script>