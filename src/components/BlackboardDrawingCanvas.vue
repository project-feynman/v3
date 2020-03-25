<template>
  <div class="blackboard" elevation="1">
    <slot name="canvas-toolbar"
      :changeTool="changeTool"
      :displayImageFile="displayImageFile"
      :resetBoard="resetBoard"
    >

    </slot>
    <div ref="BlackboardWrapper" class="blackboard-wrapper">
      <canvas ref="FrontCanvas" class="front-canvas" 
        @touchstart="(e) => touchStart(e)"
        @touchmove="(e) => touchMove(e)"
        @touchend="(e) => touchEnd(e)"
        @mousedown="(e) => mouseDown(e)"
        @mousemove="(e) => mouseMove(e)"
        @mouseup="(e) => mouseUp(e)"
      ></canvas>
      <canvas ref="BackCanvas" class="back-canvas"></canvas>
    </div>
  </div>
</template>

<script>
/* A HTML canvas that supports drawing with stylus/touch/mouse. */
import BlackboardToolBar from "@/components/BlackboardToolBar.vue";
import CanvasDrawMixin from "@/mixins/CanvasDrawMixin.js";
import ButtonNew from "@/components/ButtonNew.vue";
import { BlackboardTools, RecordState, navbarHeight, aspectRatio, epsilon } from "@/CONSTANTS.js";

export default {
  props: {
    currentTime: Number,
    default: () => 0
  },
  mixins: [
    CanvasDrawMixin
  ],
  components: { 
    BlackboardToolBar, 
    ButtonNew
  },
  data () {
    return {
      canvas: null,
      ctx: null,
      bgCanvas: null,
      bgCtx: null,
      currentTool: { 
        type: BlackboardTools.PEN,
        color: "white",
        lineWidth: 2.5
      },
      isHoldingLeftClick: false,
      touchDisabled: false,
      strokesArray: [],
      currentStroke: { 
        points: [] 
      },
      currPoint: { 
        x: 0, 
        y: 0 
      },
      prevPoint: { 
        x: -1, 
        y: -1 
      },
      imageBlob: null
    }
  },
  computed: {
    isStrokeEraser () {
      return this.currentTool.type === BlackboardTools.STROKE_ERASER;
    },
    isNormalEraser () {
      return this.currentTool.type === BlackboardTools.NORMAL_ERASER;
    },
    isPen () {
      return this.currentTool.type === BlackboardTools.PEN;
    },
  },
  mounted () {
    this.canvas = this.$refs.FrontCanvas;
    this.ctx = this.canvas.getContext("2d");
    this.bgCanvas = this.$refs.BackCanvas;
    this.bgCtx = this.bgCanvas.getContext("2d");
    this.resizeBlackboard();
    window.addEventListener("resize", this.resizeBlackboard, false); 
    document.fonts.ready.then(() => this.createCustomCusor()); // since cursor uses material icons font, load it after fonts are ready
  },
  destroyed () {
    window.removeEventListener("resize", this.resizeBlackboard);
  },
  methods: {
    appendToStrokesArray (stroke) {
      this.strokesArray.push({
        startTime: this.currentTime,
        endTime: this.currentTime, // TODO: of course this is not correct
        ...stroke
      });
    },
    convertAllStrokesToBeInitialStrokes () {
      for (const stroke of this.strokesArray) {
        [stroke.startTime, stroke.endTime] = [0, 0];
      }
    },
    changeTool (tool) {
      this.currentTool = tool;
      this.ctx.globalCompositeOperation = (this.isNormalEraser || this.isStrokeEraser) // isStrokeEraser now erases in the back like a normal eraser
        ? "destination-out"
        : "source-over";
      if (this.isStrokeEraser) {
        this.$root.$emit("show-snackbar", 
          "If the stroke eraser doesn't seem to detect properly, try tracing it slowly along the stroke you want to erase."
        );
      }
    },
    async resetBoard () {
      this.wipeBoard();
      this.resetVariables(); 
      this.$emit("board-reset");
    },
    wipeBoard () {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.bgCtx.clearRect(0, 0, this.bgCanvas.scrollWidth, this.bgCanvas.scrollHeight); // scroll width safer I think
    },
    resetVariables () {
      this.strokesArray = [];
      this.prevPoint = { 
        x: -1, 
        y: -1 
      };
      this.imageBlob = null;
    },
    displayImageFile (imageFile) {
      const src = URL.createObjectURL(imageFile);
      this.displayImageAsBackground(src);
      this.imageBlob = imageFile; 
    },
    displayImageAsBackground (src) {
      return new Promise((resolve) => {
        const image = new Image();
        image.src = src;
        this.bgCanvas.height = this.canvas.scrollHeight;
        this.bgCanvas.width = this.canvas.scrollWidth;
        image.onload = () => {
          this.bgCtx.drawImage(image, 0, 0, this.bgCanvas.scrollWidth, this.bgCanvas.scrollHeight);
          resolve();
        }
      });
    },
    startNewStroke (e) {
      this.$emit("stroke-start");
      e.preventDefault(); 
      
      this.currentStroke = {
        strokeNumber: this.strokesArray.length + 1,
        startTime: Number(this.currentTime.toFixed(1)),
        color: this.currentTool.color,
        lineWidth: this.currentTool.lineWidth,
        isErasing: this.isNormalEraser,
        points: []
      };

      this.$_rescaleCanvas();
      this.$_setStyle(this.currentTool.color, this.currentTool.lineWidth);
    },
    touchStart (e) {
      if (this.isNotValidTouch(e)) { return; } 
      if (e.touches[0].touchType === "stylus") { 
        this.touchDisabled = true; 
      }
      if (this.isStrokeEraser) { 
        this.eraseStrokesWithinRadius(e); 
      } else {
        this.startNewStroke(e);
        this.drawToPointAndSave(e);
      }
    },
    touchMove (e) {
      if (this.isNotValidTouch(e)) { return; } 
      if (this.isStrokeEraser) { 
        this.eraseStrokesWithinRadius(e); 
      } else { 
        this.drawToPointAndSave(e); 
      }
    },
    touchEnd (e) { 
      this.saveStrokeThenReset(e); 
    },
    mouseDown (e) {
      this.isHoldingLeftClick = true;
      if (this.isStrokeEraser) { 
        this.eraseStrokesWithinRadius(e); 
      } else {
        this.startNewStroke(e);
        const isMouse = true;
        this.drawToPointAndSave(e, isMouse);
      }
    },
    mouseMove (e) {
      if (!this.isHoldingLeftClick) { return; } 
      if (this.isStrokeEraser) { 
        this.eraseStrokesWithinRadius(e); 
      } else {
        const isMouse = true;
        this.drawToPointAndSave(e, isMouse);
      }
    },
    mouseUp (e) {
      this.isHoldingLeftClick = false;
      this.saveStrokeThenReset(e);
    },
    saveStrokeThenReset (e) {
      e.preventDefault()
      if (this.currentStroke.points.length === 0) { return; }  // user is touching the screen despite that touch is disabled
      this.currentStroke.endTime = Number(this.currentTime.toFixed(1));
      this.strokesArray.push(this.currentStroke);
      this.$emit("stroke-drawn", this.currentStroke);
      // reset 
      this.currentStroke = { 
        points: [] 
      };
      this.prevPoint = { 
        x: -1, 
        y: -1 
      };
    },
    drawToPointAndSave (e, isMouse) {
      e.preventDefault();
      if (isMouse) { 
        this.currPoint = { 
          x: e.offsetX, 
          y: e.offsetY 
        }; 
      } else { 
        this.getTouchPos(e); 
      }
      this.convertAndSavePoint(this.currPoint.x, this.currPoint.y);
      this.drawToPoint(this.currPoint);
    },
    convertAndSavePoint (x, y) {
      const unitX = parseFloat(x / this.canvas.width).toFixed(4);
      const unitY = parseFloat(y / this.canvas.height).toFixed(4);
      this.currentStroke.points.push({ unitX, unitY });
    },
    eraseStrokesWithinRadius (e) {
      e.preventDefault();
      let eraserCenter = {};
      if (this.isHoldingLeftClick) {
        eraserCenter = { x: e.offsetX, y: e.offsetY };
      } else {
        const finger1 = e.touches[0];
        const { left, top } = this.canvas.getBoundingClientRect();
        eraserCenter.x = finger1.pageX - left - window.scrollX;
        eraserCenter.y = finger1.pageY - top - window.scrollY;
      }
      const radius = 10;
      for (let i = 0; i < this.strokesArray.length; i++) {
        const stroke = this.strokesArray[i];
        // don't undo eraser strokes
        if (stroke.wasErased || stroke.isErasing) {  
          continue;
        }
        for (let point of stroke.points) {
          const deltaX = eraserCenter.x - point.unitX * this.canvas.width;
          const deltaY = eraserCenter.y - point.unitY * this.canvas.height;
          if (radius > Math.sqrt(deltaX**2 + deltaY**2)) {
            this.eraseStroke(stroke);
            break; 
          }
        }
      }
    },
    eraseStroke (stroke) {
      stroke.wasErased = true;
      this.$emit("stroke-start");

      const antiStroke = {
        strokeNumber: this.strokesArray.length + 1,
        isErasing: true,
        lineWidth: stroke.lineWidth,
        points: stroke.points
      };

      this.$_drawStroke(antiStroke);
      this.strokesArray.push(antiStroke);
      this.$emit("stroke-drawn", antiStroke);
    },
    getTouchPos (e) {
      const finger1 = e.touches[0];
      const { left, top } = this.canvas.getBoundingClientRect();
      this.currPoint.x = finger1.pageX - left - window.scrollX;
      this.currPoint.y = finger1.pageY - top - window.scrollY;
    },
    isNotValidTouch (e) {
      if (e.touches.length !== 1) { return true; } // multiple fingers not allowed
      return this.isFinger(e) && this.touchDisabled;
    },
    isApplePencil (e) {
      return e.touches[0].touchType === "stylus";
    },
    isFinger (e) { // not true: could be Surface pen
      return e.touches[0].touchType !== "stylus" 
    },
    drawToPoint ({ x, y }) {
      if (this.prevPoint.x !== -1) { // start of stroke, don't connect previous points
        this.traceLineTo(x, y);
        this.ctx.stroke();
      }
      this.prevPoint = { x, y };
    },
    traceLineTo (x, y) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.prevPoint.x, this.prevPoint.y);
      this.ctx.lineTo(x, y);
    },
    getThumbnail () {
      return new Promise(async (resolve) => {
        this.bgCanvas.height = this.bgCanvas.scrollHeight;
        this.bgCanvas.width = this.bgCanvas.scrollWidth;
        if (this.imageBlob) { // has a background image
          const src = URL.createObjectURL(this.imageBlob);
          await this.displayImageAsBackground(src);
        } else {
          this.bgCtx.fillStyle = `rgb(${62}, ${66}, ${66})`;
          this.bgCtx.fillRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);
        }
        this.$_drawStrokesInstantly2();
        this.bgCanvas.toBlob((thumbnail) => resolve(thumbnail));
      })
    },
    resizeBlackboard () {
      const { BlackboardWrapper } = this.$refs;
      BlackboardWrapper.style.height = "unset" // To reset the blackboard height when the user retries to make video after previewing
      const availableHeight = window.innerHeight - navbarHeight;
      const offlineHeight = Math.min(BlackboardWrapper.offsetWidth * aspectRatio, availableHeight - epsilon);
      this.canvas.style.height = this.isRealtime ? `${availableHeight}px` : `${offlineHeight}px`;
      this.$_rescaleCanvas();
      this.$_drawStrokesInstantly(); 
    },
    createCustomCusor () {
      const dummyCanvas = document.createElement("canvas");
      dummyCanvas.width = 24;
      dummyCanvas.height = 24;
      const ctx = dummyCanvas.getContext("2d");
      ctx.fillStyle = this.isPen ? this.currentTool.color: "#fff";
      ctx.font = "24px 'Material Design Icons'";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(this.isPen ? "\uF64F": "\uF1FE", 12, 12);
      const dataURL = dummyCanvas.toDataURL("image/png");
      this.$refs.FrontCanvas.style.cursor = "url(" + dataURL + ") 0 24, auto";
    }
  }
};
</script>

<style scoped>
.blackboard {
  position: relative;
  z-index: 5;
}
.blackboard-wrapper {
  position: relative; 
  z-index: -1;
}
.front-canvas {
  width: 100%;
  height: 1px;
  background-color: transparent;
  display: block;
}
.back-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgb(62, 66, 66);
  z-index: -1;
  display: block;
}
</style>
