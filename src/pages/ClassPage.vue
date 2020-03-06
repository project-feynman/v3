<template>
  <v-app>
    <TheSideDrawer v-model="drawer"/>
    <RouterView :key="$route.fullPath"/>
  </v-app>
</template>

<script>
import TheSideDrawer from "@/components/TheSideDrawer.vue";

export default {
  components: { TheSideDrawer },
  data: () => ({
    drawer: true
  }),
  created () {
    this.$root.$on("toggle-drawer", () => this.drawer = !this.drawer);
    this.$root.$on("open-drawer", () => this.drawer = true);
    this.$store.dispatch("fetchClass", this.$route.params.class_id);
  }
}
</script>

<style>
/* Make the side-drawer vertically scrollable  */
html {
  overflow-y: auto; 
}
</style>


