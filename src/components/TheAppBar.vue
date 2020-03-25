<template>
  <v-app-bar app clipped-left color="white" dense elevate-on-scroll class="app-banner" style="zIndex:9;" :height="navbarHeight">
    <v-app-bar-nav-icon v-if="!icon && $route.path !== '/'"
      @click.stop="$root.$emit('toggle-drawer')"
    />
    <img
      src="/favicon.ico"
      @click="$router.push('/')"
      :class="['home-logo', page === 'realtime' ? 'd-none d-sm-block' : '']"
    />
    <v-toolbar-title v-if="$route.path === '/' || mitClass"
      :class="['headline', 'font-weight-regular', 'ml-2', page === 'realtime'? 'd-none d-md-block' : '']"
    >
      {{ $route.path === "/" ? "" : mitClass.name }}
    </v-toolbar-title>
    <v-progress-linear :active="loading" :indeterminate="loading" absolute bottom color="accent" />
    <v-spacer/>
      <BasePopupButton 
        actionName="Give feedback" 
        :inputFields="['summary']"
        @action-do="(bugReport) => submitBug(bugReport)"
      >
        <template v-slot:activator-button="{ on }">
          <ButtonNew :on="on" icon="mdi-bug">Give feedback</ButtonNew>
        </template>
        <template v-slot:message-to-user>
          Report a bug, suggest a feature, etc.
          We will be excited to read what you write and update you by email. 
        </template>
      </BasePopupButton>
      <slot>
        
      </slot>
  </v-app-bar>
</template>

<script>
import BasePopupButton from "@/components/BasePopupButton.vue";
import ButtonNew from "@/components/ButtonNew.vue";
import db from "@/database.js";
import { navbarHeight } from "@/CONSTANTS.js";
import firebase from "firebase/app";
import "firebase/functions";

export default {
  props: {
    loading: Boolean,
    icon: String,
    page: String
  },
  components: { 
    BasePopupButton,
    ButtonNew
  },
  data () {
    return {
      navbarHeight
    }
  },
  computed: {
    mitClass () { 
      return this.$store.state.mitClass; 
    },
    user () {
      return this.$store.state.user;
    }
  },
  methods: {
    submitBug ({ "summary": title }) {
      if (!title) {
        this.$root.$emit("show-snackbar", "Error: don't forget to write something")
        return;
      }
      const sendEmailToTeam = firebase.functions().httpsCallable("sendEmailToCoreTeam");
      sendEmailToTeam({ 
        userEmail: this.user ? this.user.email : "anonymous@mit.edu",
        userFeedback: title  
      });
      db.collection("bugs").add({ 
        title,
        email: this.user ? this.user.email : "anonymous@mit.edu"
      }); 
    }
  }
};
</script>

<style scoped>
.home-logo:hover {
  cursor: pointer;
}
.app-banner {
  border-bottom: 1px solid #eee !important;
}
</style>


