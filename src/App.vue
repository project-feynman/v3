<template>
  <v-app>
    <TheSideDrawer v-if="$route.path !== '/'" v-model="drawer"/>
    <!-- RouterView "becomes" different components depending on the URL, and is specified in main.js -->
    <RouterView/>
    <v-snackbar v-model="snackbar">
      {{ snackbarMessage }}
      <v-btn @click="snackbar = false" color="pink" text>CLOSE</v-btn>
    </v-snackbar>
  </v-app>
</template>

<script>
import TheSideDrawer from "@/components/TheSideDrawer.vue";

export default {
  components: {
    TheSideDrawer,
  },
  data: () => ({
    drawer: true,
    snackbar: false,
    snackbarMessage: ""
  }),
  computed: {
    classId () { return this.$route.params.class_id; }
  },
  watch: {
    classId: {
      handler: "fetchMitClass",
      immediate: true
    }
  },
  created () {
    this.$root.$on("toggle-drawer", () => this.drawer = !this.drawer);
    this.$root.$on("open-drawer", () => this.drawer = true);
    this.$root.$on("show-snackbar", message => {
      this.snackbar = true;
      this.snackbarMessage = message;
    })
  },
  methods: {
    fetchMitClass () {
      if (!this.classId) { return; }
      this.$store.dispatch("fetchClass", this.classId);
    }
  }
}
</script>

<style>
/* Make the side-drawer vertically scrollable  */
html {
  overflow-y: auto; 
}
</style>