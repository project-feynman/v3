import _ from "lodash"; 

export default {
  methods: {
    /**
     * Adjust the internal dimensions of the canvas to match its external display dimensions 
     * 
     * Assumes there is a back canvas, and will redraw the background but not the strokes. 
     * 
     * Returns true if the canvas actually had to adjust its internal dimensions, which is useful for re-rendering the strokes with the correct stroke width.
     * 
     * Otherwise it returns false. Most of the time this is because rescaleCanvas is used as a quick-fix to prevent the pencil offset bug:
     * every time the user makes a new stroke, rescaleCanvas is called O(1) if check and would return false most of the time. 
     *
     * 
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
        
        // don't remove this yet, because even though BlackboardCoreDrawing also renders background, DoodleVideo and DoodleAnimation still relies on this
        this.$_renderBackground(this.imageBlobUrl);
        return true;
      }
      return false;
    },
    // I copied and pasted $_rescaleCanvas to this function, so I can debounce it without breaking existing API
    $_$rescaleCanvas () {

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
          const boardWidth = this.canvas.scrollWidth 
          const boardHeight = this.canvas.scrollHeight
          const imageAspectRatio = image.width / image.height
          // correctness argument: because each device's blackboard has the same aspect ratio,
          // height-based scaling will not distort annotations
          if (image.height > image.width) { // weak criteria, but assume it's a vertical PDF page
            image.width = boardWidth / 2
            image.height = image.width * 1/imageAspectRatio
          } else { // slide ratio seems to be 3 * 4
            image.width = 0.75 * boardWidth
            image.height = image.width * 1/imageAspectRatio
          }
          this.bgCtx.drawImage(image, 0, 0, image.width, image.height); // (0, 0) specifies the top-left corner of the image
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
    $_drawStrokesInstantlyButNormalizeLineWidth (ctx = this.ctx) {
      this.strokesArray.forEach(stroke => {
        this.$_drawStroke(
          { 
            points: stroke.points, 
            color: stroke.color, 
            lineWidth: stroke.lineWidth * (this.canvas.scrollWidth / 1000),
            isErasing: stroke.isErasing 
          }, 
          null, 
          ctx
        );
      });
    },
    $_drawStroke ({ points, color, lineWidth, isErasing }, pointPeriod = null, ctx = this.ctx) {
      return new Promise(async resolve => {
        for (let i = 1; i < points.length; i++) {
          this.$_connectTwoPoints(points, i, isErasing, ctx, color, lineWidth);
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
      /**
       * when two independent lines meet (think two straight lines meeting each other), instead of zigzagging abruptly, they'll be "rounded" together"
       * NOTE: "This property has no effect wherever two connected segments have the same direction"
       * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/lineJoin
       */
      ctx.lineJoin = "round"; 

      // end of line is not a square, but a rounded edge  
      // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/lineCap
      ctx.lineCap = "round"; 
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

      
      /**
       * Draw a quadratic curve according to: https://github.com/shuding/apple-pencil-safari-api-test/blob/gh-pages/index.js
       * 
       * But if I set the control points like this, it's just equivalent to `lineTo()`
       */
      // const controlX = (prevX + curX) / 2; 
      // const controlY = (prevY + curY) / 2;  
      // ctx.quadraticCurveTo(controlX, controlY, curX, curY);
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
