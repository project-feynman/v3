export default {
  methods: {
    rescaleCanvas() {
      // only redraw when the user has finished resizing the window
      // then, make the drawing coordinate system 1:1 with the actual size of the canvas
      this.canvas.width = this.canvas.scrollWidth
      this.canvas.height = this.canvas.scrollHeight
      clearTimeout(this.redrawTimeout) // rescaleCanvas() called again during the 400 milliseconds, so cancel 
      this.redrawTimeout = setTimeout(this.drawStrokesInstantly(), 400) // resizing the canvas causes all drawings to be lost 
    },
    /**
     * @param {*} getTimeInSeconds A function which returns the current time to draw to in seconds
     */
    async playVisual(getTimeInSeconds) {
      if (this.playProgress) {
        // already in the middle of playing video 
        return 
      }
      if (!this.allStrokes || this.allStrokes.length == 0) {
        return 
      }

      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
      this.isPlayingVideo = true
      this.numStrokesDrawn = 0

      this.playProgress = setInterval(async () => {
        const currentTime = getTimeInSeconds()
        // console.log(currentTime, this.numStrokesDrawn, this.allStrokes.length)
        const prevStartTime = (() => {
          if (this.numStrokesDrawn == 0) return 0
          
          const prevStartTime = this.allStrokes[this.numStrokesDrawn - 1].startTime
          if (prevStartTime) return prevStartTime
          return 0
        })()

        if (prevStartTime < currentTime) {
          // Continue drawing without clearing
          for(; this.numStrokesDrawn < this.allStrokes.length;
                this.numStrokesDrawn++) {
            const stroke = this.allStrokes[this.numStrokesDrawn]
            if (!stroke.startTime || stroke.startTime <= currentTime) {
              const strokePeriod = (stroke.endTime - stroke.startTime) * 1000
              const pointPeriod = strokePeriod / stroke.points.length 
              this.drawStroke(stroke, pointPeriod)
            } else {
              break
            }
          }
        } else {
          // Need to redraw from beginning
          this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
          this.numStrokesDrawn = 0
          this.allStrokes.forEach(stroke => {
            if (!stroke.startTime || stroke.startTime <= currentTime) {
              this.drawStroke(stroke, null)
              this.numStrokesDrawn++
            }
          })
        }

        // console.log('animation finished')
        // this.$emit('animation-finished')

        if (this.numStrokesDrawn == this.allStrokes.length) {
          console.log('finished all strokes')
          //clearInterval(this.playProgress)
          //this.playProgress = null
        }
      }, 100)
    },
    async quickplay() {
      console.log('quickplay()')
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
