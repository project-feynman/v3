<template>
  <div class="blackboard" :elevation="isRealtime ? '0' : '1'">
    <component :is="isRealtime ? 'TheAppBar' : 'div'">
      <BlackboardToolBar
        :currentState="currentState"
        :currentTool="currentTool"
        :color="color"
        :isRealtime="isRealtime"
        @tool-select="({ tool, color }) => selectTool(tool, color)"
        @wipe-board="resetBoard()"
        @record-state-change="(newState) => handleRecordStateChange(newState)"
        @image-selected="(imageFile) => saveAndDisplayImage(imageFile)"
      >
        <template v-slot:initial-buttons>
          <!-- <LiveBoardAudio :roomId="blackboardId"/> -->
        </template>
        <!-- <BasePopupButton v-if="isRealtime" actionName="Save video"
          :disabled="!hasUploadedAudio"
          :inputFields="['title', 'description']"
          @action-do="payload => handleSaving(payload)"
        >
          <v-btn :loading="!hasUploadedAudio" :disabled="!hasUploadedAudio" class="white--text">
            Upload video
          </v-btn>
        </BasePopupButton> -->
      </BlackboardToolBar>
    </component>
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
    <AudioRecorder v-show="false" ref="AudioRecorder"
      @file-uploaded="(audio) => saveFileReference(audio)"
      @audio-recorded="emitVideoData()"
    />
  </div>
</template>

<script>
import db from "@/database.js";
import AudioRecorder from "@/components/AudioRecorder.vue";
import TheAppBar from "@/components/TheAppBar.vue";
import BlackboardToolBar from "@/components/BlackboardToolBar.vue";
import BasePopupButton from "@/components/BasePopupButton.vue";
import LiveBoardAudio from "@/components/LiveBoardAudio.vue";
import CanvasDrawMixin from "@/mixins/CanvasDrawMixin.js";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import { BlackboardTools, RecordState, navbarHeight, aspectRatio, epsilon } from "@/CONSTANTS.js";

export default {
  props: {
    blackboardId: String,
    isRealtime: Boolean,
    visible: Boolean,
  },
  mixins: [
    CanvasDrawMixin, 
    DatabaseHelpersMixin
  ],
  components: { 
    AudioRecorder, 
    BasePopupButton,
    BlackboardToolBar, 
    TheAppBar, 
    LiveBoardAudio
  },
  data () {
    return {
      loading: true,
      blackboard: {},
      canvas: null,
      ctx: null,
      bgCanvas: null,
      bgCtx: null,
      color: "white",
      lineWidth: 2.5,
      currentTool: BlackboardTools.PEN,
      touchDisabled: false,
      strokesArray: [],
      currentStroke: { 
        points: [] 
      },
      imageUrl: "",
      imageBlob: null,
      timer: null,
      currentTime: 0,
      currPoint: { 
        x: 0, 
        y: 0 
      },
      prevPoint: { 
        x: -1, 
        y: -1 
      },
      mousedown: 0, // necessary to know if user is holding left click while dragging the mouse
      unsubscribe: null,
      currentState: "",
      audioUrl: "",
      hasUploadedAudio: false,
      thumbnailBlob: null
    }
  },
  computed: {
    user () { 
      return this.$store.state.user; 
    },
    classRef () { 
      const { class_id } = this.$route.params;
      return db.collection("classes").doc(class_id); 
    },
    blackboardRef () { 
      return this.classRef.collection("blackboards").doc(this.blackboardId); 
    },
    strokesRef () { 
      return this.blackboardRef.collection("strokes"); 
    },
    isStrokeEraser () {
      return this.currentTool === BlackboardTools.STROKE_ERASER;
    },
    isNormalEraser () {
      return this.currentTool === BlackboardTools.NORMAL_ERASER;
    },
    isPen () {
      return this.currentTool === BlackboardTools.PEN;
    }
  },
  watch: {
    blackboardId: {
      handler: "initData",
      immediate: true
    },
    blackboard (newVal) {
      let imageSrc;
      if (this.imageUrl !== newVal.imageUrl) { // ImageURL changed, so fetch the image
        this.imageUrl = newVal.imageUrl;
        imageSrc = this.imageUrl;
      } else {
        try { 
          imageSrc = URL.createObjectURL(this.imageBlob); // means we already have the image blob locally
        } catch { 
          imageSrc = this.imageUrl; 
        }
      }
      this.displayImageAsBackground(imageSrc);
    },
    currentTool () {
      this.customCursor();
      this.ctx.globalCompositeOperation = (this.isNormalEraser)
        ? "destination-out"
        : "source-over";
      this.lineWidth = (this.isNormalEraser) ? 25 : 2.5;
      if (this.isStrokeEraser) {
        this.$root.$emit("show-snackbar", 
          "If the stroke eraser doesn't seem to detect properly, try tracing it slowly along the stroke you want to erase."
        );
      }
    },
    color () { 
      this.customCursor(); 
    },
    visible () { 
      this.resizeBlackboard(); 
    }
  },
  mounted () {
    this.canvas = this.$refs.FrontCanvas;
    this.ctx = this.canvas.getContext("2d");
    this.bgCanvas = this.$refs.BackCanvas;
    this.bgCtx = this.bgCanvas.getContext("2d");
    this.resizeBlackboard();
    window.addEventListener("resize", this.resizeBlackboard, false); 
    document.fonts.ready.then(() => this.customCursor()); // since cursor uses material icons font, load it after fonts are ready
    if (this.isRealtime) { 
      this.keepSyncingBoardWithDb(); 
    }
  },
  beforeDestroy() { 
    if (this.unsubscribe) { this.unsubscribe(); } 
  },
  destroyed () {
    window.removeEventListener("resize", this.resizeBlackboard);
  },
  methods: {
    selectTool (tool, color) {
      this.currentTool = tool;
      if (color) { 
        this.color = color; 
      }
    },
    async initData () {
      // no need to reset data, just reset variables and UI as it's only useful when switching between different blackboards
      this.resetVariables();
      this.wipeBoard();
      this.currentState = RecordState.PRE_RECORD;
      if (this.isRealtime) {
        this.loading = true;
        if (!this.blackboardId) { return; }
        this.unsubscribe = await this.$_listenToDoc(this.blackboardRef, this, "blackboard");
        if (this.unsubscribe) { this.unsubscribe(); }
        this.keepSyncingBoardWithDb();
      }
      this.initCopyAndPasteImage()
    },
    keepSyncingBoardWithDb () {
      this.unsubscribe = this.strokesRef.orderBy("strokeNumber").onSnapshot((snapshot) => {
        if (snapshot.docs.length === 0) {
          this.wipeBoard();
          this.resetVariables(); // no need to wipe database again
        }
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const newStroke = change.doc.data();
            if (this.strokesArray.length < newStroke.strokeNumber) { // check if local strokes and db strokes are in sync
              if (this.loading) { 
                this.$_drawStroke(newStroke); // initial render: catch up to current state - draw quickly
              } else {
                this.$_drawStroke(newStroke, this.$_getPointDuration(newStroke)); 
              } 
              this.strokesArray.push(newStroke);
            }
          }
        });
        this.loading = false;
      });
    },
    uploadAudio () {
      return new Promise(async (resolve) => {
        await this.$refs.AudioRecorder.uploadRecording();
        resolve();
      })
    },
    async resetBoard () {
      if (this.isRealtime) {
        const strokeDeleteRequests = [];
        this.strokesArray.forEach(stroke => {
          strokeDeleteRequests.push(this.strokesRef.doc(`${stroke.strokeNumber}`).delete());
        })
        const backgroundResetRequest = this.blackboardRef.update({ imageUrl: "" });
        await Promise.all([...strokeDeleteRequests, backgroundResetRequest]);
      }
      this.wipeBoard(); // UI
      this.resetVariables(); // local state
    },
    wipeBoard () {
      if (!this.ctx) { return; }
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.bgCtx.clearRect(0, 0, this.bgCanvas.scrollWidth, this.bgCanvas.scrollHeight); // scroll width safer I think
    },
    resetVariables () {
      this.strokesArray = [];
      this.prevPoint = { x: -1, y: -1 };
      this.currentTime = 0;
      this.imageBlob = null;
      this.imageUrl = "";
    },
    async saveAndDisplayImage (blob) { // TODO: this was a quick-fix for image files
      if (blob === null) return; 
      this.imageBlob = blob;
      if (!this.isRealtime) {
        this.imageUrl = URL.createObjectURL(this.imageBlob);
        this.displayImageAsBackground(this.imageUrl);
      } else {
        const imageUrl = await this.$_saveToStorage(`images/${this.blackboardId}`, blob);
        this.blackboardRef.update({ imageUrl });
        this.imageUrl = imageUrl; // store locally
      }     
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
    startTimer () {
      this.currentTime = 0;
      this.timer = setInterval(() => this.currentTime += 0.1, 100);
    },
    stopTimer () { 
      clearInterval(this.timer); 
    },
    convertAndSavePoint (x, y) {
      const unitX = parseFloat(x / this.canvas.width).toFixed(4);
      const unitY = parseFloat(y / this.canvas.height).toFixed(4);
      this.currentStroke.points.push({ unitX, unitY });
    },
    startNewStroke (e) {
      this.currentStroke.strokeNumber = this.strokesArray.length + 1;
      this.currentStroke.startTime = Number(this.currentTime.toFixed(1));
      this.currentStroke.color = this.color;
      this.currentStroke.lineWidth = this.lineWidth;
      this.currentStroke.isErasing = this.isNormalEraser;

      this.$_rescaleCanvas();
      e.preventDefault(); // not put in the beginning because sometimes we allow scrolling 
      this.$_setStyle(this.color, this.lineWidth);
      if (this.currentState === RecordState.MID_RECORD) {
        this.startTime = this.currentTime.toFixed(1);
      }
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
      this.mousedown = 1;
      if (this.isStrokeEraser) { 
        this.eraseStrokesWithinRadius(e); 
      } else {
        this.startNewStroke(e);
        const isMouse = true;
        this.drawToPointAndSave(e, isMouse);
      }
    },
    mouseMove (e) {
      if (this.mousedown !== 1) { return; }
      if (this.isStrokeEraser) { 
        this.eraseStrokesWithinRadius(e); 
      } else {
        const isMouse = true;
        this.drawToPointAndSave(e, isMouse);
      }
    },
    mouseUp (e) {
      this.mousedown = 0;
      this.saveStrokeThenReset(e);
    },
    saveStrokeThenReset (e) {
      e.preventDefault()
      if (this.currentStroke.points.length === 0) { return; }  // user is touching the screen despite that touch is disabled
      this.currentStroke.endTime = Number(this.currentTime.toFixed(1));
      this.strokesArray.push(this.currentStroke);
      if (this.isRealtime) {
        this.strokesRef.doc(`${this.strokesArray.length}`).set(this.currentStroke); // 1st stroke = 1
      }
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
        this.currPoint = { x: e.offsetX, y: e.offsetY }; 
      } else { 
        this.getTouchPos(e); 
      }
      this.convertAndSavePoint(this.currPoint.x, this.currPoint.y);
      this.drawToPoint(this.currPoint);
    },
    eraseStrokesWithinRadius (e) {
      e.preventDefault();
      let eraserCenter = {};
      if (this.mousedown === 1) {
        eraserCenter = { x: e.offsetX, y: e.offsetY };
      } else {
        const finger1 = e.touches[0];
        const { left, top } = this.canvas.getBoundingClientRect();
        eraserCenter.x = finger1.pageX - left - window.scrollX;
        eraserCenter.y = finger1.pageY - top - window.scrollY;
      }
      const radius = 10;
      const idxOfStrokesToErase = []
      for (let i = 0; i < this.strokesArray.length; i++) {
        const stroke = this.strokesArray[i];
        for (let point of stroke.points) {
          const deltaX = eraserCenter.x - point.unitX * this.canvas.width
          const deltaY = eraserCenter.y - point.unitY * this.canvas.height
          if (radius > Math.sqrt(deltaX**2 + deltaY**2)) {
            idxOfStrokesToErase.push(i);
            break; 
          }
        }
      }
      for (let i of idxOfStrokesToErase) {
        this.strokesArray.splice(i, 1); // remove 1 element at index i
      }
      if (idxOfStrokesToErase.length > 0) {
        this.wipeBoard();
        this.$_drawStrokesInstantly();
      }
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
    isFinger (e) { 
      return e.touches[0].touchType !== "stylus" 
    },
    handleRecordStateChange (newState) {
      const { PRE_RECORD, MID_RECORD, POST_RECORD } = RecordState;
      if (newState === MID_RECORD) { 
        this.startRecording(); 
      } else if (newState === POST_RECORD) { 
        this.stopRecording(); 
      } else if (newState === PRE_RECORD) { 
        this.tryRecordAgain(); 
      } else { 
        throw `Error: blackboard state was set to an illegal value = ${newState}`;
      }
    },
    async startRecording () {
      await this.$refs.AudioRecorder.startRecording();
      this.startTimer();      
      this.currentState = RecordState.MID_RECORD;
      if (this.isRealtime) {
        this.blackboardRef.update({ 
          recordState: RecordState.MID_RECORD 
        });
      }
      this.$emit("record-start"); // let's Piazza know so it can disable the "submit post" button
    },
    stopRecording () {
      this.stopTimer();
      this.$refs.AudioRecorder.stopRecording();
      this.currentState = RecordState.POST_RECORD;
      if (this.isRealtime) {
        this.blackboardRef.update({ 
          recordState: RecordState.POST_RECORD 
        });
      }
    },
    async emitVideoData () { 
      this.thumbnailBlob = await this.createThumbnail();
      const videoData = { 
        audio: this.$refs.AudioRecorder.audio, 
        strokes: this.strokesArray,
        imageUrl: this.imageUrl
      };
      this.$emit("record-end", videoData)
    },
    tryRecordAgain () {
      this.currentTime = 0;
      this.hasUploadedAudio = false;
      // modify timestamps so last round's strokes will persist as the initial setup of this round's recording
      for (const stroke of this.strokesArray) {
        [stroke.startTime, stroke.endTime] = [0, 0];
      }
      const { PRE_RECORD } = RecordState;
      this.currentState = PRE_RECORD;
      if (this.isRealtime) {
        this.blackboardRef.update({ 
          recordState: PRE_RECORD, 
          audioUrl: "" 
        });
      }
      this.$_rescaleCanvas();
      this.$_drawStrokesInstantly(); 
    },
    saveFileReference ({ url }) {
      this.hasUploadedAudio = true;
      this.audioUrl = url;
      if (this.isRealtime) {
        this.blackboardRef.update({ audioUrl: url })
      }
      this.$emit("audio-upload-end", { 
        blackboardStrokes: this.strokesArray, 
        audioUrl: url
      });
    },
    createThumbnail () {
      return new Promise(async (resolve) => {
        // TODO: render the background image
        // if (this.imageUrl) { // has a background image
        //   await this.displayImageAsBackground(this.imageUrl);
        // }
        this.bgCanvas.height = this.bgCanvas.scrollHeight;
        this.bgCanvas.width = this.bgCanvas.scrollWidth;
        // apply the blackish background color before drawing strokes
        this.bgCtx.fillStyle = `rgb(${62}, ${66}, ${66})`;
        this.bgCtx.fillRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);
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
    customCursor () {
      const dummyCanvas = document.createElement("canvas");
      dummyCanvas.width = 24;
      dummyCanvas.height = 24;
      const ctx = dummyCanvas.getContext("2d");
      ctx.fillStyle = this.isPen ? this.color: "#fff";
      ctx.font = "24px 'Material Design Icons'";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(this.isPen ? "\uF64F": "\uF1FE", 12, 12);
      const dataURL = dummyCanvas.toDataURL("image/png");
      this.$refs.FrontCanvas.style.cursor = "url(" + dataURL + ") 0 24, auto";
    },
    handleSaving () {
      // to be implemented
    },
    // TODO: let it be an additive component for the real-time blackboard
    initCopyAndPasteImage () {
      //  document.onpaste = async (event) => {
      //   const items = (event.clipboardData || event.originalEvent.clipboardData).items; // use event.originalEvent.clipboard for newer chrome versions
      //   // Find pasted image among pasted items
      //   let blob = null;
      //   for (let i = 0; i < items.length; i++) {
      //     if (items[i].type.indexOf("image") === 0) {
      //       blob = items[i].getAsFile();
      //     }
      //   }
      //   // Load image if there is a pasted image
      //   if (blob === null) { return; }
      //   this.imageBlob = blob;
      //   if (!this.isRealtime) {
      //     const imageUrl = URL.createObjectURL(this.imageBlob);
      //     this.displayImageAsBackground(imageUrl);
      //   } else {
      //     const imageUrl = await this.$_saveToStorage(`images/${this.blackboardId}`, blob);
      //     this.blackboardRef.update({ imageUrl });
      //     this.imageUrl = imageUrl; // store locally
      //   }     
      // }
    },
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
