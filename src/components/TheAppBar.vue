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
        :inputFields="['summary', 'description']"
        @action-do="(bugReport) => submitBug(bugReport)"
      >
        <template v-slot:activator-button="{ on }">
          <ButtonNew v-on="on" icon="mdi-bug">Give feedback</ButtonNew>
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
import { navbarHeight } from "@/CONSTANTS.js"

export default {
  props: {
    loading: Boolean,
    icon: String,
    page: String
  },
  data () {
    return {
      navbarHeight
    }
  },
  components: { 
    BasePopupButton,
    ButtonNew
  },
  computed: {
    mitClass () { 
      return this.$store.state.mitClass; 
    }
  },
  methods: {
    submitBug ({ "summary": title, description }) {
      if (!title) {
        this.$root.$emit("show-snackbar", "Error: don't forget to write the summary!")
        return;
      }
      db.collection("bugs").add({ 
        title, 
        description
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


