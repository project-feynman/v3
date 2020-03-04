<template>
  <div>
    <vue-plyr v-if="audio" ref="plyr">
      <audio :id="`audio-element--${audioUrl}`" :src="audio.blobURL" controls="true"/>
    </vue-plyr>
  </div>
</template>

<script>
import RecorderService from '@/services/RecorderService.js';
import utils from '@/services/Utils';
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";

export default {
  props: { audioUrl: String, injectedAudio: Object },
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
      this.initEventEmitters();
      this.$emit("loaded");
    } 
    this.recorderSrvc = new RecorderService()
    // event triggers when the user finishes an audio recording
    this.recorderSrvc.em.addEventListener("recording", evt => this.onNewRecording(evt))
  },
  computed: {
    // TODO: investigate bug
    player () { return this.$refs.plyr.player }
  },
  watch: {
    cleanupWhenFinished (val) {
      this.recorderSrvc.config.stopTracksAndCloseCtxWhenFinished = this.cleanupWhenFinished;
    }
  },
  methods: {
    playAudio () { this.player.play(); },
    getAudioTime () {
      const audioElement = document.getElementById(`audio-element--${this.audioUrl}`);
      if (!audioElement) { return 0; } // should throw an error
      return audioElement.currentTime;
    },
    initEventEmitters () {
      this.$nextTick(() => {
        this.player.on('play', () => this.$emit('play'));
        this.player.on('pause', () => this.$emit('pause'));
        this.player.on('seeking', () => this.$emit('seeking'));
        this.player.on("ended", () => this.$emit("ended"));
      });
    },
    downloadAudioFile () {
      this.$emit("loading"); 
      // TODO: refactor this in databaseHelpersMixin.js
      if (this.audioUrl) {
        let xhr = new XMLHttpRequest()
        xhr.responseType = 'blob'
        xhr.onload = event => {
          const blob = xhr.response;
          const blobURL = URL.createObjectURL(blob)
          const newRecording = {
            blob,
            ts: new Date().getTime(),
            blobURL,
            mimeType: blob.type,
            size: blob.size,
          }
          if (!this.audio) { this.audio = newRecording; } // initial load or just empty local data
          this.initEventEmitters();
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
        if (!this.audio) { reject() }
        const downloadUrl = await this.$_saveToStorage(this.getRandomUID(), this.audio.blob);
        this.$emit("file-uploaded", { url: downloadUrl });
        resolve();
      })
    },
    getRandomUID () {
      function s4 () {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1)
      }
      return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4()
    }
  }
}
</script>
