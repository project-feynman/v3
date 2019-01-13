<template>
  <!-- https://codepen.io/Sambego/pen/ZBPbbR -->
  <div>
    <div class="wrapper">
      <div class="audio-wrapper">
        <audio src="" controls class="js-audio audio"></audio>
      </div>
      <div class="toolbar">
        <button class="js-start button button--start">Start</button>
        <button class="js-stop button button--stop">Stop</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      timestamp: 0 
    }
  },
  mounted() { 
    const chunks = []
    let recorder = null
    let audioElement = null
    let timer = null 

    // save the recording as a data-url
    const saveRecording = () => {
      const blob = new Blob(chunks, {
          type: 'audio/mp4; codecs=opus'
      })
      const url = URL.createObjectURL(blob)
      audioElement.setAttribute('src', url)
      audioElement.addEventListener('play', () => this.$emit('replay-recording'))
    }

    // wait until everything has loaded
    (() => {
        // initialize variables
        audioElement = document.querySelector('.js-audio');
        const startButton = document.querySelector('.js-start');
        const stopButton = document.querySelector('.js-stop');
        // get the user's audio input 
        navigator.mediaDevices.getUserMedia({
            audio: true 
        }).then(stream => {
            recorder = new MediaRecorder(stream);
            recorder.ondataavailable = event => chunks.push(event.data)
            recorder.onstop = saveRecording
        })
        startButton.addEventListener('mouseup', () => { 
          this.$emit('start-recording')
          recorder.start()
          // timer = setInterval(() => this.timestamp += 0.5, 500)
        })
        stopButton.addEventListener('mouseup', () => {
          this.$emit('end-recording')
          recorder.stop()
          // clearInterval(timer)
        })

    })()
  }
}
</script>

<style lang="scss">
$white: #ffffff;
$grey: #E5E5E5;
$grey-dark: #B5B4B9;

$green: #6ABB5C;
$blue: #4FABE4;

body {
  background: $white;
}

.wrapper {
  padding: 2rem;
}

.audio-wrapper {
  margin: 0 0 2rem 0;
}

.audio {
  width: 100%;
  
  &::-webkit-media-controls-panel {
    background: white;
  }
}

.toolbar {
  text-align: center
}

.button {
  transition: all .4s ease-in-out;
  
  position: inline-block;
  padding: .6rem 1rem;
  
  background: $white;
  
  border: 1px solid $grey;
  border-radius: 0;
  outline: none;
  
  text-transform: uppercase;
  color: $grey-dark;
  
  &--start:hover {
    background: $green;
    
    border-color: darken($green, 5);
    
    color: $white;
  }
    
  &--stop:hover {
    background: $blue;
    
    border-color: darken($blue, 5);
    
    color: $white;
  }
}

</style>
