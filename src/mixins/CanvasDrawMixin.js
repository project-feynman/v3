export default {
  data () {
    return {
      lastX: -1,
      lastY: -1
    }
  },
  methods: {
    rescaleCanvas (redraw) {
      // width = internal coordinate system 1:1, scrollWidth = external dimension
      this.canvas.width = this.canvas.scrollWidth;
      this.canvas.height = this.canvas.scrollHeight;
      this.setStyle(this.color, this.lineWidth);
      if (redraw) this.drawStrokesInstantly();
    },
    async quickplay () {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      for (const stroke of this.allStrokes) {
        await this.drawStroke(stroke, 0); // draw 1 stroke per event loop
      }
    },
    drawStrokesInstantly () {
      for (const stroke of this.allStrokes) {
        this.drawStroke(stroke);
      }
    },
    drawStroke ({ points, color, lineWidth, isErasing }, pointPeriod = null) {
      return new Promise(async resolve => {
        // Scale line width to canvas width and set style.
        let newLineWidth = lineWidth * (this.canvas.width / 1000);
        this.setStyle(color, newLineWidth);

        // Go through all points.
        for (let i = 1; i < points.length; i++) {
          this._stroke(points, i, isErasing);
          // Wait if necessary.
          if (pointPeriod !== null) {
            await new Promise(resolve => setTimeout(resolve, pointPeriod));
          }
        }
        // Resolve the promise after drawing all lines.
        resolve();
      });
    },
    // Internal stroke method for drawing a line between two points. The color and line width should be set before
    // calling this method.
    _stroke (points, i, isErasing) {
      // Get the previous point.
      const prevPoint = points[i - 1];
      const prevX = prevPoint.unitX * this.canvas.width;
      const prevY = prevPoint.unitY * this.canvas.height;

      // Get the current point.
      const curPoint = points[i];
      const curX = curPoint.unitX * this.canvas.width;
      const curY = curPoint.unitY * this.canvas.height;

      // Perform drawing.
      this.ctx.globalCompositeOperation = isErasing ? 'destination-out' : 'source-over';
      this.ctx.beginPath();
      this.ctx.moveTo(prevX, prevY);
      this.ctx.lineTo(curX, curY);
      this.ctx.stroke();
    },
    setStyle (color = 'white', lineWidth = 2) {
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = lineWidth;
      this.ctx.lineCap = 'round'; // lines at different angles can join into each other
    },
    getPointPeriod (stroke) { // Measured in seconds
      const strokePeriod = (stroke.endTime - stroke.startTime);
      return strokePeriod / stroke.points.length;
    }
  }
}
