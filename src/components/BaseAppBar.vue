<template>
  <v-app-bar app clipped-left color="white" dense elevate-on-scroll class="app-banner">
    <v-app-bar-nav-icon
      v-if="!icon && $route.path !== '/'"
      @click.stop="$root.$emit('toggle-drawer')"
    />
    <v-icon v-else-if="this.icon==='back'" @click="$emit('icon-click')" x-large>mdi-chevron-left</v-icon>
    <img class="home-logo" src="/favicon.ico" @click="$router.push('/')" />
    <v-toolbar-title
      class="home-logo headline font-weight-regular ml-2"
      @click="$router.push('/')"
    >{{ $route.path === "/" ? "ExplainMIT" : `ExplainMIT/${$route.params.class_id}` }}</v-toolbar-title>
    <v-progress-linear :active="loading" :indeterminate="loading" absolute bottom color="accent" />
    <v-spacer />
    <slot></slot>
  </v-app-bar>
</template>

<script>
export default {
  props: {
    loading: Boolean,
    icon: String,
    default() {
      return false;
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


