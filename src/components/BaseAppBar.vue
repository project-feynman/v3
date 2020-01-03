<template>
  <v-app-bar app clipped-left color="white" dense>
    <v-app-bar-nav-icon 
      @click.stop="$root.$emit('toggle-drawer')"
    />

    <img class="home-logo" src="favicon.ico" @click="$router.push('/')">

    <v-toolbar-title class="home-logo headline font-weight-regular ml-2" @click="$router.push('/')">
      ExplainMIT/{{ $route.params.class_id }}
    </v-toolbar-title>

    <v-progress-linear
      :active="loading"
      :indeterminate="loading"
      absolute
      bottom
      color="deep-purple accent-4"
    />

    <v-spacer/>
    
    <slot>

    </slot>
  </v-app-bar>
</template>

<script>
export default {
  props: {
    loading: Boolean,
    default () {
      return false 
    }
  }
}
</script>

<style scoped>
.home-logo:hover {
  cursor: pointer;
}
</style>


