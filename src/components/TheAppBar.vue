<template>
  <v-app-bar app clipped-left color="white" dense elevate-on-scroll class="app-banner" style="zIndex:9;">
    <v-app-bar-nav-icon
      v-if="!icon && $route.path !== '/'"
      @click.stop="$root.$emit('toggle-drawer')"
    />
    <img
      :class="['home-logo',page === 'realtime'?'d-none d-sm-block':'']"
      src="/favicon.ico"
      @click="$router.push('/')"
    />
    <v-toolbar-title
      v-if="$route.path === '/' || mitClass"
      :class="['home-logo', 'headline', 'font-weight-regular', 'ml-2', page === 'realtime'? 'd-none d-md-block' : '']"
      @click="$router.push('/')"
    >
      {{ $route.path === "/" ? "ExplainMIT" : `ExplainMIT/${mitClass.name}` }}
    </v-toolbar-title>
    <v-progress-linear :active="loading" :indeterminate="loading" absolute bottom color="accent" />
    <v-spacer />
      <BasePopupButton actionName="Report bug" 
        :inputFields="['bug summary', 'bug description']"
        @action-do="bugReport => submitBug(bugReport)"
      >
        We know it's takes effort to report bugs, so we very much 
        appreciate it and will act on these reports as fast as we can.
      </BasePopupButton>
    <slot>
      
    </slot>
    
  </v-app-bar>
</template>

<script>
import BasePopupButton from "@/components/BasePopupButton.vue";
import db from "@/database.js";

export default {
  props: {
    loading: Boolean,
    icon: String,
    page: String,
  },
  components: { BasePopupButton },
  computed: {
    mitClass () { return this.$store.state.mitClass; }
  },
  methods: {
    submitBug ({ "bug summary": title, "bug description": description}) {
      if (!title || !description) {
        this.$root.$emit("show-snackbar", "Error: don't forget to include both the a summary and a description!")
        return 
      }
      const ref = db.collection("bugs");
      ref.add({ title, description}); 
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


