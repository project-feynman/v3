<template>
  <div class="blackboard" elevation="1">
    <slot name="canvas-toolbar"
      :isFullScreen="isFullScreen"
      :handleImageFile="handleImageFile"
      :resetBoard="resetBlackboard"
      :toggleFullScreen="toggleFullScreen"
    >

    </slot>

    <div ref="BlackboardWrapper" class="blackboard-wrapper" style="position: relative;">
      <canvas ref="FrontCanvas" class="front-canvas">

      </canvas>

      <canvas ref="BackCanvas" class="back-canvas">

      </canvas>
    </div>
  </div>
</template>

<script>
/**
 * A HTML canvas that supports drawing with stylus/touch/mouse.
 * 
 * NOTE: this is NOT safe for concurrency: if `strokesArray` is reset while the user is still drawing,
 * then the canvas UI will diverge from `strokesArray` (part of the stroke will be cut-off).
 * However, this issue is minor in most practical situations, so will be ignored for now. 
 * 
 * Maintains the invariant that the UI exactly reflects the strokesArray (see proof):
 * 
 * Start state: initially, strokesArray is empty, and the canvas is blank
 * Transition states: 
 *   1. `strokesArray` gets modified 
 *   2. The user draws a stroke on the the canvas
 *   3. The canvas resizes 
 * 
 * 1. strokesArray => UI:
 *     case 1: a new stroke is pushed to `strokesArray`
 *         The watcher will draw it onto <canvas/> * and call `localStrokesArray.push(newStroke)`. 
 * 
 *     case 2: `strokesArray` becomes empty
 *         The watcher wipes the <canvas/> and calls `localStrokesArray = []`.
 * 
 *     Note that mutating / deleting existing strokes are both disallowed (which will be enforced by an ADT later).
 * 
 * 2. UI => strokesArray:
 *     No matter how the user draws, `handleEndOfStroke()` is called:
 *     DANGER (TODO: refactor): eraser strokes does NOT pass `handleEndOfStroke()`
 *         1. $emit("stroke-drawn", newStroke) // so the client's `strokesArray` will be updated via v-model.
 *         2. localStrokesArray.push(newStroke) // so when the above change propagates back down, the strokesArray watcher ignores it. 
 * 
 * 3. The canvas resizes
 *      HTML <canvas/> automatically wipes. However, our resize listener will 
 *      re-render all the strokes on `strokesArray`. 
 * 
 * Therefore, strokesArray <=> UI. 
 */
import BlackboardToolBar from "@/components/BlackboardToolBar.vue";
import CanvasDrawMixin from "@/mixins/CanvasDrawMixin.js";
import { BlackboardTools, MASSIVE_MODE_DIMENSIONS } from "@/CONSTANTS.js";
import { getRandomId, isIosSafari } from "@/helpers.js";
import { mapState } from "vuex";
import _ from "lodash";


export default {
  props: {
    strokesArray: {
      type: Array,
      required: true
    },
    currentTime: {
      type: Number,
      default: () => 0
    },
    backgroundImage: {
      type: Object
      // don't set `required` to true yet to avoid minor crashes
    },
    width: {
      type: Number,
      required: true
    },
    height: {
      type: Number,
      required: true
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

      // `[...strokesArray]` creates a fresh copy rather than an alias
      localStrokesArray: [...this.strokesArray], 
      currentStroke: { 
        points: [] 
      },
      // initialize `prevPoint` to an invalid coordinate to signal that it's not defined initially
      prevPoint: { 
        x: -1, 
        y: -1 
      },
      imageBlob: null,
      isFullScreen: false
    }
  },
  computed: {
    ...mapState([
      "user",
      "currentTool", 
      "onlyAllowApplePencil",
      "canvasDimensions",
      "isBoardFullscreen"
    ]),
    sessionID () { return this.$store.state.session.currentID; },
    imageBlobUrl () { return this.imageBlob ? URL.createObjectURL(this.imageBlob) : ""; },
    isPen () { return this.currentTool.type === BlackboardTools.PEN; },
    isNormalEraser () { return this.currentTool.type === BlackboardTools.NORMAL_ERASER; }
  },
  watch: {
    /**
     * Ensures `strokesArray => UI`, that is whenever the client mutates the `strokesArray` prop, we update <canvas/> accordingly`. 
     * 
     * Note we ignore the case where (n == this.localStrokesArray.length)
     * because it means that user drew on canvas --> emits event --> client changes --> triggers our own watch hook
     * 
     * CRITICAL ASSUMPTION: strokesArray can be pushed singularly and deleted in batch, but can never be modified in place. 
     */
    strokesArray () {
      let m = this.localStrokesArray.length; 
      let n = this.strokesArray.length; 
      if (m === n) { 
        // DO NOTHING: I created the stroke in by drawing and the client only knows about it now
      }
      else if (m < n) {
        for (let i = m; i < n; i++) {
          const newStroke = this.strokesArray[i];
          this.$_drawStroke(
            { 
              points: newStroke.points,
              color: newStroke.color,
              lineWidth: newStroke.lineWidth * (this.canvas.scrollWidth / 1000),
              isErasing: newStroke.isErasing
            },
            newStroke.startTime !== newStroke.endTime ? this.$_getPointDuration(newStroke) : null // instantly or smoothly
          );
          this.localStrokesArray.push(newStroke);
        }
      }
      else { 
        // [WHY USE DEBOUNCE]: if number of strokes > 500, then deletion happens in multiple batches that can 
        // resolve very close to each other, and the resizeBlackboard()
        // which draws hundreds of strokes instantly overfloods the event loop 
        // and causes strange remnant strokes to linger on the board
        const one_second_in_milliseconds = 1000; 
        const wipeThenDraw = _.debounce(() => {
          console.log("debounced board reset");
          // reset component
          this.wipeUI(); 
          this.localStrokesArray = [];
          this.prevPoint = { 
            x: -1, 
            y: -1 
          };

          // draw to current progress
          this.resizeBlackboard(); 
        }, one_second_in_milliseconds);
        wipeThenDraw(); 
      }
    },
    /**
     * Updates the background image. 
     * 
     * Ensures <ClientComponent/> => <BlackboardCoreDrawing/>.
     * For <BlackboardCoreDrawing/> => <ClientComponent/>, see the method "setImageAsBackground" 
     * 
     * @param downloadURL for image on Firebase storage 
     * @param blob the blob representing the image
     * @effect mutates the background canvas by displaying the image,
     *         filling its height and width (and not necessarily preserving aspect ratio)
     * 
     * TODO: refactor with composition API
     */
    backgroundImage ({ downloadURL, blob }) {
      this.bgCtx.clearRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);
      if (downloadURL || blob) {
        this.$_renderBackground(
          blob ? URL.createObjectURL(blob) : downloadURL
        );
      }
    }
  },
  mounted () {
    this.initializeCanvas();

    // explicitly expose `getThumbnailBlob` to client components that use <BlackboardCoreDrawing/>
    this.$emit("mounted", { 
      getThumbnailBlob: this.getThumbnailBlob,
    });
  },
  methods: {
    initializeCanvas () {
      this.canvas = this.$refs.FrontCanvas;
      this.bgCanvas = this.$refs.BackCanvas;
      this.ctx = this.canvas.getContext("2d");
      this.bgCtx = this.bgCanvas.getContext("2d");

      this.resizeBlackboard(); // rsizeBlackboard also re-renders everything
    },
    async resetBlackboard () {
      this.wipeUI();
      this.resetVariables(); 
      this.$emit("board-reset");
    },
    wipeUI () {
      this.ctx.clearRect(0, 0, this.canvas.scrollWidth, this.canvas.scrollHeight);
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
     * Generates a thumbnail by: 
     *   1. Render the background image / grey background on the back canvas 
     *   2. Then draw on the strokes on the back canvas as well
     * 
     *  Note that the thumbnail must be based only on ONE single canvas, whereas when we normally display the blackboard
     *  there are TWO canvases. 
     * 
     *   This implementation suffers from edge cases: 
     *     If eraser strokes are ignored, then strokes covered by the normal eraser will then be visible when rendered as a thumbnail
     *     I tried not using a background color, but then the white strokes will be invisible
     *     I tried not ignoring eraser strokes, but then the eraser strokes will damage not only the strokes but the background as well
     */
    getThumbnailBlob () {
      return new Promise(async resolve => {
        // TODO: better prop design for `backgroundImage = {};`
        // should it be null? ask questions in the community. You need to ask questions. 
        if (this.backgroundImage) {
          const { blob, downloadURL } = this.backgroundImage;
          await this.$_renderBackground(
            blob ? URL.createObjectURL(blob) : downloadURL
          );
        } else {
          // make the background black-grey
          this.bgCtx.fillStyle = "rgb(62, 66, 66)";
          this.bgCtx.fillRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);
        }
        // now draw the strokes
        this.$_drawStrokesInstantlyButNormalizeLineWidth(this.bgCtx);

        // TODO: remove this quickfix (first introduced to avoid double drawing thumbnail)
        // this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.bgCanvas.toBlob(thumbnail => resolve(thumbnail));
      })
    },
    /**
     * Correctly readjusts the external and internal dimensions of the canvas.
     * Because the HTML canvas wipes everytime it's resized, 
     * the function has to also re-render all the pens strokes and background image. 
     */
    resizeBlackboard () {      
      const changeInternalAndExternalDimensionsOfBlackboard = ({ newWidth, newHeight }) => {
        this.canvas.style.width = `${newWidth}px`; 
        this.canvas.style.height = `${newHeight}px`;
        this.canvas.style.scrollWidth = `${newWidth}px`;
        this.canvas.style.scrollHeight = `${newHeight}px`;

        this.bgCanvas.style.width = `${newWidth}px`; 
        this.bgCanvas.style.height = `${newHeight}px`;
        this.bgCanvas.style.scrollWidth = `${newWidth}px`;
        this.bgCanvas.style.scrollHeight = `${newHeight}px`;
      }

      const { BlackboardWrapper } = this.$refs; 
      BlackboardWrapper.style.width = "100%"; 
      BlackboardWrapper.style.height = "100%"; 

      changeInternalAndExternalDimensionsOfBlackboard({
        newWidth: this.width,
        newHeight: this.height
      });

      // below is necessary even though the same rescale logic resides in "startNewStroke()"
      // otherwise the existing strokes will be out of scale until the another stroke is drawn
      this.$_rescaleCanvas();
      this.$_drawStrokesInstantlyButNormalizeLineWidth();

      // re-render background
      if (!this.backgroundImage) {
        return; 
      }
      const { blob, downloadURL } = this.backgroundImage;
      if (blob || downloadURL) {
        this.$_renderBackground(
          blob ? URL.createObjectURL(blob) : downloadURL
        );
      }
    },
    // HANDLE BACKGROUND IMAGE
    /**
     * By design, Handles the case if `imageFile` is empty.
     * 
     *  Support all image file types and .pdf extension files 
     * 
     * TODO:
     */
    async handleImageFile (e) {
      const uploadedFile = e.target.files[0];
      if (!uploadedFile) return;
      let imageFile;  
      if (uploadedFile.type.split("/")[0] === "image") {
        imageFile = uploadedFile; 
      } else if (uploadedFile.type.split("/")[1] === "pdf") {
        imageFile = await this.convertPdfToImageFile(uploadedFile);
      } else {
        this.$root.$emit("show-snackbar", "Error: only image or pdf files are supported for now.");
        return; 
      }
      this.$_renderBackground(URL.createObjectURL(imageFile));
      this.$emit("update:background-image", { blob: imageFile });
    },
    async toggleFullScreen () {
      this.isFullScreen = !this.isFullScreen;
      await this.$nextTick();
      this.resizeBlackboard();
      window.scrollTo(0, document.body.scrollHeight) // to prevent being scrolled to the middle of page when Exiting the fullscreen
    },
    setTouchDisabled (newBoolean) {
      this.$store.commit("SET_ONLY_ALLOW_APPLE_PENCIL", newBoolean); 
    },
    /**
     * Get (x, y) position of stylus/touch/mouse
     */
    getStylusOrFingerOrMousePosition(e) {
      // mouse
      if (this.isHoldingLeftClick) {
        return { 
          x: e.offsetX, 
          y: e.offsetY 
        };
      } 
      // stylus/finger
      else {
        const { left, top } = this.canvas.getBoundingClientRect();
        return {
          x: e.touches[0].pageX - left - window.scrollX,
          y: e.touches[0].pageY - top - window.scrollY
        };
      }
    },
    normalizePoint ({ x, y }) {
      return {
        unitX: x / this.canvas.width,
        unitY: y / this.canvas.height
      };
    }
  }
};
</script>

<style scoped>
/* without pan-x pan-y sometimes user accidentally zooms on Safari when toggling fullscreen which is annoying */
.front-canvas {
  background-color: transparent;
  display: block;
  z-index: 2;
  /* Position relative is necessary for some reason */
  position: relative; 
  touch-action: pan-x pan-y;
}
.back-canvas {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 0;
  display: block;
  background-color: rgb(46, 49, 49);
  touch-action: pan-x pan-y;
}
</style>
