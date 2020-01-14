<template>
  <div>
    <!-- <div v-for="recording in recordings" :key="recording.ts"> -->
      <div v-if="recordings.length != 0">
        <vue-plyr ref="plyr">
          <!-- <audio id="audio-element" :src="recording.blobURL" controls="true"/> -->
          <audio id="audio-element" :src="recordings[0].blobURL" controls="true"/>
        </vue-plyr>
      </div>
    <!-- </div> -->
  </div>
</template>

<script>
import firebase from 'firebase/app'
import 'firebase/storage'
import db from '@/database.js'
import RecorderService from '@/shared/RecorderService.js'
import utils from '@/shared/Utils'

export default {
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
    // this is the key thing - this will trigger onNewRecording - always remember this line!
    this.recorderSrvc.em.addEventListener('recording', evt => this.onNewRecording(evt))
  },
  computed: {
    player () {
      return this.$refs.plyr.player
    }
  },
  watch: {
    recordings () {
      if (this.recordings) {
        this.$nextTick(() => {
			    this.player.on('play', () => this.$emit('play'))
          this.player.on('seeking', () => this.$emit('seeking'))
		    })
      }
    },
    cleanupWhenFinished (val) {
      // recording cleanup
      this.recorderSrvc.config.stopTracksAndCloseCtxWhenFinished = this.cleanupWhenFinished
    }
  },
  methods: {
    playAudio () {
      this.player.play()
    },
    // METHODS NEEDED FOR PLAYBACK
    getAudioTime() {
      const audioElement = document.getElementById('audio-element')
      if (!audioElement) {
        return 0
      }
      return audioElement.currentTime
    },
    // METHODS NEEDED FOR RECORDING
    saveAudio (docId) {
      const storageRef = firebase.storage().ref()
      // save to random path 
      const path = this.getRandomUID()
      const recordingRef = storageRef.child(`recordings/${path}`)
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
          // const explanationRef = db.collection('explanations').doc(docId) 
          // await explanationRef.update({
          //   audioPath: path,
          //   audioURL: downloadURL
          // })
          const audioObj = {
            audioPath: path,
            audioURL: downloadURL
          }
          this.$emit("audio-uploaded", audioObj)
          // this.$root.$emit('audio-uploaded', docId)
          console.log('upload was successful!')
        }
      )
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
        .catch(error => alert('Recording error: ' + error.message))
    },
    stopRecording () {
      // this.$emit('end-recording')
      this.recorderSrvc.stopRecording()
      this.recordingInProgress = false
    },
    async onNewRecording (evt) {
      // replace existing recording 
      this.recordings = [] 
      this.recordings.push(evt.detail.recording)
      const storageRef = firebase.storage().ref()
      // reuse path if possible
      let path = ""
      if (this.audioPath) {
        path = this.audioPath
      } else {
        path = this.getRandomUID()
      }
      const recordingRef = storageRef.child(`recordings/${path}`)
      // upload blob 
      const audioFile = this.recordings[0].blob 
      const uploadTask = recordingRef.put(audioFile)
      uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, 
        snapshot => {}, 
        error => console.log('error =', error), 
        async () => {
          const downloadURL = await uploadTask.snapshot.ref.getDownloadURL()
          this.$emit('file-uploaded', { url: downloadURL, path })
        }
      )
    }
  }
}


</script>
