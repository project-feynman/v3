<template>
  <v-container mb-5>
    <v-layout row wrap>
      <div class="test1">
        <div>
          <v-btn @click="startRecording" :disabled="recordingInProgress">Start Recording
          </v-btn>
          <v-btn @click="stopRecording" :disabled="!recordingInProgress">Stop Recording</v-btn>
          <v-icon :class="recordingInProgress ? 'live' : ''">mic</v-icon>
        </div>
      </div>
    </v-layout>
    <v-layout row wrap class="ml-1 mt-1">
      <v-flex xs10 md6>
        <v-slider label="Mic Gain" :max="500" v-model="micGainSlider"></v-slider>
      </v-flex>
      <v-flex xs2>
        <div class="input-group">
          <label>{{ micGain }}</label>
        </div>
      </v-flex>
    </v-layout> 
    <v-layout column wrap v-if="recordings.length > 0">
      <h4 class="mt-3">Recordings</h4>
      <div v-for="(recording, idx) in recordings" :key="recording.ts">
        <v-card>
          <v-card-title primary-title>
            <v-layout column wrap>
              <div>
                <h3>Recording #{{ idx + 1 }}</h3>
              </div>
              <div class="ml-3">
                <div>
                  <audio id="audio-element" :src="recording.blobURL" controls="true"/>
                </div>
                <div>
                  size: {{recording.size | fileSizeToHumanSize}}, type: {{recording.mimeType}}
                </div>
              </div>
            </v-layout>
          </v-card-title>
        </v-card>
        <v-divider v-if="idx !== (recordings.length-1)"/>
      </div>
    </v-layout>
  </v-container>
</template>

<script>
import firebase from 'firebase/app'
import 'firebase/storage'

import RecorderService from '@/shared/RecorderService.js'
import utils from '@/shared/Utils'

export default {
  name: 'Test1',
  props: ['audioUrl'],
  filters: {
    fileSizeToHumanSize (val) {
      return utils.humanFileSize(val, true)
    }
  },
  data () {
    return {
      recordingInProgress: false,
      supportedMimeTypes: [],
      recordings: [],
      micGainSlider: 100,
      micGain: 1.0,
      cleanupWhenFinished: true,
      addDynamicsCompressor: false
    }
  },
  created () {
    this.recorderSrvc = new RecorderService()
    this.recorderSrvc.em.addEventListener('recording', evt => this.onNewRecording(evt))
  },
  watch: {
    audioUrl: {
      handler: 'downloadAudioFile',
      immediate: true,
    },
    cleanupWhenFinished (val) {
      this.recorderSrvc.config.stopTracksAndCloseCtxWhenFinished = this.cleanupWhenFinished
    },
    micGainSlider () {
      this.micGain = (this.micGainSlider * 0.01).toFixed(2)
      this.recorderSrvc.setMicGain(this.micGain)
    }
  },
  methods: {
    playAudio() {
      const audioElement = document.getElementById('audio-element')
      console.log('audioElement =', audioElement)
      if (audioElement) {
        audioElement.play()
      }
    },
    downloadAudioFile() {
      if (this.audioUrl) {
        var xhr = new XMLHttpRequest()
        xhr.responseType = 'blob'
        xhr.onload = event => {
          const blob = xhr.response;
          console.log('blob successfully downloaded =', blob)
          const blobURL = URL.createObjectURL(blob)
          const recording = {
            blob,
            ts: new Date().getTime(),
            blobURL,
            mimeType: blob.type,
            size: blob.size,
          }
          this.recordings.push(recording)
        }
        xhr.open('GET', this.audioUrl)
        xhr.send()
      }
    },
    getUid() {
      function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
          .toString(16)
          .substring(1)
      }
      return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4()
    },
    startRecording () {
      this.$emit('start-recording')
      this.recorderSrvc.config.stopTracksAndCloseCtxWhenFinished = this.cleanupWhenFinished
      this.recorderSrvc.config.createDynamicsCompressorNode = this.addDynamicsCompressor
      this.recorderSrvc.startRecording()
        .then(() => this.recordingInProgress = true)
        .catch(error => alert('Exception while start recording: ' + error.message))
    },
    stopRecording () {
      this.$emit('end-recording')
      this.recorderSrvc.stopRecording()
      this.recordingInProgress = false
    },
    onNewRecording (evt) {
      this.recordings.push(evt.detail.recording)
      const storageRef = firebase.storage().ref()
      const id = this.getUid() 
      const recordingRef = storageRef.child(`recordings/${id}`)
      // upload blob 
      const audioFile = this.recordings[0].blob 
      let uploadTask = recordingRef.put(audioFile)
      uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, // or 'state_changed'
        snapshot => {
          let progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          console.log('Upload is ' + progress + '% done')
          switch (snapshot.state) {
            case firebase.storage.TaskState.PAUSED: // or 'paused'
              console.log('Upload is paused')
              break
            case firebase.storage.TaskState.RUNNING: // or 'running'
              console.log('Upload is running')
              break
          }
        }, error => console.log('error =', error), async () => {
        const downloadURL = await uploadTask.snapshot.ref.getDownloadURL()
        this.$emit('file-uploaded', { url: downloadURL, path: id })
        console.log('File available at', downloadURL)
      })
    }
  }
}
</script>
<style lang="stylus" scoped="true">
  @import '~vuetify/src/stylus/settings/_variables'
  @media screen and (min-width: $grid-breakpoints.sm)
    audio
      width 35em
  @media screen and (max-width: ($grid-breakpoints.sm - 1))
    audio
      width 100%
  .live
    color red
</style>