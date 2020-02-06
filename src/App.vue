<template>
  <v-app>
    <TheSideDrawer v-if="$route.path !== '/'" v-model="drawer"/>
    <!-- RouterView "becomes" different components depending on the URL, and is specified in main.js -->
    <RouterView/>
  </v-app>
</template>

<script>
import TheSideDrawer from "@/components/TheSideDrawer.vue"

export default {
  components: {
    TheSideDrawer
  },
  data: () => ({
    drawer: true
  }),
  created () {
    this.$root.$on("toggle-drawer", () => {
      this.drawer = !this.drawer
    })
  }
}
</script>

<style>
html {
  overflow-y: auto;
}
</style>