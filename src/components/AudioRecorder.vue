<template>
  <v-container mb-5>
    <v-layout row wrap>
      <div class="test1">
        <h2 v-if="recordings">{{ recordings }}</h2>
        <h3>Test 1
          <span v-if="$vuetify.breakpoint.xsOnly"><br></span>
          <span v-if="!$vuetify.breakpoint.xsOnly"> - </span>
          Repeatable Recording &amp; Playback
        </h3>
        <p>Click start/stop multiple times to create multiple recordings. Works on all modern browser/device
          combinations, including iOS/Safari 11.2.x and newer.</p>
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
    <v-layout row wrap class="ml-1 mt-1">
      <v-checkbox v-model="addDynamicsCompressor"
                  label="Add dynamics compressor to audio graph"
                  :disabled="recordingInProgress"></v-checkbox>
    </v-layout>
    <v-layout row wrap class="ml-1 mt-1">
      <v-checkbox v-model="cleanupWhenFinished"
                  label="Stop tracks and close audio context when recording stopped"></v-checkbox>
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
                  <audio :src="recording.blobUrl" controls="true"/>
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
    this.recorderSrvc.em.addEventListener('recording', (evt) => this.onNewRecording(evt))
  },
  watch: {
    cleanupWhenFinished (val) {
      this.recorderSrvc.config.stopTracksAndCloseCtxWhenFinished = this.cleanupWhenFinished
    },
    micGainSlider () {
      this.micGain = (this.micGainSlider * 0.01).toFixed(2)
      this.recorderSrvc.setMicGain(this.micGain)
    }
  },
  methods: {
    startRecording () {
      this.recorderSrvc.config.stopTracksAndCloseCtxWhenFinished = this.cleanupWhenFinished
      this.recorderSrvc.config.createDynamicsCompressorNode = this.addDynamicsCompressor
      this.recorderSrvc.startRecording()
        .then(() => {
          this.recordingInProgress = true
        })
        .catch(error => {
          console.error('Exception while start recording: ' + error)
          alert('Exception while start recording: ' + error.message)
        })
    },
    stopRecording () {
      this.recorderSrvc.stopRecording()
      this.recordingInProgress = false

    },
    onNewRecording (evt) {
      this.recordings.push(evt.detail.recording)
      console.log('new recording added to recordings')
      // attempt to save it to Firebase 
      const storageRef = firebase.storage().ref()
      const recordingsRef = storageRef.child('recording')


      // upload blob 
      const audioFile = this.recordings[0].blob 
      recordingsRef.put(audioFile).then(snapshot => console.log('uploaded blob!'))

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