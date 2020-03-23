<template>
  <v-app>
    <!-- TODO: rename `subpage` -->
    <template v-if="subpage">
      <TheAppBar/>
      <TheSideDrawer v-model="drawer" :mitClass="mitClass"/>
      <v-content>
        <RouterView :key="$route.fullPath"/>
      </v-content>
    </template>
  </v-app>
</template>

<script>
import TheSideDrawer from "@/components/TheSideDrawer.vue";
import TheAppBar from "@/components/TheAppBar.vue";

export default {
  components: { 
    TheSideDrawer,
    TheAppBar
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


