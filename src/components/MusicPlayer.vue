<template>
  <youtube 
    :video-id="getIDfromURL()" 
    ref="youtube"
  />
</template>

<script>
export default {
  props: {
    youtubeURL: {
      type: String,
      required: true
    }
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
    getIDfromURL () {
      return this.$youtube.getIdFromUrl(this.youtubeURL);
    }
  }
}
</script>