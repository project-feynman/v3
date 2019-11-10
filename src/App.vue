<template>
  <v-app>
    <template v-if="$route.path != '/'">
      <TheSideDrawer v-model="drawer"/>
    </template>
    <!-- RouterView "becomes" different components depending on the URL, and is specified in main.js -->
    <RouterView/>
  </v-app>
</template>

<script>
import TheSideDrawer from "@/components/TheSideDrawer.vue"

export default {
  props: {
    source: String,
  },
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
#background {
  background-color: rgb(225, 233, 247)
}
</style>