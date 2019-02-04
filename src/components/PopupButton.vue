<template>
  <v-dialog width="700" persistent v-model="savePopup">
    <v-btn slot="activator" class="pink darken-1">
      <span class="white--text">Save Video</span>
    </v-btn>
    <v-card>
      <v-card-text>
        <template v-if="!shareableURL">
          <v-input>
            <input v-focus placeholder="e.g. Markov Bounds" :value="explanationTitle" @input="$emit('input', $event.target.value)">
          </v-input>
          <p>To save as explanation, enter a title above</p>
        </template>
        <template v-else>
          <p>Shareable Video Link</p>
          <p>{{ shareableURL }}</p>
        </template>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <!-- CANCEL -->
        <template v-if="!shareableURL && !isSavingVideo">
          <v-btn color="green darken-1"
                 flat="flat"
                 @click="handleClose()">
            Cancel
          </v-btn>
          <!-- SAVE -->
          <v-btn
                 color="green darken-1"
                 flat="flat"
                 @click="handleSave()">
            Save
          </v-btn>
        </template>
        <p v-else-if="isSavingVideo" class="pink--text">Saving video (this could take a while...)</p>
        <v-btn v-else @click="savePopup = false">
          OK
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  props: ['explanationTitle'],
  data() {
    return {
      isSavingVideo: false, 
      savePopup: false,
      shareableURL:  null 
    }
  },
  created() {
    this.$root.$on('audio-uploaded', videoDocId => {
      this.shareableURL = `feynman.online/${this.$route.params.teacher_id}/answer/${videoDocId}`
      // console.log('videoDocId =', videoDocId)
      // this.savePopup = false
      this.isSavingVideo = false 
    }) 
  },
  methods: {
    handleSave() {
      // emit it to workspace
      this.isSavingVideo = true 
      this.$emit('pre-save-explanation')
    },
    handleClose() {
      this.shareableURL = null 
      this.savePopup = false
    }
  },
}
</script>
