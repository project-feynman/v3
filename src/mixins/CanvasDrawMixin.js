export default {
  methods: {
    $_rescaleCanvas (redraw) {
      // Re-adjust internal coordinate system
      if (Math.round(this.canvas.width) !== Math.round(this.canvas.scrollWidth) 
      || Math.round(this.canvas.height) !== Math.round(this.canvas.scrollHeight)) {
        this.canvas.width = this.canvas.scrollWidth; // width = internal coordinate system 1:1, scrollWidth = external dimension
        this.canvas.height = this.canvas.scrollHeight;
      }
      if (redraw) { 
        this.$_setStyle(this.color, this.lineWidth);
        this.$_drawStrokesInstantly(); 
      }
    },
    async $_quickplay () {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      for (const stroke of this.allStrokes) {
        await this.$_drawStroke(stroke, 0); // draw 1 stroke per event loop
      }
    },
    $_drawStrokesInstantly () {
      this.allStrokes.forEach(stroke => this.$_drawStroke(stroke));
    },
    $_drawStroke ({ points, color, lineWidth, isErasing }, pointPeriod = null) {
      return new Promise(async resolve => {
        let newLineWidth = lineWidth * (this.canvas.width / 1000); // scale line width to canvas width
        this.$_setStyle(color, newLineWidth);
        for (let i = 1; i < points.length; i++) {
          this.$_connectTwoPoints(points, i, isErasing);
          if (pointPeriod !== null) { // delay for a duration of pointPeriod
            await new Promise(resolve => setTimeout(resolve, pointPeriod));
          }
        }
        resolve();
      });
    },
    $_connectTwoPoints (points, i, isErasing) {
      // TODO: this silently fails for edge case if a stroke only has 1 point
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
    $_setStyle (color = "white", lineWidth = 2) {
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = lineWidth;
      this.ctx.lineCap = "round"; // lines at different angles can join into each other
    },
    $_drawStrokesInstantly2 () {
      this.allStrokes.forEach(stroke => this.$_drawStroke2(stroke));
    },
    $_drawStroke2 ({ points, color, lineWidth, isErasing }, pointPeriod = null) {
      return new Promise(async resolve => {
        let newLineWidth = lineWidth * (this.canvas.width / 1000); // scale line width to canvas width
        this.$_setStyle2(color, newLineWidth);
        for (let i = 1; i < points.length; i++) {
          this.$_connectTwoPoints2(points, i, isErasing);
          if (pointPeriod !== null) { // delay for a duration of pointPeriod
            await new Promise(resolve => setTimeout(resolve, pointPeriod));
          }
        }
        resolve();
      });
    },
    $_connectTwoPoints2 (points, i, isErasing) {
      // TODO: this silently fails for edge case if a stroke only has 1 point
      const prevPoint = points[i - 1]; // this fails silently for the first point of the stroke i = 0
      const prevX = prevPoint.unitX * this.canvas.width;
      const prevY = prevPoint.unitY * this.canvas.height;

      const curPoint = points[i];
      const curX = curPoint.unitX * this.canvas.width;
      const curY = curPoint.unitY * this.canvas.height;

      this.bgCtx.globalCompositeOperation = isErasing ? 'destination-out' : 'source-over';
      this.bgCtx.beginPath();
      this.bgCtx.moveTo(prevX, prevY);
      this.bgCtx.lineTo(curX, curY);
      this.bgCtx.stroke();
    },
    $_setStyle2 (color = "white", lineWidth = 2) {
      this.bgCtx.strokeStyle = color;
      this.bgCtx.lineWidth = lineWidth;
      this.bgCtx.lineCap = "round"; // lines at different angles can join into each other
    },
    $_getPointDuration (stroke) { // measured in seconds
      const strokePeriod = (stroke.endTime - stroke.startTime);
      return strokePeriod / stroke.points.length;
    },
    $_displayImage (src) {
      const image = new Image();
      image.src = src;
      this.bgCanvas.height = this.canvas.scrollHeight;
      this.bgCanvas.width = this.canvas.scrollWidth;
      image.onload = () => { 
        this.bgCtx.drawImage(image, 0, 0, this.canvas.scrollWidth, this.canvas.scrollHeight)
      };
    }
  }
}
