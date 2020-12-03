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
          Error connecting audio...
        </v-card-title>

        <v-card-text>
          <p>How to fix</p>
          <ol>
            <li>Ensure you gave permission to mic: look for an icon somewhere around the URL bar</li>
            <li>Open a fresh page for Explain</li>
            <li>If problems persist, you can email me eltonlin@mit.edu or Facetime me at +503 250 3868 and we can solve it together.</li>
          </ol>
        </v-card-text>
        <v-card-actions>
          <v-spacer/>
          <v-btn text @click="$emit('input', false)">
            Got it.
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
export default {
  props: {
    value: {
      type: Boolean,
      required: true
    }
  }
};
</script>