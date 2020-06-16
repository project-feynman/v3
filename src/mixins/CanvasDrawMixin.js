export default {
  methods: {
    /**
     * Adjust the internal dimensions of the canvas to match its external display dimensions 
     * Assumes there is a back canvas, and will redraw the background but not the strokes
    */
    $_rescaleCanvas () {
      const { width, scrollWidth, height, scrollHeight } = this.canvas; 
      if (Math.round(width) !== Math.round(scrollWidth) || Math.round(height) !== Math.round(scrollHeight)) {
        this.canvas.width = this.canvas.scrollWidth; // width = internal coordinate system 1:1, scrollWidth = external dimension
        this.canvas.height = this.canvas.scrollHeight;
        // Note: for the time being the scrollHeights and scrollWidths seem to be synced
        // TODO: find a way for CSS to naturally sync both canvas' scrollHeight and scrollWidth (this will currently be different)
        this.bgCanvas.height = this.bgCanvas.scrollHeight;
        this.bgCanvas.width = this.bgCanvas.scrollWidth;

        this.$_renderBackground(this.imageBlobUrl);
        return true
      }
      return false
    },
    /** 
     * Renders a background if one exists
    */
    $_renderBackground (imageBlobUrl) {
      return new Promise(resolve => {
        if (!imageBlobUrl) resolve();
        const image = new Image();
        image.src = imageBlobUrl; 
        this.bgCanvas.width = this.canvas.width;
        this.bgCanvas.height = this.canvas.height;
        image.onload = () => {
          this.bgCtx.drawImage(image, 0, 0, this.bgCanvas.width, this.bgCanvas.height);
        resolve();
        } 
      });
    },
    /**
     * Play an animation by render strokes in sequence at a rate of 1 stroke per event loop  
     */
    async $_quickplay () {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      for (const stroke of this.strokesArray) {
        await this.$_drawStroke(stroke, 0); // 0 wait-time = draw 1 stroke per event loop
      }
    },
    /**
     * Render every stroke of `this.strokesArray` without delay on a canvas context.
     * 
     * @param {*} ctx the canvas context on which the strokes will be rendered
     */
    $_drawStrokesInstantly (ctx = this.ctx) {
      this.strokesArray.forEach(stroke => this.$_drawStroke(stroke, null, ctx));
    },
    $_drawStroke ({ points, color, lineWidth, isErasing }, pointPeriod = null, ctx = this.ctx) {
      return new Promise(async resolve => {
        const newLineWidth = lineWidth * (this.canvas.width / 1000); // scale line width to canvas width
        this.$_setStyle(color, newLineWidth, ctx);
        for (let i = 1; i < points.length; i++) {
          this.$_connectTwoPoints(points, i, isErasing, ctx);
          if (pointPeriod !== null) { // delay for a duration of pointPeriod
            await new Promise(resolve => setTimeout(resolve, pointPeriod));
          }
        }
        resolve();
      });
    },
    $_setStyle (color = "white", lineWidth = 2, ctx = this.ctx) {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round"; // lines at different angles can join into each other
    },
    $_connectTwoPoints (points, i, isErasing, ctx = this.ctx) {
      // TODO: this silently fails for edge case if a stroke only has 1 point
      const prevPoint = points[i - 1]; // this fails silently for the first point of the stroke i = 0
      const prevX = prevPoint.unitX * this.canvas.width;
      const prevY = prevPoint.unitY * this.canvas.height;

      const curPoint = points[i];
      const curX = curPoint.unitX * this.canvas.width;
      const curY = curPoint.unitY * this.canvas.height;

      ctx.globalCompositeOperation = isErasing ? 'destination-out' : 'source-over';
      ctx.beginPath();
      ctx.moveTo(prevX, prevY);
      ctx.lineTo(curX, curY);
      ctx.stroke();
    },
    $_getPointDuration (stroke) { // measured in seconds
      const strokePeriod = (stroke.endTime - stroke.startTime);
      return strokePeriod / stroke.points.length;
    },
    $_displayImage (src) {
      const image = new Image();
      image.src = src;
      image.onload = () => { 
        this.bgCtx.drawImage(image, 0, 0, this.canvas.scrollWidth, this.canvas.scrollHeight)
      };
    }
  }
}
