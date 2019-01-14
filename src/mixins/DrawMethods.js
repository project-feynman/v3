export default {
  created() {
    console.log('hello from mixin!')
  },
  methods: {
    drawStroke(points) {
      for (let i = 0; i < points.length; i++) {
        const x = points[i].unitX * this.canvas.width
        const y = points[i].unitY * this.canvas.height
        this.drawLine(x, y, 3)
        if (i == points.length - 1) {
          this.lastX = -1 
        }
      }
    },
    drawAllStrokes(strokes) {
      if (!strokes) {
        return 
      }
      for (let i = 0; i < strokes.length; i++) {
        this.drawStroke(strokes[i].points )
      }
    },
    async playVideo() {
      // console.log('record button =', this.$refs)
      this.isPlayingVideo = true 
      // this.$refs['record-button'].playRecording()
      this.currentTime = 0
      this.idx = 0 
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
      const checkWhetherStrokesShouldBePlayed = async () => {
        const startIdx = this.idx 
        for (let i = startIdx; i < this.allStrokes.length; i++) {
          const nextStroke = this.allStrokes[i]
          if (Number(nextStroke.startTime) == this.currentTime.toFixed(1)) {
            // specify the draw period 
            const strokePeriod = (nextStroke.endTime - nextStroke.startTime) * 1000
            this.drawPath(nextStroke, false, strokePeriod) // draw incrementally, not instantly
            if (i == this.allStrokes.length - 1) {
              clearInterval(this.playProgress)
              this.isPlayingVisual = false 
            }
          } else {
            this.idx = i 
            this.isPlayingVideo = true
            break 
          }
        }
        this.currentTime += 0.1
      }
      this.playProgress = setInterval(checkWhetherStrokesShouldBePlayed, 100)
    },
    async drawPath(data, instant = true, strokePeriod = 0) {
      // initialize styles
			if (data.isEraser) {
				this.ctx.strokeStyle = 'white'
				this.ctx.lineWidth = 20
			} else {
				this.ctx.strokeStyle = 'purple'
				this.ctx.lineWidth = 2
			}
      this.ctx.lineCap = 'round '
      // draw 
			const points = data.points
      const pointPeriod = strokePeriod / points.length
      for (let i = 0; i < points.length; i++) {
        const x = points[i].unitX * this.canvas.width
        const y = points[i].unitY * this.canvas.height
        this.drawLine(x, y, 3)
        if (!instant) {
          // handle when timestamps are all uniform 
          // console.log('pointPeriod =', pointPeriod)
          await timeout(pointPeriod)
        }
        if (i == points.length - 1) {
          this.lastX = -1 
        }
      }
			function timeout(ms) {
				return new Promise(resolve => setTimeout(resolve, ms))
			}
			let promise = new Promise(resolve => setTimeout(resolve, 0))
			promise.catch(error => console.log('error =', error))
			return promise
		}
  }
}