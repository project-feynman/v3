<template>
  <v-dialog width="700" persistent v-model="value">
    <!-- <v-btn slot="activator" class="pink darken-1">
      <span class="white--text">Save Video</span>
    </v-btn> -->
    <v-card>
      <v-card-text>
        <template v-if="!shareableURL">
          <v-input>
            <input v-focus placeholder="e.g. Djikstra" v-model="videoTitle">
          </v-input>
          <p>To save as explanation, enter a title above</p>
        </template>
        <template v-else>
          <p>Shareable Video Link</p>
          <p id="link_url">{{ shareableURL }}</p>
        </template>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <template v-if="!shareableURL && !isSavingVideo">
          <v-btn color="green darken-1"
                 flat="flat"
                 @click="handleClose()">
            Close
          </v-btn>

          <v-btn
                 color="green darken-1"
                 flat="flat"
                 @click="handleSave()">
            SAVE
          </v-btn>
        </template>
        <p v-else-if="isSavingVideo" class="pink--text">Saving video (this could take a while...)</p>
        <template v-else>
          <v-btn v-clipboard="returnLinkURL()">
            Copy to clipboard
          </v-btn>
          <v-btn @click="$emit('input', !value)">
            OK
          </v-btn>
        </template>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  props: ['value'],
  data() {
    return {
      isSavingVideo: false, 
      shareableURL:  null,
      videoTitle: ''
    }
  },
  created() {
    this.$root.$on('audio-uploaded', videoDocId => {
      this.shareableURL = `feynman.online/${this.$route.params.teacher_id}/answer/${videoDocId}`
      this.isSavingVideo = false 
    }) 
  },
  methods: {
    handleSave() {
      this.isSavingVideo = true 
      this.$emit('pre-save-explanation', this.videoTitle)
    },
    handleClose() {
      this.shareableURL = null 
      this.$emit('input', !this.value)
    },
    returnLinkURL() {
      return this.shareableURL
    }
  },
}
</script>
