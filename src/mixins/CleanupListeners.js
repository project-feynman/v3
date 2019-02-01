export default { 
  watch: {
    allStrokes() {
      if (this.playProgress) {
        console.log('allStrokes changed - likely because video was switched - removing setInterval')
        clearInterval(this.playProgress)
        this.playProgress = null 
      }
    }
  },
  beforeDestroy() {
    // clean up everything 
    console.log('beforeDestroy()')
    if (this.playProgress) {
      console.log('this.playProgress =', this.playProgress)
      clearInterval(this.playProgress)
    }
  }
}