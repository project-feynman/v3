<template>
  <v-dialog width="500" persistent v-model="dialog">
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
        <template v-if="!isSavingVideo">
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
        </template>
        <p v-else class="pink--text">Saving video (this could take a while...)</p>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  props: ['explanationTitle'],
  created() {
    this.$root.$on('audio-uploaded', () => {
      this.dialog = false
      this.isSavingVideo = false 
    }) 
  },
  methods: {
    handleSave() {
      // this.dialog = false 
      // emit it to workspace
      this.isSavingVideo = true 
      this.$emit('pre-save-explanation')
    }
  },
  data() {
    return {
      isSavingVideo: false, 
      dialog: false
    }
  }
}
</script>
