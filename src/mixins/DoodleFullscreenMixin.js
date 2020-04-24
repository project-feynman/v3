export default {
  data: () => ({
      isFullScreen: false
  }),
  methods: {
    toggleFullscreen () {
      this.isFullScreen = !this.isFullScreen;
      this.handleResize();
      document.documentElement.style.overflowY = this.isFullScreen ? 
        "hidden" : "auto"; 
    },
    exitFullscreen () {
      if (this.isFullScreen) {
        this.toggleFullscreen();
      }
    }
  }
}