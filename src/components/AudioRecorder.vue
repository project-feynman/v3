<template>
  <div>
    <v-btn v-if="!recordingInProgress" @click="startRecording" :disabled="recordingInProgress">
      START RECORDING
    </v-btn>
    <v-btn v-else @click="stopRecording" :disabled="!recordingInProgress">
      Stop Recording
    </v-btn>
    <!-- <v-icon :class="recordingInProgress ? 'live' : ''">mic</v-icon> -->
    <div v-show="false">
      <div v-for="recording in recordings" :key="recording.ts">
        <div>
          <!-- AUDIO PLAYER -->
          <audio id="audio-element" :src="recording.blobURL" controls="true"/>
        </div>
        <div>
          size: {{recording.size | fileSizeToHumanSize}}, type: {{recording.mimeType}}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import firebase from 'firebase/app'
import 'firebase/storage'
import db from '@/database.js'

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
      micGain: 1.0,
      cleanupWhenFinished: true,
      addDynamicsCompressor: false
    }
  },
  created () {
    this.recorderSrvc = new RecorderService()
    this.recorderSrvc.em.addEventListener('recording', evt => this.onNewRecording(evt))
    this.$root.$on('save-explanation', docId => this.saveAudio(docId))
  },
  watch: {
    audioURL: {
      handler: 'downloadAudioFile',
      immediate: true,
    },
    cleanupWhenFinished (val) {
      this.recorderSrvc.config.stopTracksAndCloseCtxWhenFinished = this.cleanupWhenFinished
    }
  },
  methods: {
    saveAudio(docId) {
      // duplicate audio file 
      console.log('duplicating audio file')
      const storageRef = firebase.storage().ref()
      const path = this.getRandomUID()
      const recordingRef = storageRef.child(`recordings/${path}`)
      // console.log('this.recordings =', this.recordings)
      // console.log('this.recordings[0] =', this.recordings[0])
      const audioFile = this.recordings[0].blob 
      let uploadTask = recordingRef.put(audioFile)
      uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, 
        // #1
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
        }, 
        // #2
        error => console.log('error =', error), 
        // #3
        async () => {
          const downloadURL = await uploadTask.snapshot.ref.getDownloadURL()
          // update the explanation doc to contain a pointer to the new duplicated audio file 
          const explanationRef = db.collection('explanations').doc(docId) 
          await explanationRef.update({
            audioPath: path,
            audioURL: downloadURL
          })
          console.log('upload was successful!')
        }
      )
    },
    playAudio() {
      console.log('playAudio')
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
