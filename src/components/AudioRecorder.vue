<template>
  <div>
    <audio v-if="audio" ref="AudioPlayer" 
      :src="audio.blobURL" 
      controls="true"
      @play="$emit('play')"
      @pause="$emit('pause')"
      @seeking="$emit('seeking')"
      @ended="$emit('ended')"
      style="width: 100%;"
    />
  </div>
</template>

<script>
import RecorderService from '@/services/RecorderService.js';
import utils from '@/services/Utils';
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import { getRandomId } from "@/helpers.js";

export default {
  props: { 
    audioUrl: String, 
    injectedAudio: Object 
  },
  mixins: [DatabaseHelpersMixin],
  data () {
    return {
      audio: null,
      recordingInProgress: false,
      supportedMimeTypes: [],
      micGain: 1.0,
      cleanupWhenFinished: true,
      addDynamicsCompressor: false
    }
  },
  created () {
    if (this.injectedAudio) { 
      this.$emit("loading");
      this.audio = this.injectedAudio; 
      this.$emit("loaded");
    } 
    this.recorderSrvc = new RecorderService()
    // event triggers when the user finishes an audio recording
    this.recorderSrvc.em.addEventListener("recording", evt => this.onNewRecording(evt))
  },
  watch: {
    cleanupWhenFinished (val) {
      this.recorderSrvc.config.stopTracksAndCloseCtxWhenFinished = this.cleanupWhenFinished;
    }
  },
  methods: {
    playAudio () { 
      this.$refs.AudioPlayer.play();
    },
    getAudioTime () {
      return this.$refs.AudioPlayer.currentTime;
    },
    downloadAudioFile () {
      this.$emit("loading"); 
      // TODO: refactor this in databaseHelpersMixin.js
      if (this.audioUrl) {
        const xhr = new XMLHttpRequest()
        xhr.responseType = 'blob'
        xhr.onload = (event) => {
          const blob = xhr.response;
          const blobURL = URL.createObjectURL(blob)
          const newRecording = {
            blob,
            ts: new Date().getTime(),
            blobURL,
            mimeType: blob.type,
            size: blob.size,
          }
          if (!this.audio) {
            this.audio = newRecording; // initial load or just empty local data
          } 
          this.$emit("loaded");
        }
        xhr.open('GET', this.audioUrl);
        xhr.send();
      }
    },
    startRecording () {
      this.recorderSrvc.config.stopTracksAndCloseCtxWhenFinished = this.cleanupWhenFinished
      this.recorderSrvc.config.createDynamicsCompressorNode = this.addDynamicsCompressor
      this.recorderSrvc.startRecording()
        .then(() => { 
          this.recordingInProgress = true;
          this.$emit("start-recording");
        })
        .catch(error => alert('Recording error: ' + error.message))
    },
    stopRecording () {
      this.recorderSrvc.stopRecording();
      this.recordingInProgress = false;
    },
    onNewRecording (evt) {
      this.audio = evt.detail.recording;
      this.$emit("audio-saved");
    },
    uploadRecording () {
      return new Promise(async (resolve, reject) => {
        if (!this.audio) reject();
        const downloadUrl = await this.$_saveToStorage(getRandomId(), this.audio.blob);
        this.$emit("file-uploaded", { url: downloadUrl });
        resolve();
      })
    }
  }
}
</script>
