<template>
  <v-app>
    <nav-components/>
    <v-content id="background">
      <router-view/>
    </v-content>
  </v-app>
</template>

<script>
import NavComponents from './components/NavComponents.vue'

export default {
  name: 'App',
  components: {
    NavComponents
  }
}
</script>

<style>
#background {
  background-color: #C0C0C0;
}
</style>