<template>
  <v-dialog width="700" persistent v-model="value">
    <v-card>
      <v-card-text>
        <template v-if="!shareableURL">
          <v-container align-center justify-center>
            <v-layout>
              <v-flex>
                <v-text-field
                  label="Title"
                  v-model="videoTitle"
                  autofocus
                  placeholder="e.g. Djikstra's Algorithm"
                />
                <!-- </v-text-field> -->
              </v-flex>
            </v-layout>
          </v-container>
        </template>
        
        <template v-else>
          <p>Shareable Video Link</p>
          <p id="link_url">{{ shareableURL }}</p>
        </template>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <template v-if="!shareableURL && !isSavingVideo">
          <v-btn @click="handleClose()" color="green darken-1" text>
            CANCEL
          </v-btn>
          <v-btn @click="handleSave()" color="green darken-1" text>
            SAVE
          </v-btn>
        </template>
        <p v-else-if="isSavingVideo" class="pink--text">Saving video...</p>
        <template v-else>
          <v-btn v-clipboard="returnLinkURL()">
            COPY TO CLIPBOARD
          </v-btn>
          <v-btn @click="handleClose()">
            OK
          </v-btn>
        </template>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  props: {
    value: Boolean
  },
  data () {
    return {
      isSavingVideo: false, 
      shareableURL:  '',
      videoTitle: ''
    }
  },
  created () {
    this.$root.$on('audio-uploaded', videoDocId => {
      this.shareableURL = `explain.mit.edu/${this.$route.params.class_id}/${videoDocId}`
      this.isSavingVideo = false 
    }) 
  },
  methods: {
    handleSave () {
      if (!this.videoTitle) {
        return 
      }
      this.isSavingVideo = true 
      this.$emit('pre-save-explanation', this.videoTitle)
    },
    handleClose () {
      this.shareableURL = ''
      this.isSavingVideo = false
      this.videoTitle = ''
      this.$emit('input', !this.value)
    },
    returnLinkURL () {
      return this.shareableURL
    }
  }
}
</script>
