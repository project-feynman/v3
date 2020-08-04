<template>
  <div :class="['blackboard', isFullScreen ? 'blackboard-fullscreen' : '']" id="blackboard" elevation="1">
    <slot name="canvas-toolbar"
      :currentTool="currentTool"
      :isFullScreen="isFullScreen"
      :changeTool="changeTool"
      :handleImageFile="handleImageFile"
      :resetBoard="resetBoard"
      :toggleFullScreen="toggleFullScreen"
      :setTouchDisabled="setTouchDisabled"
      :touchDisabled="touchDisabled"
    >

    </slot>
    <div ref="BlackboardWrapper" class="blackboard-wrapper">
      <canvas ref="FrontCanvas" class="front-canvas" data-qa="front-canvas"
        @touchstart="e => touchStart(e)"
        @touchmove="e => touchMove(e)"
        @touchend="e => touchEnd(e)"
        @mousedown="e => mouseDown(e)"
        @mousemove="e => mouseMove(e)"
        @mouseup="e => mouseUp(e)"
      ></canvas>
      <canvas ref="BackCanvas" class="back-canvas"></canvas>
    </div>
  </div>
</template>

<script>
/**
 * A HTML canvas that supports drawing with stylus/touch/mouse. 
 * 
 * Note that the local array and client array can deviate by 1 stroke (represents lag for example in the case of a realtime blackboard)
 *   localStrokesArray ahead: realtime database hasn't updated 
 *   clientStrokesArray ahead: client wants to add a stroke programmaticaly on the canvas
 * 
 * Maintains the invariant that the UI exactly reflects the strokesArray (see proof):
 * 
 * strokesArray => UI:
 *     case 1: a new stroke is pushed to `strokesArray`
 *         The watcher will draw it onto <canvas/> * and call `localStrokesArray.push(newStroke)`. 
 * 
 *     case 2: `strokesArray becomes empty
 *         The watcher wipes the <canvas/> and calls `localStrokesArray = []`.
 * 
 *     Note that mutating / deleting existing strokes are both disallowed (which will be enforced by an ADT later).
 * 
 * UI => strokesArray:
 *     No matter how the user draws, `saveStrokeThenReset()` is called:
 *         1. $emit("stroke-drawn", newStroke) // so the client's `strokesArray` will be updated via v-model.
 *         2. localStrokesArray.push(newStroke) // so when the above change propagates back down, the strokesArray watcher ignores it. 
 * 
 * Therefore, strokesArray <=> UI. 
 */
import BlackboardToolBar from "@/components/BlackboardToolBar.vue";
import CanvasDrawMixin from "@/mixins/CanvasDrawMixin.js";
import { BlackboardTools, RecordState, navbarHeight, toolbarHeight, aspectRatio } from "@/CONSTANTS.js";
import { isIosSafari } from "@/helpers.js";

export default {
  props: {
    strokesArray: {
      type: Array,
      required: true
    },
    isRealtime: Boolean,
    currentTime: {
      type: Number,
      default: () => 0
    }
  },
  mixins: [
    CanvasDrawMixin
  ],
  components: { 
    BlackboardToolBar
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
      touchDisabled: true, 
      localStrokesArray: [...this.strokesArray], // ...creates a real copy, rather than an alias
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
      imageBlob: null,
      isFullScreen: false
    }
  },
  computed: {
    imageBlobUrl () {
      return this.imageBlob ? URL.createObjectURL(this.imageBlob) : "";
    },
    isStrokeEraser () {
      return this.currentTool.type === BlackboardTools.STROKE_ERASER;
    },
    isNormalEraser () {
      return this.currentTool.type === BlackboardTools.NORMAL_ERASER;
    },
    isPen () {
      return this.currentTool.type === BlackboardTools.PEN;
    }
  },
  watch: {
    /**
     * Ensures `strokesArray => UI`, that is whenever the client mutates the `strokesArray` prop, we update <canvas/> accordingly`. 
     * 
     * Note we must ignore the case where (n == this.localStrokesArray.length)
     * because it means that user drew on canvas --> emits event --> client changes --> triggers our own watch hook
     */
    strokesArray () {
      const n = this.strokesArray.length; 
      if (n === 0) {
        this.wipeUI(); 
        this.localStrokesArray = [];
      } else if (n - this.localStrokesArray.length === 1) { 
        const newStroke = this.strokesArray[n-1];
        this.$_drawStroke(newStroke, this.$_getPointDuration(newStroke));
        this.localStrokesArray.push(newStroke);
      } 
      this.checkRepInvariant(); 
    }
  },
  mounted () {
    this.initializeCanvas();
    document.fonts.ready.then(this.createCustomCusor); // since cursor uses material icons font, load it after fonts are ready
    window.addEventListener("resize", this.resizeBlackboard, false); 
    this.$emit("mounted", { 
      getThumbnailBlob: this.getThumbnailBlob,
    }); 
  },
  destroyed () {
    window.removeEventListener("resize", this.resizeBlackboard);
  },
  methods: {
    /**
     * Note `localStrokesArray` can be arbitrarily ahead of `strokesArray`. For example, 
     * if the user draws 5 strokes quickly, but the client is a realtime blackboard 
     * that has to upload those 5 strokes to Firestore, then until those documents are uploaded,
     * `strokesArray` and `localStrokesArray` will differ by 5. 
     */
    checkRepInvariant () {
      if (this.strokesArray.length - this.localStrokesArray.length > 1) {
        throw new Error(
          `Rep invariant broken: external, internal lengths are ${this.strokesArray.length}, ${this.localStrokesArray.length}`
        );
      }
    },
    // UI => strokesArray
    saveStrokeThenReset (e) {
      e.preventDefault()
      if (this.currentStroke.points.length === 0) return;  // user is touching the screen despite that touch is disabled
      this.currentStroke.endTime = Number(this.currentTime.toFixed(1));
      this.localStrokesArray.push(this.currentStroke);
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
    initializeCanvas () {
      this.canvas = this.$refs.FrontCanvas;
      this.bgCanvas = this.$refs.BackCanvas;
      this.ctx = this.canvas.getContext("2d");
      this.bgCtx = this.bgCanvas.getContext("2d");
      this.resizeBlackboard();
      this.$_drawStrokesInstantly();
    },
    changeTool (tool) {
      this.currentTool = tool;
      this.ctx.globalCompositeOperation = (this.isNormalEraser || this.isStrokeEraser) ? // isStrokeEraser now erases in the back like a normal eraser
        "destination-out" : "source-over";
      this.createCustomCusor();
    },
    async resetBoard () {
      this.wipeUI();
      this.resetVariables(); 
      this.$emit("board-reset");
    },
    wipeUI () {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.bgCtx.clearRect(0, 0, this.bgCanvas.scrollWidth, this.bgCanvas.scrollHeight); // scroll width safer I think
    },
    resetVariables () {
      this.localStrokesArray = [];
      this.prevPoint = { 
        x: -1, 
        y: -1 
      };
      this.imageBlob = null;
    },
    /**
     * By design, Handles the case if `imageFile` is empty.
     */
    handleImageFile (e) {
      const imageFile = e.target.files[0]; 
      if (!imageFile) return; 
      if (imageFile.type.split("/")[0] !== "image") {
        this.$root.$emit("show-snackbar", "Error: only image files are supported for now.");
      } else {
        this.displayImageFile(imageFile);
      }
    },
    /**
     * TODO: Is imageFile a Blob or File type? 
     */
    displayImageFile (imageFile) {
      this.imageBlob = imageFile; 
      this.$emit("update:bgImageBlob", this.imageBlob);
      this.$_renderBackground(this.imageBlobUrl);
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
      // TODO: ensure commenting out the below does not re-introduce the pencil offset bug
      if (this.$_rescaleCanvas()) {
        this.$_drawStrokesInstantly();
      }
      this.$_setStyle(this.currentTool.color, this.currentTool.lineWidth);
    },
    touchStart (e) {
      if (this.isNotValidTouch(e)) return; 
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
      if (this.isNotValidTouch(e)) return;  
      if (this.isStrokeEraser) this.eraseStrokesWithinRadius(e); 
      else this.drawToPointAndSave(e);  
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
      if (!this.isHoldingLeftClick) return; 
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
    drawToPointAndSave (e, isMouse) {
      e.preventDefault();
      if (isMouse) { 
        this.currPoint = { 
          x: e.offsetX, 
          y: e.offsetY 
        }; 
      } else { 
        this.getTouchPos(e); // mutates this.currPoint
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
        eraserCenter = { 
          x: e.offsetX, 
          y: e.offsetY 
        };
      } else {
        const finger1 = e.touches[0];
        const { left, top } = this.canvas.getBoundingClientRect();
        eraserCenter = {
          x: finger1.pageX - left - window.scrollX,
          y: finger1.pageY - top - window.scrollY
        };
      }
      for (let i = 0; i < this.strokesArray.length; i++) {
        const stroke = this.strokesArray[i];
        // don't undo eraser strokes
        if (stroke.wasErased || stroke.isErasing) {  
          continue;
        }
        for (const point of stroke.points) {
          const deltaX = eraserCenter.x - point.unitX * this.canvas.width;
          const deltaY = eraserCenter.y - point.unitY * this.canvas.height;
          const radius = 10; 
          if (Math.sqrt(deltaX**2 + deltaY**2) < radius) {
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
        lineWidth: stroke.lineWidth + 2,
        points: stroke.points
      };
      this.$_drawStroke(antiStroke);
      this.localStrokesArray.push(antiStroke);
      this.$emit("stroke-drawn", antiStroke);
    },
    getTouchPos (e) {
      const finger1 = e.touches[0];
      const { left, top } = this.canvas.getBoundingClientRect();
      this.currPoint.x = finger1.pageX - left - window.scrollX;
      this.currPoint.y = finger1.pageY - top - window.scrollY;
    },
    isNotValidTouch (e) {
      if (e.touches.length !== 1) return true; // multiple fingers not allowed
      return this.isFinger(e) && this.touchDisabled;
    },
    isApplePencil (e) {
      return e.touches[0].touchType === "stylus";
    },
    isFinger (e) { // not true: could be Surface pen
      return e.touches[0].touchType !== "stylus";
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
    /**
     * Generates a thumbnail by: 
     *   1. Render the background image / grey background on the back canvas 
     *   2. Then draw on the strokes on the back canvas as well
     * 
     *   this implementation suffers from edge cases: 
     *   If eraser strokes are ignored, then strokes covered by the normal eraser will then be visible when rendered as a thumbnail
     *   I tried not using a background color, but then the white strokes will be invisible
     *   I tried not ignoring eraser strokes, but then the eraser strokes will damage not only the strokes but the background as well
     */
    getThumbnailBlob () {
      return new Promise(async resolve => {
        if (this.imageBlob) { // has a background image
          await this.$_renderBackground(this.imageBlobUrl);
        } else {
          this.bgCtx.fillStyle = "rgb(62, 66, 66)";
          this.bgCtx.fillRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);
        }
        this.$_drawStrokesInstantly(this.bgCtx);
        // TODO: remove this quickfix (first introduced to avoid double drawing thumbnail)
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.bgCanvas.toBlob(thumbnail => resolve(thumbnail));
      })
    },
    resizeBlackboard () {
      const { BlackboardWrapper } = this.$refs;
      BlackboardWrapper.style.height = "unset" // To reset the blackboard height when the user retries to make video after previewing
      const fullScreenHeight = window.innerHeight - toolbarHeight;
      const realtimeHeight = fullScreenHeight - navbarHeight;
      const offlineHeight = Math.min(BlackboardWrapper.offsetWidth * aspectRatio, realtimeHeight);
      this.canvas.style.height = this.isFullScreen ? `${fullScreenHeight}px` : (this.isRealtime ? `${realtimeHeight}px` : `${offlineHeight}px`);

      // below is necessary even though the same rescale logic resides in "startNewStroke()"
      // otherwise the existing strokes will be out of scale until the another stroke is drawn
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
    },
    async toggleFullScreen () {
      this.isFullScreen = !this.isFullScreen;
      await this.$nextTick();
      this.resizeBlackboard();
      window.scrollTo(0, document.body.scrollHeight) // to prevent being scrolled to the middle of page when Exiting the fullscreen
    },
    setTouchDisabled (newBoolean) {
      this.touchDisabled = newBoolean; 
    }
    // convertAllStrokesToBeInitialStrokes () {
    //   for (const stroke of this.strokesArray) {
    //     [stroke.startTime, stroke.endTime] = [0, 0];
    //   }
    // },
  }
};
</script>

<style scoped>
.blackboard {
  position: relative;
  z-index: 5;
}
.blackboard.blackboard-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  z-index: 10;
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
