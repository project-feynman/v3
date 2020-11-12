<template>
  <div style="height: 100%;">
    <v-app-bar :value="!isBoardFullscreen" app width="285" height="70" extension-height="60" clipped-left color="white" elevation="10">
      <v-list-item-avatar @click="$router.push('/')" tile :width="`${40+3}px`" style="cursor: pointer;" :style="`margin-right: ${16-3}px; margin-top: 13px`">
        <img src="/logo.png">
      </v-list-item-avatar>
    
      <ClassSwitchDropdown>
        <!-- FIXME: menu disappears because dropdown disappearing will cause new popup to disappear -->
        <!-- <ClassNewPopup/> -->
      </ClassSwitchDropdown>
      
      <v-spacer/>

      <div>
        <v-dialog v-model="showLibrary" persistent>
          <template v-slot:activator="{ on, attrs }">
            <v-btn v-on="on" v-bind="attrs" fab small>
              <v-icon>mdi-bookshelf</v-icon>
            </v-btn>
          </template>

          <v-toolbar dark>
            <v-btn icon dark @click="showLibrary = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-toolbar>
          <ClassLibrary v-if="showLibrary"/>
        </v-dialog>
      </div>
    </v-app-bar>
  
    <v-navigation-drawer v-model="isShowingDrawer" class="elevation-5" :permanent="!$route.params.section_id" app width="285" mobile-breakpoint="500" clipped touchless height="100%">      
      <portal-target name="side-drawer">

      </portal-target>
      <template v-slot:append>
        <portal-target name="side-drawer-bottom-region">

        </portal-target>
      </template>
    </v-navigation-drawer>

    <v-main style="overflow-x: auto; padding-top: 0">
      <portal-target name="main-content" style="height: 100%;">
        
      </portal-target>
    </v-main>

    <!-- :key="...class_id" forces <router-view/> to re-render -->
    <!-- Many things from <router-view> will teleport to the portals above -->
    <router-view v-if="mitClass" :key="$route.params.class_id"/>
  </div>
</template>

<script>
import db from "@/database.js";
import firebase from "firebase/app";
import "firebase/firestore";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import { DefaultEmailSettings } from "@/CONSTANTS.js";
import { mapState } from "vuex";
import GroupChat from "@/components/GroupChat.vue"; 
import ClassLibrary from "@/pages/ClassLibrary.vue";
import ClassSwitchDropdown from "@/components/ClassSwitchDropdown.vue";
import ClassNewPopup from "@/components/ClassNewPopup.vue";

export default {
  name: "ClassPageTemplate",
  mixins: [
    DatabaseHelpersMixin
  ],
  components: {
    GroupChat,
    ClassLibrary,
    ClassSwitchDropdown,
    ClassNewPopup
  },
  data: () => ({
    firebaseRef: null,
    classParticipantsRef: null,
    isChatOpen: false,
    isShowingDrawer: true,
    showLibrary: false
  }),
  computed: {
    ...mapState([
      "user",
      "mitClass",
      "isBoardFullscreen"
    ])
  },
  // TODO: refactor this quickfix
  watch: {
    "$route.params.class_id": {
      deep: true,
      immediate: true,
      handler (newClassID) {
        if (this.mitClass) {
          if (newClassID === this.mitClass.id) {
            return; 
          }
        }
        const { class_id } = this.$route.params; 
        console.log("class_id =", class_id);
        this.$store.commit("SET_CLASS", null);
        this.$store.dispatch("fetchClass", class_id); 
        db.doc(`users/${this.user.uid}`).update({
          mostRecentClassID: class_id
        });
      }
    },
    isBoardFullscreen (newVal) {
      if (newVal) this.isShowingDrawer = false; 
      else this.isShowingDrawer = true; 
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