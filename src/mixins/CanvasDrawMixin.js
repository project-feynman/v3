export default {
  data: () => ({
    lastX: -1,
    lastY: -1
  }),
  methods: {
    rescaleCanvas (redraw) {
      // Readjust internal coordinate system
      this.canvas.width = this.canvas.scrollWidth; // width = internal coordinate system 1:1, scrollWidth = external dimension
      this.canvas.height = this.canvas.scrollHeight;
      // Re-render drawings with scaled drawings
      if (redraw) { 
        this.setStyle(this.color, this.lineWidth);
        this.drawStrokesInstantly(); 
      }
    },
    async quickplay () {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      for (const stroke of this.allStrokes) {
        await this.drawStroke(stroke, 0); // draw 1 stroke per event loop
      }
    },
    drawStrokesInstantly () {
      this.allStrokes.forEach(stroke => this.drawStroke(stroke));
    },
    drawStroke ({ points, color, lineWidth, isErasing }, pointPeriod = null) {
      return new Promise(async resolve => {
        let newLineWidth = lineWidth * (this.canvas.width / 1000); // scale line width to canvas width
        this.setStyle(color, newLineWidth);
        for (let i = 1; i < points.length; i++) {
          this._stroke(points, i, isErasing);
          if (pointPeriod !== null) { // delay for a duration of pointPeriod
            await new Promise(resolve => setTimeout(resolve, pointPeriod));
          }
        }
        resolve();
      });
    },
    _stroke (points, i, isErasing) {
      console.log("i = 0, ABORT ABORT ABORT"); 
      // fails for edge case if a stroke only has 1 point
      const prevPoint = points[i - 1]; // this fails silently for the first point of the stroke i = 0
      const prevX = prevPoint.unitX * this.canvas.width;
      const prevY = prevPoint.unitY * this.canvas.height;

      const curPoint = points[i];
      const curX = curPoint.unitX * this.canvas.width;
      const curY = curPoint.unitY * this.canvas.height;

      this.ctx.globalCompositeOperation = isErasing ? 'destination-out' : 'source-over';
      this.ctx.beginPath();
      this.ctx.moveTo(prevX, prevY);
      this.ctx.lineTo(curX, curY);
      this.ctx.stroke();
    },
    setStyle (color = "white", lineWidth = 2) {
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = lineWidth;
      this.ctx.lineCap = "round"; // lines at different angles can join into each other
    },
    getPointDuration (stroke) { // measured in seconds
      const strokePeriod = (stroke.endTime - stroke.startTime);
      return strokePeriod / stroke.points.length;
    }
  }
}
