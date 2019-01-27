export default {
  methods: {
    rescaleCanvas() {
      // only redraw when the user has finished resizing the window
      // first adjust height manually (since browser only handles width automatically)
      const rect = this.canvas.getBoundingClientRect()
      this.canvas.setAttribute('height', `${window.innerHeight - rect.y - 40 }`)
      // then, make the drawing coordinate system 1:1 with the actual size of the canvas
      this.canvas.width = this.canvas.scrollWidth
      this.canvas.height = this.canvas.scrollHeight
      clearTimeout(this.redrawTimeout) // rescaleCanvas() called again during the 400 milliseconds, so cancel 
      this.redrawTimeout = setTimeout(this.drawStrokesInstantly(), 400) // resizing the canvas causes all drawings to be lost 
    },
    async playVisual() {
      // prevent the option of playing non-video supported video (because there was no recording in the first place)
      // would break if there are strokes rendering simultaneously 
      if (!this.allStrokes || this.allStrokes.length == 0) {
        return 
      }
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
      this.idx = 0 
      if (!this.allStrokes[0].startTime) {
        // there are initial setup strokes - load instantly as setup 
        const n = this.allStrokes.length 
        for (let i = 0; i < n; i++) {
          const stroke = this.allStrokes[i]
          if (!stroke.startTime) {
            this.drawStroke(stroke, null)
          } else {
            this.idx = i 
            break 
          }
        }
      }
      this.isPlayingVideo = true 
      this.currentTime = 0
      const checkWhetherStrokesShouldBePlayed = async () => {
        const startIdx = this.idx 
        for (let i = startIdx; i < this.allStrokes.length; i++) {
          const nextStroke = this.allStrokes[i]
          if (Number(nextStroke.startTime) == this.currentTime.toFixed(1)) {
            const strokePeriod = (nextStroke.endTime - nextStroke.startTime) * 1000
            const pointPeriod = strokePeriod / nextStroke.points.length 
            this.drawStroke(nextStroke, pointPeriod)
            if (i == this.allStrokes.length - 1) {
              clearInterval(this.playProgress)
              this.isPlayingVisual = false 
            }
          } else {
            this.idx = i 
            break 
          }
        }
        this.currentTime += 0.1
      }
      this.playProgress = setInterval(checkWhetherStrokesShouldBePlayed, 100)
    },
    async quickplay() {
			this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
      for (const stroke of this.allStrokes) {
        await this.drawStroke(stroke)
      }
		},
    drawStrokesInstantly() {
      for (const stroke of this.allStrokes) {
        this.drawStroke(stroke, null)
      }
    },
    // null is instant, 0 is quickplay, otherwise it's a realtime replay
    async drawStroke({ points, color, lineWidth }, pointPeriod = 0) {
      return new Promise(async resolve => {
        this.setStyle(color, lineWidth)
        for (const point of points) {
          const x = point.unitX * this.canvas.width
          const y = point.unitY * this.canvas.height
          this.drawToPoint(x, y)
          if (pointPeriod != null) {
            await new Promise(resolve => setTimeout(resolve, pointPeriod)) 
          }
        }
        this.lastX = -1
        resolve()
      })  
    },
    drawToPoint(x, y) {
      if (this.lastX == -1) {
        this.lastX = x
        this.lastY = y
        return
      }
      this.traceLineTo(x, y)
      this.ctx.stroke() 
      // update position
      this.lastX = x
      this.lastY = y
    },
    setStyle(color = 'yellow', lineWidth = 2) {
      this.ctx.strokeStyle = color
      this.ctx.lineCap = 'round' // lines at different angles can join into each other
      this.ctx.lineWidth = lineWidth
    },
    traceLineTo(x, y) {
      this.ctx.beginPath()
      this.ctx.moveTo(this.lastX, this.lastY)
      this.ctx.lineTo(x,y)
    }
  }
}