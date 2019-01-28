<template>
  <v-dialog width="500" v-model="dialog">
    <v-btn slot="activator" class="pink darken-1">
      <span class="white--text">Save Video</span>
    </v-btn>
    <v-card>
    
      <v-card-text>
        <v-input>
          <input v-focus placeholder="e.g. Markov Bounds" :value="explanationTitle" @input="$emit('input', $event.target.value)">
        </v-input>
        To save as explanation, enter a title above
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <!-- CANCEL -->
        <v-btn color="green darken-1"
               flat="flat"
               @click="dialog = false">
          Cancel
        </v-btn>
        <!-- SAVE -->
        <v-btn color="green darken-1"
               flat="flat"
               @click="handleSave()">
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  props: ['explanationTitle'],
  methods: {
    handleSave() {
      this.dialog = false 
      this.$emit('pre-save-explanation')
    }
  },
  data() {
    return {
      dialog: false
    }
  }
}
</script>
