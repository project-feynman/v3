export default {
    data: () => ({
        isFullScreen: false
    }),
    methods: {
        toggleFullscreen () {
              this.isFullScreen = !this.isFullScreen;
            //   const { Doodle } = this.$refs;
              this.handleResize();
              if (this.isFullScreen) {
                document.documentElement.style.overflowY = "hidden";
              } else {
                document.documentElement.style.overflowY = "auto";
              }
        },
        clickOutsideDoodle (e) {
              if (e.target.id === "doodle-wrapper" && this.isFullScreen) {
                this.toggleFullscreen()
              }
        }
    }
}