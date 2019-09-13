<template>
  <v-app :dark="useDarkMode">
    <!-- <nav-components/> -->
    <the-nav-bar/>
    <the-side-nav/>
    <v-content id="background">
      <router-view/>
    </v-content>
  </v-app>
</template>

<script>
import NavComponents from './components/NavComponents.vue'
import TheNavBar from "./components/TheNavBar.vue"
import TheSideNav from "./components/TheSideNav.vue"

export default {
  name: 'App',
  components: {
    TheNavBar,
    NavComponents,
    TheSideNav
  },
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
  }
}
</script>

<style>
#background {
  background-color: rgb(225, 233, 247)
}
</style>