export default {
  created() {
    console.log('hello from mixin!')
  },
  methods: {
    rescaleCanvas() {
      this.canvas.width = this.canvas.scrollWidth
      this.canvas.height = this.canvas.scrollHeight
      // only redraw when the user has finished resizing the window
      clearTimeout(this.redrawTimeout) // rescaleCanvas() called again during the 400 milliseconds, so cancel 
      this.redrawTimeout = setTimeout(this.drawAllStrokes(this.allStrokes), 400) // resizing the canvas causes all drawings to be lost 
    },
    drawLine(x, y, size = 2) {
      if (this.lastX == -1) {
        this.lastX = x
        this.lastY = y
        return
      }
      // set style 
      this.ctx.strokeStyle = 'purple'
      this.ctx.lineCap = 'round' // lines at different angles can join into each other
      this.ctx.lineWidth = size
      // "trace" the line
      this.ctx.beginPath()
      this.ctx.moveTo(this.lastX, this.lastY)
      this.ctx.lineTo(x,y)
      // draw the line
      this.ctx.stroke()
      // update position
      this.lastX = x
      this.lastY = y
    },
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
		},
    // ANIMATION RELATED FUNCTIONS
    getDrawSpeed(n) {
      if (n < 10) { return 500 } 
      else if (n < 20) { return 250 } 
      else if (n < 40) { return 100 } 
      else { return 30 }
    },
    async playAnimation() {
			if (!this.ctx || !this.canvas || !this.allStrokes) {
				return
			}
			this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
			function timeout(ms) {
				return new Promise(resolve => setTimeout(resolve, ms))
			}
			const n = this.allStrokes.length
			const strokePeriod = this.getDrawSpeed(n)
			for (let i=0; i<n; i++) {
				await this.drawPath(this.allStrokes[i], false) // draw incrementally, not instantly
				await timeout(strokePeriod / 100)
			}
		}
  }
}