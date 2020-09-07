<template>
  <v-app-bar 
    app 
    color="white" 
    elevate-on-scroll 
    class="app-banner" 
    style="zIndex:8;" 
    :height="navbarHeight"
  >
    <v-app-bar-nav-icon v-if="!icon && $route.path !== '/'" data-qa="toggle-drawer"
      @click.stop="$emit('toggle-drawer')"
    >
      <!-- <v-icon>{{ drawer ? "mdi-arrow-expand-left" : "mdi-arrow-expand-right" }}</v-icon> -->
    </v-app-bar-nav-icon>
    <img src="/logo.png"
      height="50"
      @click="$router.push('/')"
      :class="['home-logo', page === 'realtime' ? 'd-none d-sm-block' : '']"
    />
    <v-toolbar-title v-if="mitClass && $route.path !== '/'" :class="['headline', 'font-weight-regular', 'ml-2', page === 'realtime'? 'd-none d-md-block' : '']">
      {{ mitClass.name }}
    </v-toolbar-title>
    <v-progress-linear :active="loading" :indeterminate="loading" absolute bottom color="accent"/>
    
    <v-spacer/>

    <!-- <BasePopupButton actionName="Help" 
      :inputFields="['Describe your problem']"
      @action-do="(bugReport) => submitBug(bugReport)"
    >
      <template v-slot:activator-button="{ on }">
        <BaseButton :on="on" icon="mdi-help" color="secondary">
          Help
        </BaseButton>
      </template>
      <template v-slot:message-to-user>
        If you need quick help with any problems, write here or email <u>eltonlin@mit.edu</u>
        I'll reply ASAP (with exception to 1 pm - 8:30 pm). 
        <br>
        <br>
        If you are a fellow hacker and know how to fix the issue,
        the project is <a href="https://github.com/feynman-project/explain-mit" target="_blank">open source</a> 
        and I'd love for more help.
      </template>
    </BasePopupButton>   -->
    <slot>
      
    </slot>
  </v-app-bar>
</template>

<script>
import BasePopupButton from "@/components/BasePopupButton.vue";
import BaseButton from "@/components/BaseButton.vue";
import db from "@/database.js";
import { navbarHeight } from "@/CONSTANTS.js";
import firebase from "firebase/app";
import "firebase/functions";
import { mapState } from "vuex"; 

export default {
  props: {
    loading: Boolean,
    icon: String,
    page: String,
    drawer: Boolean
  },
  components: { 
    BasePopupButton,
    BaseButton
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


