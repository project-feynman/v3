<template>
  <v-app>
    <RouterView/>
    <v-snackbar v-model="snackbar">
      {{ snackbarMessage }}
      <v-btn @click="snackbar = false" color="pink" text>CLOSE</v-btn>
    </v-snackbar>
  </v-app>
</template>

<script>
export default {
  data: () => ({
    snackbar: false,
    snackbarMessage: ""
  }),
  created () {
    this.$root.$on("show-snackbar", message => {
      this.snackbar = true;
      this.snackbarMessage = message;
    })
  }
}
</script>
<style>
/* Global styles */
a {
  text-decoration: none;
}
</style>