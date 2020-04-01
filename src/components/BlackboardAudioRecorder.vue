<template>
  <div></div>
</template>

<script>
import AudioRecorder from "audio-recorder-polyfill";
window.MediaRecorder = AudioRecorder; 

export default {
  data () {
    return {
      recorder: null,
      audio: {} // TODO: refactor away this instance variable 
    }
  },
  methods: {
    async startRecording () {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.recorder = new MediaRecorder(stream)

      // When recording finishes, inject it into <audio>
      this.recorder.addEventListener('dataavailable', (e) => {
        const blob = e.data;
        const audioPayload = {
          blob: e.data,
          blobUrl: URL.createObjectURL(blob),
          size: blob.size,
          type: blob.type
        };
        this.$emit("audio-recorded", audioPayload);
        this.audio = audioPayload; // TODO: for legacy purposes so Blackboard.vue works 
      });

      // Start recording
      this.recorder.start()
      this.$emit("start-recording");
    },
    stopRecording () {
      this.recorder.stop();
      for (let track of this.recorder.stream.getTracks()) {
        track.stop();
      }
    }
  }
}
</script>