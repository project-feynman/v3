<template>
  <!-- <v-layout row justify-center lazy> -->
    <v-dialog v-model="dialog" fullscreen hide-overlay>
      <v-btn slot="activator" color="primary" dark>Use Whiteboard</v-btn>
      <v-card>
        <v-toolbar id="whiteboard-toolbar" dark color="primary">
          <v-toolbar-title>Settings</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-toolbar-items>
            <v-btn dark flat @click="dialog = false">Save</v-btn>
          </v-toolbar-items>
        </v-toolbar>
        <slot>
        
        </slot>
      </v-card>
    </v-dialog>
  <!-- </v-layout> -->
</template>

<script>
  export default {
    data () {
      return {
        dialog: false,
        notifications: false,
        sound: true,
        widgets: false
      }
    }
  }
</script>