<template>
  <v-app-bar app clipped-left color="white" dense elevate-on-scroll class="app-banner">
    <v-app-bar-nav-icon
      v-if="!icon && $route.path !== '/'"
      @click.stop="$root.$emit('toggle-drawer')"
    />
    <!-- <v-icon v-if="this.icon==='back'" @click="$emit('icon-click')" x-large>
      mdi-chevron-left
    </v-icon> -->
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
    <slot>
      
    </slot>
  </v-app-bar>
</template>

<script>
import db from "@/database.js";

export default {
  props: {
    loading: Boolean,
    icon: String,
    page: String,
  },
  computed: {
    mitClass () { return this.$store.state.mitClass; }
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


