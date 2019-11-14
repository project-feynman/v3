<template>
  <v-app-bar app clipped-left color="white" dense>
    <v-app-bar-nav-icon @click.stop="$root.$emit('toggle-drawer')"/>
    <v-toolbar-title class="mr-12 align-center">
      <span class="title">{{ $route.params.class_id }}</span>
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
      <!-- SLOT -->
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


