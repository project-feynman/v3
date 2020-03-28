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
    });
  }
}
</script>
<style>
/* Global styles */
a {
  text-decoration: none;
}
/*
::-webkit-scrollbar {
    width: 12px;
}
::-webkit-scrollbar-track {
    -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.3); 
    border-radius: 10px;
    background-color: rgba(0,0,0,0.15);
}
 
::-webkit-scrollbar-thumb {
    border-radius: 10px;
    -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.5); 
    background-color: orange;
}*/
</style>