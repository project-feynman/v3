<template>
  <v-app>
    <nav-components/>
    <v-content >
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
