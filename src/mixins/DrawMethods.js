export default {
  data () {
    return {
      indexOfNextStroke: 0,
      indexOfNextPoint: 0,
    }
  },

  methods: {
    rescaleCanvas (redraw) {
      // Make the drawing coordinate system 1:1 with the actual size of the canvas (`scrollWidth` is the actual width
      // of the canvas).
      this.canvas.width = this.canvas.scrollWidth;
      this.canvas.height = this.canvas.scrollHeight;
      this.setStyle(this.color, this.lineWidth);
      if (redraw) this.drawStrokesInstantly();
    },
    async prepareFrames (getTimeInSeconds) {
      // Don't sync on empty strokes.
      if (!this.allStrokes || this.allStrokes.length === 0) return;
      
      // Create ordering of frames in `[[strokeIndex, pointIndex], ...]` format.
      this.allFrames = [];
      for (let i = 0; i < this.allStrokes.length; i++) {
        for (let j = 1; j < this.allStrokes[i].points.length; j++) {
          this.allFrames.push([i, j]);
        }
      }

      // Sort frames.
      this.allFrames.sort((a, b) => this.frameStartTime(a) - this.frameStartTime(b));
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); // Clear the initial preview or completed video.

      // Update the shared time method.
      this.getTimeInSeconds = getTimeInSeconds; 
      this.indexOfNextFrame = 0;  // Set frame index.
    },
    // Synchronize drawings with the audio on a point-by-point basis.
    keepSyncing (once = false) {
      console.log("syncing...")
      const n = this.allFrames.length;
      const currentTime = this.getTimeInSeconds();
      if (this.nextFrameStartTime() <= currentTime) {
        // The next frame should already have been rendered. Therefore, the visual needs to catch up. Draw until the we
        // reach a frame that should not be visible yet.
        for (let i = this.indexOfNextFrame; i < n; i++) {
          const frameStart = this.nextFrameStartTime();
          if (frameStart > currentTime) break;
          this.renderFrame(this.allFrames[i]);
          this.indexOfNextFrame++;
        }
      } else if (this.indexOfNextFrame > 0
        && this.frameStartTime(this.allFrames[this.indexOfNextFrame - 1]) > currentTime) {
        // It's `indexOfNextFrame - 1` because that is the index of current frame! Most recent i.e. current stroke on
        // canvas no longer belongs. However, this doesn't apply if there are no frames rendered at all. Reset canvas
        // and frames.
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.indexOfNextFrame = 0;

        // De-draw all frames to the current time.
        for (const frame of this.allFrames) {
          // Exit when we reach a frame that should not be visible.
          if (this.frameStartTime(frame) > currentTime) {
            break;
          }

          // Render frame.
          this.renderFrame(frame);
          this.indexOfNextFrame++;
        }
      }
      // If we are not done rendering, we need to call this method again after a timeout. If only synchronizing once,
      // don't repeat call.
      if (this.indexOfNextFrame !== n && !once) {
        // TODO: never catches up to n for some reason
        console.log("indexOfNextFrame =", this.indexOfNextFrame)
        console.log("n =", n);
        // Determine how long to wait. The event loop takes some time, so we will always be a bit behind. Recompute the
        // current time here. Generally speaking, the timeout guarantees a wait of at least the specified amount, so we
        // should not waste too many calls to the method by doing this.
        let timeout = 1000 * (this.nextFrameStartTime() - this.getTimeInSeconds());
        if (timeout < 0) timeout = 0;

        // Recursively call on self. We do not use `setInterval` to prevent overlapping calls to this method.
        this.sync = setTimeout(this.keepSyncing, timeout);
      }
    },
    frameStartTime(frame) {
      const strokeIndex = frame[0];
      const pointIndex = frame[1];
      const stroke = this.allStrokes[strokeIndex];
      return stroke.startTime + (pointIndex - 1) * this.getPointPeriod(stroke);
    },
    nextFrameStartTime () {
      if (this.indexOfNextFrame === this.allFrames.length) {
        return Infinity; // We finished the last frame. The next frame should never start.
      } else {
        return this.frameStartTime(this.allFrames[this.indexOfNextFrame]);
      }
    },
    // Measured in seconds
    getPointPeriod (stroke) {
      const strokePeriod = (stroke.endTime - stroke.startTime);
      return strokePeriod / stroke.points.length;
    },
    async quickplay () {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      for (const stroke of this.allStrokes) {
        await this.drawStroke(stroke, 0);
      }
    },
    drawStrokesInstantly () {
      for (const stroke of this.allStrokes) {
        this.drawStroke(stroke);
      }
    },
    // Internal stroke method for drawing a line between two points. The color and line width should be set before
    // calling this method.
    _stroke(points, i, isErasing) {
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
    // Used for blackboards.
    drawStroke({points, color, lineWidth, isErasing}, pointPeriod = null) {
      return new Promise(async resolve => {
        // Scale line width to canvas width and set style.
        let newLineWidth = lineWidth * (this.canvas.width / 1000);
        this.setStyle(color, newLineWidth);

        // Go through all points.
        for (let i = 1; i < points.length; i++) {
          // Draw a line.
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
    // Used for recorded videos.
    renderFrame(frame) {
      // Extract index.
      const strokeIndex = frame[0];
      const pointIndex = frame[1];

      // Get the stroke.
      const stroke = this.allStrokes[strokeIndex];

      // Set line style, since multiple strokes can be drawn simultaneously.
      this.setStyle(stroke.color, stroke.lineWidth);

      // Draw a stroke. This constitutes a frame.
      // TODO: use $_ instead of only _ or $ to avoid overwritting Vue's methods
      this._stroke(stroke.points, pointIndex, stroke.isErasing);
    },
    drawToPoint(x, y) {
      if (this.lastX === -1) {
        this.lastX = x;
        this.lastY = y;
        return;
      }

      this.traceLineTo(x, y);
      this.ctx.stroke();

      // Update position.
      this.lastX = x;
      this.lastY = y;
    },
    setStyle(color = 'white', lineWidth = 2) {
      this.ctx.strokeStyle = color;
      this.ctx.lineCap = 'round'; // lines at different angles can join into each other
      this.ctx.lineWidth = lineWidth;
    },
    traceLineTo(x, y) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.lastX, this.lastY);
      this.ctx.lineTo(x, y);
    }
  }
}
