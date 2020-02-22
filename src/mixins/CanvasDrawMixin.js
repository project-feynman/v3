export default {
  methods: {
    $_drawMixin_rescaleCanvas (redraw) {
      // Readjust internal coordinate system
      if (Math.round(this.canvas.width) !== Math.round(this.canvas.scrollWidth) 
      || Math.round(this.canvas.height) !== Math.round(this.canvas.scrollHeight)) {
        this.canvas.width = this.canvas.scrollWidth; // width = internal coordinate system 1:1, scrollWidth = external dimension
        this.canvas.height = this.canvas.scrollHeight;
      }
      // Re-render drawings
      if (redraw) { 
        console.log("in mixin, all strokes =", this.allStrokes);
        this.$_drawMixin_setStyle(this.color, this.lineWidth);
        this.$_drawMixin_drawStrokesInstantly(); 
      }
    },
    async $_drawMixin_quickplay () {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      for (const stroke of this.allStrokes) {
        await this.$_drawMixin_drawStroke(stroke, 0); // draw 1 stroke per event loop
      }
    },
    $_drawMixin_drawStrokesInstantly () {
      this.allStrokes.forEach(stroke => this.$_drawMixin_drawStroke(stroke));
    },
    $_drawMixin_drawStroke ({ points, color, lineWidth, isErasing }, pointPeriod = null) {
      return new Promise(async resolve => {
        let newLineWidth = lineWidth * (this.canvas.width / 1000); // scale line width to canvas width
        this.$_drawMixin_setStyle(color, newLineWidth);
        for (let i = 1; i < points.length; i++) {
          this.$_drawMixin_connectTwoPoints(points, i, isErasing);
          if (pointPeriod !== null) { // delay for a duration of pointPeriod
            await new Promise(resolve => setTimeout(resolve, pointPeriod));
          }
        }
        resolve();
      });
    },
    $_drawMixin_connectTwoPoints (points, i, isErasing) {
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
    $_drawMixin_setStyle (color = "white", lineWidth = 2) {
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = lineWidth;
      this.ctx.lineCap = "round"; // lines at different angles can join into each other
    },
    $_drawMixin_getPointDuration (stroke) { // measured in seconds
      const strokePeriod = (stroke.endTime - stroke.startTime);
      return strokePeriod / stroke.points.length;
    },
    $_drawMixin_displayImage (src) {
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
