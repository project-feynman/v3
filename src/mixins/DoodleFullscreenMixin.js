export default {
  data: () => ({
    isFullScreen: false
  }),
  methods: {
    $_toggleFullscreen () {
      this.isFullScreen = !this.isFullScreen;
      this.handleResize();
      document.documentElement.style.overflowY = this.isFullScreen ? 
        "hidden" : "auto"; 
    },
    $_exitFullscreen (e) {
      if (e.target.id === "fullscreen-wrapper" && this.isFullScreen) {
        this.$_toggleFullscreen();
      }
    }
  }
}