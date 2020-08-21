import { startCase } from "lodash";

export default {
  methods: {
    /**
     * Adjust the internal dimensions of the canvas to match its external display dimensions 
     * Assumes there is a back canvas, and will redraw the background but not the strokes
    */
    $_rescaleCanvas () {
      console.log('the attrs', this.$attrs);
      const { width, scrollWidth, height, scrollHeight } = this.canvas; 
      if (Math.round(width) !== Math.round(scrollWidth) || Math.round(height) !== Math.round(scrollHeight)) {
        // This is a bit sketchy solution, but just here for the time being
        console.log('this.canvasDimensions', this.canvas.scrollWidth);
        if (this.isRealtime && (this.canvas.scrollWidth === 0) && this.canvasDimensions.hasOwnProperty('width')) {
          console.log('in here')
          this.canvas.width = this.canvasDimensions.width; // width = internal coordinate system 1:1, scrollWidth = external dimension
          this.canvas.height = this.canvasDimensions.height;
        } else {
          console.log('out there');
          this.canvas.width = this.canvas.scrollWidth; // width = internal coordinate system 1:1, scrollWidth = external dimension
          this.canvas.height = this.canvas.scrollHeight;
          if (this.isRealtime) {
            this.SET_CANVAS_DIMENSIONS({'height': this.canvas.height, 'width': this.canvas.width});
          }
        }
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
     * 
     * @param src either a download URL or a blob URL 
    */
    $_renderBackground (src) {
      return new Promise(resolve => {
        if (!src) resolve(); 

        const image = new Image();
        image.src = src;
        
        /* avoid the "tainted canvas may not be exported" error
            https://stackoverflow.com/questions/22710627/tainted-canvases-may-not-be-exported */
        image.crossOrigin="anonymous";
        
        image.onload = () => { 
          this.bgCtx.drawImage(image, 0, 0, this.canvas.scrollWidth, this.canvas.scrollHeight);
          resolve();
        };
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
        const normalizedWidth = lineWidth * (this.canvas.width / 1000); // scale line width to canvas width
        for (let i = 1; i < points.length; i++) {
          this.$_connectTwoPoints(points, i, isErasing, ctx, color, normalizedWidth);
          if (pointPeriod !== null) { // delay for a duration of pointPeriod
            await new Promise(resolve => setTimeout(resolve, pointPeriod));
          }
        }
        resolve();
      });
    },
    $_setStrokeProperties (color, lineWidth, isEraserStroke, ctx) {
      ctx.globalCompositeOperation = isEraserStroke ? 'destination-out' : 'source-over';
      ctx.strokeStyle = color; 
      ctx.lineWidth = lineWidth; 
      ctx.lineCap = "round"; // lines at different angles can join into each other
    },
    /**
     * Joins together 2 points using a straight line. 
     * 
     * The operation is *used* atomically, and so calling `$_setStrokesProperties()`
     * makes the method safe for single-thread concurrency. 
     * For example: when rendering two strokes "in parallel", the colors won't interfere.
     * 
     * @param {*} points NORMALIZED coordinates of the points to be joined i.e. { unitX: Number, unitY: Number } 
     * @param {*} i 
     * @param {*} isErasing 
     * @param {*} ctx 
     * @param {*} color 
     * @param {*} lineWidth 
     */
    $_connectTwoPoints (points, i, isErasing, ctx = this.ctx, color = "white", lineWidth = 2) {
      this.$_setStrokeProperties(color, lineWidth, isErasing, ctx);

      // TODO: this line silently fails for edge case if a stroke only has 1 point
      const prevPoint = points[i - 1]; // this fails silently for the first point of the stroke i = 0
      const prevX = prevPoint.unitX * this.canvas.width;
      const prevY = prevPoint.unitY * this.canvas.height;

      const curPoint = points[i];
      const curX = curPoint.unitX * this.canvas.width;
      const curY = curPoint.unitY * this.canvas.height;

      ctx.beginPath();
      ctx.moveTo(prevX, prevY);
      ctx.lineTo(curX, curY);
      ctx.stroke();
    },
    /**
     * Calculates how slowly two points should be traced out.
     * Measured in seconds. 
     */
    $_getPointDuration (stroke) { 
      const strokePeriod = (stroke.endTime - stroke.startTime);
      return strokePeriod / stroke.points.length;
    }
  }
}
