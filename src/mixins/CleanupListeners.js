export default { 
  watch: {
    allStrokes() {
      if (this.playProgress) {
        clearInterval(this.playProgress)
        this.playProgress = null 
      }
    }
  },
  beforeDestroy() {
    // clean up everything 
    if (this.playProgress) {
      clearInterval(this.playProgress)
    }
  }
}