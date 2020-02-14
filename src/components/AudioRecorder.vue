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
import firebase from 'firebase/app';
import 'firebase/storage';

export default {
  props: {
    audioUrl: String, // needed when using the AudioRecorder as an AudioPlayer
  },
  data () {
    return {
      recordingInProgress: false,
      supportedMimeTypes: [],
      audio: null,
      micGain: 1.0,
      cleanupWhenFinished: true,
      addDynamicsCompressor: false
    }
  },
  created () {
    this.recorderSrvc = new RecorderService()
    // this is the key thing - this will trigger onNewRecording - always remember this line!
    this.recorderSrvc.em.addEventListener("recording", evt => this.onNewRecording(evt))
  },
  computed: {
    player () {
      return this.$refs.plyr.player
    }
  },
  watch: {
    audioUrl: {
      handler: 'downloadAudioFile',
      immediate: true
    },
    audio () {
      if (this.audio) {
        this.$nextTick(() => {
          this.player.on('play', () => this.$emit('play'));
          this.player.on('pause', () => this.$emit('pause'));
          this.player.on('seeking', () => this.$emit('seeking'));
        });
      }
    },
    cleanupWhenFinished (val) {
      this.recorderSrvc.config.stopTracksAndCloseCtxWhenFinished = this.cleanupWhenFinished
    }
  },
  methods: {
    playAudio () {
      this.player.play()
    },
    getAudioTime () {
      const audioElement = document.getElementById(`audio-element--${this.audioUrl}`);
      if (!audioElement) { return 0; } // should throw an error
      return audioElement.currentTime;
    },
    downloadAudioFile () {
      this.$emit('loading')
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
          if (!this.audio) this.audio = newRecording; // initial load or just empty local data
          this.$emit("loaded");
        }
        xhr.open('GET', this.audioUrl);
        xhr.send();
      }
    },
    getRandomUID () {
      function s4 () {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1)
      }
      return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4()
    },
    // Functions for recording and saving voice 
    startRecording () {
      this.$emit('start-recording')
      this.recorderSrvc.config.stopTracksAndCloseCtxWhenFinished = this.cleanupWhenFinished
      this.recorderSrvc.config.createDynamicsCompressorNode = this.addDynamicsCompressor
      this.recorderSrvc.startRecording()
        .then(() => this.recordingInProgress = true)
        .catch(error => alert('Recording error: ' + error.message))
    },
    stopRecording () {
      this.recorderSrvc.stopRecording()
      this.recordingInProgress = false
    },
    // New recordings are auto-uploaded to Firebase storage
    async onNewRecording (evt) {
      this.audio = evt.detail.recording
      const storageRef = firebase.storage().ref()
      const recordingRef = storageRef.child(`recordings/${this.getRandomUID()}`)
      
      // Upload blob 
      const uploadTask = recordingRef.put(this.audio.blob)
      uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, 
        snapshot => {}, 
        error => console.log('error =', error), 
        async () => {
          const downloadURL = await uploadTask.snapshot.ref.getDownloadURL()
          this.$emit('file-uploaded', { url: downloadURL })
        }
      )
    }
  }
}
</script>
