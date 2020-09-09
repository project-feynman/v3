<template>
  <div> 
  <youtube v-show="false"
    :video-id="getIDfromURL()" 
    ref="youtube"
  />
  <slot :play="play" :pause="pause" :isPaused="isPaused">
  
  </slot>
  </div>
</template>

<script>
export default {
  props: {
    youtubeURL: {
      type: String,
      required: true
    }
  },
  data () {
    return {
      isPaused: false
    };
  },
  computed: {
    player () {
      return this.$refs.youtube.player; 
    }
  },
  mounted () {
    this.player.playVideo(); 
  }, 
  methods: {
    play () {
      this.player.playVideo(); 
      this.isPaused = false; 
    },
    pause () {
      this.player.pauseVideo(); 
      this.isPaused = true; 
    },
    getIDfromURL () {
      return this.$youtube.getIdFromUrl(this.youtubeURL);
    }
  }
}
</script>