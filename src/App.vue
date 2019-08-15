<template>
  <v-app :dark="useDarkMode">
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
  computed: {
    user () {
      return this.$store.state.user
    },
    useDarkMode () {
      if (!this.user) {
        return false
      } else {
        return this.user.useDarkMode
      }
    }
  },
  components: {
    NavComponents
  }
}
</script>

<style>
#background {
  background-color: rgb(225, 233, 247)
}
</style>