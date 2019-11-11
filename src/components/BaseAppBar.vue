<template>
  <v-app-bar app clipped-left color="white" dense>
    <v-app-bar-nav-icon @click.stop="$root.$emit('toggle-drawer')"/>
    <v-toolbar-title class="mr-12 align-center">
      <span class="title">{{ $route.params.class_id }}</span>
    </v-toolbar-title>
  </v-app-bar>
</template>
