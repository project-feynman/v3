<template>
  <v-app>
    <TheSideDrawer v-model="drawer"/>
    <RouterView v-if="subpage" :key="$route.fullPath"/>
  </v-app>
</template>

<script>
import TheSideDrawer from "@/components/TheSideDrawer.vue";

export default {
  components: { 
    TheSideDrawer 
  },
  data: () => ({
    drawer: true,
    subpage: false
  }),
  computed: {
    mitClass () {
      return this.$store.state.mitClass;
    }
  },
  async created () {
    this.$root.$on("toggle-drawer", () => this.drawer = !this.drawer);
    await this.$store.dispatch("fetchClass", this.$route.params.class_id);
    this.subpage = true;
  }
}
</script>

<style>
/* Make the side-drawer vertically scrollable  */
html {
  overflow-y: auto; 
}
</style>


