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
          
          <p class="mb-0">If problem remains, first try quick-fixes:</p>
          <ol>
            <li>Reload the page</li> 
            <li>Close the page entirely, then open a new one</li> 
            <li>Use your other device (e.g. iPhone) to connect to video chat</li>
          </ol>

          <br>

          <p class="mb-0">Then try the general fixes:</p>
          <ol>
            <li>For iPads,
              <a href="https://osxdaily.com/2017/09/28/how-force-quit-apps-ipad-ios-11/" target="_blank">
                force quit Safari
              </a>
            </li>
            <li>
              For computers,
              <a href="https://support.google.com/accounts/answer/32050?co=GENIE.Platform%3DDesktop&hl=en" target="_blank">
                clear cookies and cache on Chrome
              </a>
              and read 
              <a href="https://help.daily.co/en/articles/2303117-top-troubleshooting-tips" target="_blank">
                5 tips that solve 99% of issues
              </a>
            </li>
            <li>Restart your computer / iPad</li>
            <li>Email <a href="mailto: eltonlin@mit.edu">eltonlin@mit.edu</a></li>
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