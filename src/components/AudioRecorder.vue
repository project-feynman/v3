<template>
  <v-container mb-5>
    <v-layout row wrap>
      <div class="test1">
        <div>
          <v-btn v-if="!recordingInProgress" @click="startRecording" :disabled="recordingInProgress">
            Start Recording
          </v-btn>
          <v-btn v-if="recordingInProgress" @click="stopRecording" :disabled="!recordingInProgress">Stop Recording</v-btn>
          <v-icon :class="recordingInProgress ? 'live' : ''">mic</v-icon>
        </div>
      </div>
    </v-layout>
    <!-- MIC GAIN -->
    <!-- <v-layout row wrap class="ml-1 mt-1">
      <v-flex xs10 md6>
        <v-slider label="Mic Gain" :max="500" v-model="micGainSlider"></v-slider>
      </v-flex>
      <v-flex xs2>
        <div class="input-group">
          <label>{{ micGain }}</label>
        </div>
      </v-flex>
    </v-layout>  -->
    <!-- don't show for now -->

    <v-layout column wrap v-show="false">
    <!-- <v-layout column wrap v-if="recordings.length > 0"> -->
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
                  <!-- AUDIO PLAYER -->
                  <audio id="audio-element" :src="recording.blobURL" controls="true"/>
                </div>
                <div>
                  size: {{recording.size | fileSizeToHumanSize}}, type: {{recording.mimeType}}
                </div>
              </div>
            </v-layout>
          </v-card-title>
        </v-card>
        <!-- <v-divider v-if="idx !== (recordings.length-1)"/> -->
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
  props: ['audioURL', 'audioPath'],
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
    audioURL: {
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
      if (audioElement) {
        audioElement.play()
      }
    },
    downloadAudioFile() {
      if (this.audioURL) {
        var xhr = new XMLHttpRequest()
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
          if (this.recordings.length == 0) {
            // initial load or just empty local data
            this.recordings.push(newRecording)
          } else if (this.recordings[0].size != newRecording.size) {
            // outdated local data 
            this.recordings = [] 
            this.recordings.push(newRecording)
          } else {
            console.log('local audio file is already in sync')
          }
        }
        xhr.open('GET', this.audioURL)
        xhr.send()
      }
    },
    getRandomUID() {
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
      // replace existing recording 
      this.recordings = [] 
      this.recordings.push(evt.detail.recording)
      const storageRef = firebase.storage().ref()
      // reuse path if possible
      let recordingRef = ''
      let path = ''
      if (this.audioPath) {
        path = this.audioPath
        recordingRef = storageRef.child(`recordings/${path}`)
      } else {
        path = this.getRandomUID()
        recordingRef = storageRef.child(`recordings/${path}`)
      }
      // upload blob 
      const audioFile = this.recordings[0].blob 
      let uploadTask = recordingRef.put(audioFile)
      uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, 
        snapshot => {
          let progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          // console.log('Upload is ' + progress + '% done')
          switch (snapshot.state) {
            case firebase.storage.TaskState.PAUSED:
              // console.log('Upload is paused')
              break
            case firebase.storage.TaskState.RUNNING: 
              // console.log('Upload is running')
              break
          }
        }, error => console.log('error =', error), async () => {
        const downloadURL = await uploadTask.snapshot.ref.getDownloadURL()
        this.$emit('file-uploaded', { url: downloadURL, path })
        console.log('File available at (should be unique each time)', downloadURL)
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