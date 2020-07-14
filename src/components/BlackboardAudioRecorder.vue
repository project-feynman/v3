<template>
  <div></div>
</template>

<script>
import AudioRecorder from "audio-recorder-polyfill";
import mpegEncoder from "audio-recorder-polyfill/mpeg-encoder";

// AudioRecorder.encoder = mpegEncoder;
// AudioRecorder.prototype.mimeType = "audio/mpeg"; // mpeg is equivalent to mp3
window.MediaRecorder = AudioRecorder;

export default {
  data () {
    return {
      recorder: null,
    }; 
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
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.recorder = new MediaRecorder(stream); 
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