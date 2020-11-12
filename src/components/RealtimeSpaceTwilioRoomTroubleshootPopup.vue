<template>
  <div class="text-center">
    <v-dialog v-model="dialog" width="500">
      <template v-slot:activator="{ on, attrs }">
        <v-btn @click.stop.prevent="dialog = true" fab color="grey" class="white--text" depressed>
          <!-- mdi-hammer-wrench -->
          <v-icon large>mdi-help</v-icon>
        </v-btn>
      </template>

      <v-card>
        <v-card-title class="headline">
          Help guide
        </v-card-title>

        <v-card-text>
          <p>If there is no sound, try the following:</p>
          <ol>
            <li>Check microphone settings in browser (usually an icon near "https://expl...")</li>
            <li>Soft reset: Reload the page</li>
            <li>Hard reset: Force quit Safari (iPad) or clear browser cache (laptop), then reload the website.</li>
          </ol>

          <p class="mt-5">Other tips</p>
          <ul>
            <li>For beyond 10+ participants, use Zoom for AV and Explain for blackboard.</li>
            <li>If there are echoes, make sure you have only <u>one unmuted device</u> at any given time.</li>
            <li>If you have low bandwidth, turn off video and hang up whenever you're not using it.</li>
            <li>We can fix it together if you email me at eltonlin@mit.edu or Facetime me at +503 250 3868</li>
          </ul>
        </v-card-text>
        <v-card-actions>
          <v-spacer/>
          <v-btn text @click="dialog = false">
            Got it.
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
export default {
  data () {
    return {
      dialog: false
    };
  }
}
</script>