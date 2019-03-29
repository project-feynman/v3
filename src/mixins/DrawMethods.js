export default {
  data () {
    return {
      indexOfNextStroke: 0 
    }
  },
  methods: {
    rescaleCanvas() {
      // then, make the drawing coordinate system 1:1 with the actual size of the canvas
      this.canvas.width = this.canvas.scrollWidth
      this.canvas.height = this.canvas.scrollHeight
      // only redraw when the user has finished resizing the window
      clearTimeout(this.redrawTimeout) // rescaleCanvas() called again during the 400 milliseconds, so cancel 
      this.redrawTimeout = setTimeout(this.drawStrokesInstantly, 400) // resizing the canvas causes all drawings to be lost 
    },
    async startSync(getTimeInSeconds) {
      if (!this.allStrokes || this.allStrokes.length == 0) {
        return 
      }
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height) // clear the initial preview
      this.playProgress = setInterval(() => this.syncVisualWithAudio(getTimeInSeconds), 100)
    },
    syncVisualWithAudio(getTimeInSeconds) {
        const n = this.allStrokes.length
        const currentTime = getTimeInSeconds()
        if (this.nextStrokeStartTime() <= currentTime) {
          // catch up the visual to the audio 
          for (let i=this.indexOfNextStroke; i<n; i++) {
            const stroke = this.allStrokes[i]
            if (stroke.startTime > currentTime) {
              this.indexOfNextStroke = i
              break 
            } else {
              this.drawStroke(stroke, this.getPointPeriod(stroke))
              if (this.indexOfNextStroke == n-1) {
                this.indexOfNextStroke += 1 // edge case: without this, "this.allStrokes[this.indexOfNextStroke - 1] will no longer be the most recently drawn stroke 
              }
            }
          }
        } else if (this.allStrokes[this.indexOfNextStroke - 1].startTime > currentTime) {
          // most recent stroke on canvas no longer belongs
          this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
          this.indexOfNextStroke = 0 
          this.allStrokes.forEach(stroke => {
            if (stroke.startTime <= currentTime) {
              this.drawStroke(stroke, null)
              this.indexOfNextStroke += 1
            }
          })
        } else {
          // do nothing 
        }
    },
    nextStrokeStartTime() {
      if (this.indexOfNextStroke == this.allStrokes.length) {
        // handle edge case
        return 999999999999
      } else {
        return this.allStrokes[this.indexOfNextStroke].startTime
      }
    },
    getPointPeriod(stroke) {
      const strokePeriod = (stroke.endTime - stroke.startTime) * 1000 
      return strokePeriod / stroke.points.length
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
    drawStroke({ points, color, lineWidth }, pointPeriod = 0) {
      return new Promise(async resolve => {
        for (let i = 1; i < points.length; i++) {
          const prevPoint = points[i - 1]
          const prevX = prevPoint.unitX * this.canvas.width
          const prevY = prevPoint.unitY * this.canvas.height

          const curPoint = points[i]
          const curX = curPoint.unitX * this.canvas.width
          const curY = curPoint.unitY * this.canvas.height

          this.setStyle(color, lineWidth)
          this.ctx.beginPath()
          this.ctx.moveTo(prevX, prevY)
          this.ctx.lineTo(curX, curY)
          this.ctx.stroke()

          if (pointPeriod != null) {
            await new Promise(resolve => setTimeout(resolve, pointPeriod)) 
          }
        }
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
