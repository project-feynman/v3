<template>
  <div></div>
</template>

<script>
import AudioRecorder from "audio-recorder-polyfill";

// import mpegEncoder from "audio-recorder-polyfill/mpeg-encoder";
// AudioRecorder.encoder = mpegEncoder;
// AudioRecorder.prototype.mimeType = "audio/mpeg"; // mpeg is equivalent to mp3
window.MediaRecorder = AudioRecorder;
import { mapState} from 'vuex'

export default {
  data () {
    return {
      recorder: null,
    }; 
  },
  computed: {
    ...mapState([
      'micStreamCopy'
    ])
  },
  created () {
    this.$emit("created", { 
      startRecording: this.startRecording,
      stopRecording: this.stopRecording
    }); 
  },
  methods: {
    startRecording () {
      return new Promise(async resolve => {
        // a stream cannot be re-used across multiple recording sessions
        // because it is deactivated/stopped (see `stopRecording() below`)
        const localCopy = this.micStreamCopy.clone()
        this.recorder = new MediaRecorder(localCopy); 
        
        this.recorder.start(); 
        this.$emit("start-recording");
        resolve();
      });
    },
    stopRecording () {
      return new Promise((resolve, reject) => {
        this.recorder.addEventListener("dataavailable", e => {
          this.$emit("update:audioBlob", e.data); 
          resolve(); 
        });
        this.recorder.stop();
        for (const track of this.recorder.stream.getTracks()) {
          track.stop();
        }
      });
    }
  }
}
</script>