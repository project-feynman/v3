<template>
  <div class="text-center">
    <v-dialog :value="value" @input="(newVal) => $emit('input', newVal)" width="500">
      <!-- <template v-slot:activator="{ on, attrs }">
        <v-btn @click.stop.prevent="dialog = true" block color="grey darken-1" class="white--text" depressed small>
          <v-icon class="mr-2">mdi-hammer-wrench</v-icon>
          Troubleshoot guide
        </v-btn>
      </template> -->

      <v-card>
        <v-card-title class="headline">
          Unable to access your camera/mic
        </v-card-title>

        <v-card-text>
          <p style="font-size: 1.3rem;">How to fix</p>
          <ol style="font-size: 1rem;">
            <li><b>Turn off camera on Zoom</b></li>
            <li><b>Allow access to camera/mic</b>: look for an icon near the URL bar</li>
          </ol>

          <br>
          
          <p>If problem remains, try the general fixes:</p>
          <ol>
            <li>Reload the page</li> 
            <li>Close the page entirely, then open a new one</li> 
            <li>Ensure you use iPad Safari or desktop Chrome</li>
            <li>Clear cookies and cache</li>
            <li>Restart your computer</li>
            <li>Email eltonlin@mit.edu or Facetime +503 250 3868</li>
          </ol>
        </v-card-text>
        <v-card-actions>
          <v-spacer/>
          <v-btn text @click="$emit('input', false)">
            OK
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
/**
 * Helps the user fix the issue. 
 */


export default {
  props: {
    value: {
      type: Boolean,
      required: true
    }
  }
};
</script>