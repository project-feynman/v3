<template>
  <v-app-bar app clipped-left color="white" dense>
    <v-app-bar-nav-icon 
      v-if="!this.icon" @click.stop="$root.$emit('toggle-drawer')" 
    />
    <v-icon 
      v-else-if="this.icon==='back'" 
      @click="$emit('icon-click')" 
      x-large>mdi-chevron-left
    </v-icon>
    <img 
      class="home-logo" 
      src="/favicon.ico" 
      @click="$router.push('/')"
    >
    <v-toolbar-title class="home-logo headline font-weight-regular ml-2" @click="$router.push('/')">
      ExplainMIT/{{ this.classData.name }}
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
    icon: String,
    classData : Object,
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


