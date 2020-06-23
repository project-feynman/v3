<template>
  <div class="text-xs-center">
    <v-menu v-model="menu" 
      :close-on-content-click="false"
      :nudge-width="200" 
      offset-x
    >
      <template v-slot:activator="{ on }">
        <slot name="activator" :on="on">

        </slot>
      </template>
      <v-card>
        <v-card-title>Email Settings</v-card-title>
        <v-divider/>
        <v-list v-if="user && $store.state.mitClass">
          <template v-for="mitClass in user.enrolledClasses">
            <v-list-item v-if="mitClass.id === $store.state.mitClass.id" :key="mitClass.id">
              <v-container class="px-0">
                <v-list-item-action>
                  <template v-for="(isEnabled, option) in DefaultEmailSettings">
                    <v-row :key="option">
                      <p class="pl-5">{{ convertToSentenceCase(option) }}</p>
                      <v-switch v-model="emailSettings[option]" :key="option" class="ml-5"/>
                    </v-row>
                  </template>
                </v-list-item-action>
              </v-container>
            </v-list-item>
          </template>
        </v-list>
        <v-card-actions>
          <v-row align="center" justify="center">
            <v-btn @click="saveSettings()" text color="secondary">Save Settings</v-btn>
            <v-btn @click="menu = false" text color="secondary">Cancel</v-btn>
          </v-row>
        </v-card-actions>
      </v-card>
    </v-menu>
  </div>
</template>

<script>
import { DefaultEmailSettings } from "@/CONSTANTS.js";
import firebase from "firebase/app";
import "firebase/firestore";
import db from "@/database.js";
import { mapState } from "vuex";

export default {
  data: () => ({
    menu: false,
    DefaultEmailSettings,
    emailSettings: { ...DefaultEmailSettings }
  }),
  computed: {
    ...mapState([
      "user",
      "mitClass"
    ]),
    dataReady () {
      return this.user && this.mitClass
    }
  },
  watch: {
    dataReady: {
      immediate: true,
      handler () {
        if (!this.dataReady) return; 
        for (let option of Object.keys(this.emailSettings)) {
          if (!this.user[option]) continue;
          this.emailSettings[option] = this.user[option].includes(this.mitClass.id);
        }
      }
    },
  },
  methods: {
    async saveSettings () {
      const updatePayload = {};
      for (let [key, value] of Object.entries(this.emailSettings)) {
        // example of `key` is "emailOnNewReply" and "emailOnNewPost"
        if (value) {
          updatePayload[key] = firebase.firestore.FieldValue.arrayUnion(this.mitClass.id);
        } else {
          updatePayload[key] = firebase.firestore.FieldValue.arrayRemove(this.mitClass.id);
        }
      }
      const userRef = db.collection("users").doc(this.user.uid);
      await userRef.update(updatePayload);
      this.menu = false; 
      this.$root.$emit("show-snackbar", "Successfully updated your email settings.")
    },
    /**
     *  @see https://stackoverflow.com/questions/7225407/convert-camelcasetext-to-sentence-case-text
     */
    convertToSentenceCase (text) {
      const result = text.replace( /([A-Z])/g, " $1" );
      return result.charAt(0).toUpperCase() + result.slice(1);
    }
  }
};
</script>