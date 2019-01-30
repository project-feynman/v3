<template>
  <v-layout row justify-center>
    <v-dialog v-model="dialog" max-width="290">
      <v-btn slot="activator" color="primary" dark>Open Dialog</v-btn>
      <v-card>
        <v-card-title class="headline">
          <slot name="title">
            Use Google's location service?
          </slot>
        </v-card-title>

        <v-card-text>
          <slot name="text">
            Let Google help apps determine location. This means sending anonymous location data to Google, even when no apps are running.
          </slot>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <slot name="button">

          </slot>
          <v-btn color="green darken-1" flat @click="dialog = false">Agree</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-layout>
</template>

<script>
  export default {
    data () {
      return {
        dialog: false
      }
    }
  }
</script>