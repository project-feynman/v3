export default {
  methods: {
    /*
      Adjust the internal dimensions of the canvas to match its external display dimensions 
      Assumes there is a back canvas, and will redraw the background but not the strokes
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
    /*
      Renders a background if one exists
    */
    $_renderBackground (imageBlobUrl) {
      return new Promise((resolve) => {
        if (!imageBlobUrl) { resolve(); }
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
    async $_quickplay () {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      for (const stroke of this.strokesArray) {
        await this.$_drawStroke(stroke, 0); // draw 1 stroke per event loop
      }
    },
    $_drawStrokesInstantly () {
      this.strokesArray.forEach((stroke) => this.$_drawStroke(stroke));
    },
    $_drawStroke ({ points, color, lineWidth, isErasing }, pointPeriod = null) {
      return new Promise(async resolve => {
        for (let i = 1; i < points.length; i++) {
          let newLineWidth = lineWidth * (this.canvas.width / 1000); // scale line width to canvas width
          this.$_setStyle(color, newLineWidth);
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
    $_setStyle (color = "white", lineWidth = 2.5) {
      this.ctx.strokeStyle = color;
      // We might wanna do this so that strokes in mobile don't get too thin and in large screens don't get too thick
      // The current problem is that doing it this way will make the stroke eraser width the same width as normal stroke
      // const newLineWidth = lineWidth * (this.canvas.width / 1000); // scale line width to canvas width
      // this.ctx.lineWidth = Math.min(newLineWidth, 2.5);
      this.ctx.lineWidth = lineWidth;
      this.ctx.lineCap = "round"; // lines at different angles can join into each other
    },
    $_drawStrokesInstantly2 () {
      this.strokesArray.forEach((stroke) => {
        if (!stroke.isErasing && !stroke.wasErased) {
          this.$_drawStroke2(stroke);
        }
      });
    },
    $_drawStroke2 ({ points, color, lineWidth, isErasing}, pointPeriod = null) {
      return new Promise(async (resolve) => {
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
      image.onload = () => { 
        this.bgCtx.drawImage(image, 0, 0, this.canvas.scrollWidth, this.canvas.scrollHeight)
      };
    }
  }
}
