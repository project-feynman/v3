<template>
  <div></div>
</template>

<script>
import RecorderService from '@/services/RecorderService.js';
import utils from '@/services/Utils';

export default {
  data () {
    return {
      audio: {},
      recordingInProgress: false,
      supportedMimeTypes: [],
      micGain: 1.0,
      cleanupWhenFinished: true,
      addDynamicsCompressor: false
    }
  },
  created () {
    this.recorderSrvc = new RecorderService()
    // the below callback is triggered when the audio finishes recording (hence `onNewRecording`)
    this.recorderSrvc.em.addEventListener("recording", (evt) => this.onNewRecording(evt))
  },
  watch: {
    cleanupWhenFinished (val) {
      this.recorderSrvc.config.stopTracksAndCloseCtxWhenFinished = this.cleanupWhenFinished;
    }
  },
  methods: {
    startRecording () {
      return new Promise((resolve, reject) => {
        this.recorderSrvc.config.stopTracksAndCloseCtxWhenFinished = this.cleanupWhenFinished
        this.recorderSrvc.config.createDynamicsCompressorNode = this.addDynamicsCompressor
        this.recorderSrvc.startRecording()
          .then(() => { 
            this.recordingInProgress = true;
            this.$emit("start-recording");
            resolve();
          })
          .catch((error) => alert('Recording error: ' + error.message))
      });
    },
    stopRecording () {
      this.recorderSrvc.stopRecording();
      this.recordingInProgress = false;
    },
    onNewRecording (evt) {
      this.audio = evt.detail.recording; // returns an object = { blob, ts, blobURL, mimeType, size }}
      this.$emit("audio-recorded", this.audio);
    }
  }
}
</script>
