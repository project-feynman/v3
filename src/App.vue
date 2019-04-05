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
  background-color: rgb(239, 237, 237)
}
</style>