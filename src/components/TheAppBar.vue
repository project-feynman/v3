<template>
  <v-app-bar 
    app 
    clipped-left 
    color="white" 
    elevate-on-scroll 
    class="app-banner" 
    style="zIndex:9;" 
    :height="navbarHeight"
  >
    <v-app-bar-nav-icon v-if="!icon && $route.path !== '/'" data-qa="toggle-drawer"
      @click.stop="$emit('toggle-drawer')"
    />
    <img src="/favicon.ico"
      @click="$router.push('/')"
      :class="['home-logo', page === 'realtime' ? 'd-none d-sm-block' : '']"
    />
    <v-toolbar-title v-if="mitClass && $route.path !== '/'" 
      :class="['headline', 'font-weight-regular', 'ml-2', page === 'realtime'? 'd-none d-md-block' : '']"
    >
      {{ mitClass.name }}
    </v-toolbar-title>
    <v-progress-linear :active="loading" :indeterminate="loading" absolute bottom color="accent" />
    <v-spacer/>

    <v-menu v-model="menu" 
      :close-on-content-click="false" 
      :nudge-width="200" 
      offset-x
    >
      <template v-slot:activator="{ on }">
        <ButtonNew :on="on" icon="mdi-lightbulb-on">About Us</ButtonNew> 
      </template>
      <v-card>
        <v-divider></v-divider>
        <v-card-actions>
          <router-link to="/class/mDbUrvjy4pe8Q5s5wyoD/posts/y16PFhzal9SNKcT48voj">
            <ButtonNew icon="mdi-lightbulb-on">Our Goal</ButtonNew>
          </router-link>
          <router-link to="/class/mDbUrvjy4pe8Q5s5wyoD/posts/VUPlJW7t1N3mJiWEFY8z">
            <ButtonNew icon="mdi-git">Source Code</ButtonNew>
          </router-link>
          <BasePopupButton actionName="Give Feedback" 
            :inputFields="['Feedback']"
            @action-do="(bugReport) => submitBug(bugReport)"
          >
            <template v-slot:activator-button="{ on }">
              <ButtonNew :on="on" icon="mdi-message">Give Feedback</ButtonNew>
            </template>
            <template v-slot:message-to-user>
              Report a bug, suggest a feature, etc.
              We will be excited to read what you write and update you by email. 
            </template>
          </BasePopupButton>
        </v-card-actions>
      </v-card>
    </v-menu>
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
import { mapState } from "vuex"; 

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
      navbarHeight,
      menu: false
    }
  },
  computed: {
    ...mapState([
      "mitClass",
      "user"
    ])
  },
  created () {
    const { class_id } = this.$route.params; 
    if (class_id) {
      this.$store.commit("SET_CLASS", null);
      this.$store.dispatch("fetchClass", class_id);  
    }
  },
  methods: {
    async submitBug ({ "Feedback": title }) {
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


