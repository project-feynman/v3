<template>
  <div>
    <div id="whiteboard" :outlined="!isRealtime" :elevation="isRealtime? '0' : '1'">
      <!-- Uncomment line below for an easy life debugging -->
      <!-- <p>blackboard: {{ blackboard }}</p> -->
      <!-- TODO: refactor to App.vue -->
      <v-snackbar v-model="snackbar">
        {{ snackbarMessage }}
        <v-btn @click="snackbar = false" color="accent" text>CLOSE</v-btn>
      </v-snackbar>

      <TheAppBar v-if="isRealtime" :loading="loading" page="realtime">
        <div id="realtime-toolbar">
          <BlackboardToolBar
            ref="blackboardToolbar"
            :currentState="blackboard.recordState"
            :eraserActive="eraserActive"
            :color="color"
            :isRealtime="isRealtime"
            :hasUploadedAudio="hasUploadedAudio"
            @eraser-click="newVal => eraserActive = newVal"
            @set-image="handleImage"
            @color-click="newColor => color = newColor"
            @wipe-board="resetBoard()"
            @record-state-change="newState => handleRecordStateChange(newState)"
            @video-save="payload => handleSaving(payload)"
            @animation-save="handleSaving({ title: 'No title yet', description: 'No description yet' })"
          >
            <BasePopupButton
              actionName="Save video" 
              :disabled="!hasUploadedAudio"
              :inputFields="['title', 'description']"
              @action-do="payload => handleSaving(payload)"
            >
              <BaseLoadingButton :isLoading="!hasUploadedAudio">
                Upload video
              </BaseLoadingButton>
            </BasePopupButton>
          </BlackboardToolBar>
        </div>
      </TheAppBar>

      <!-- APP BAR -->
      <div v-if="!isRealtime" id="mini-toolbar">
        <BlackboardToolBar
          ref="blackboardToolbar"
          :currentState="currentState"
          :eraserActive="eraserActive"
          :color="color"
          :isRealtime="isRealtime"
          :hasUploadedAudio="hasUploadedAudio"
          @eraser-click="status => eraserActive = status"
          @set-image="e => handleImage(e)"
          @color-click="newColor => color = newColor"
          @wipe-board="resetBoard"
          @record-state-change="newState => handleRecordStateChange(newState)"
        />
      </div>
      <!-- BLACKBOARD -->
      <div
        id="blackboard-wrapper"
        :class="isRealtime? 'realtime-canvas':''"
        v-resize="blackboardSize"
      >
        <canvas id="myCanvas"></canvas>
        <canvas id="background-canvas"></canvas>
      </div>
      <AudioRecorder
        v-show="false"
        ref="AudioRecorder"
        @record-start="currentState = recordStateEnum.MID_RECORD"
        @file-uploaded="audio => saveFileReference(audio)"
      />
    </div>
  </div>
</template>

<script>
import firebase from "firebase/app";
import "firebase/functions";
import slugify from "slugify";
import db from "@/database.js";
import AudioRecorder from "@/components/AudioRecorder.vue";
import TheAppBar from "@/components/TheAppBar.vue";
import BlackboardToolBar from "@/components/BlackboardToolBar.vue";
import BaseLoadingButton from "@/components/BaseLoadingButton.vue";
import BasePopupButton from "@/components/BasePopupButton.vue";
import CONSTANTS from "@/CONSTANTS.js";
import CanvasDrawMixin from "@/mixins/CanvasDrawMixin.js";

export default {
  props: {
    blackboardId: {
      type: String
    },
    isRealtime: Boolean,
    visible: Boolean,
    // TODO: should be encapsulated within this component
    background: String
  },
  mixins: [CanvasDrawMixin],
  components: {
    BlackboardToolBar,
    AudioRecorder,
    TheAppBar,
    BaseLoadingButton,
    BasePopupButton
  },
  data () {
    return {
      loading: true,
      blackboard: null,
      canvas: null,
      ctx: null,
      bgCanvas: null,
      bgCtx: null,
      color: "white",
      eraserActive: false,
      lineWidth: 2,
      disableTouch: false,
      stylus: false,
      allStrokes: [],
      currentStroke: [],
      imageUrl: "",
      imageBlob: null,
      timer: null,
      currentTime: 0,
      // TODO: refactor currentStroke to be an object so startTiem and endTime aren't necessary
      startTime: 0,
      endTime: null,
      touchX: null,
      touchY: null,
      mouseX: 0,
      mouseY: 0,
      mousedown: 0, // Necessary to know if user is holding left click while dragging the mouse
      unsubscribe: null,
      currentState: "",
      audioUrl: "",
      hasUploadedAudio: false,
      recordStateEnum: CONSTANTS.recordStateEnum,
      clearRectTimeout: null,
      // Refactor to App.vue
      snackbar: false,
      snackbarMessage: "",
    }
  },
  computed: {
    user () { return this.$store.state.user; },
    classId () { return this.$route.params.class_id; },
    classRef () { return db.collection("classes").doc(this.classId); },
    blackboardRef () { return this.classRef.collection("blackboards").doc(this.blackboardId); },
    strokesRef () { return this.blackboardRef.collection("strokes"); },
    bg () { return this.background; }// mini 
  },
  watch: {
    blackboardId: {
      handler: "initData",
      immediate: true
    },
    // detects when user switches from the eraser back to drawing (TODO: high surface area for bugs)
    color () {
      if (this.color != "rgb(62, 66, 66)") this.lineWidth = 2;  // eraser color stroke width is larger
      else this.lineWidth = 30; 
      this.setStyle(this.color, this.lineWidth);
    },
    blackboard (newVal) {
      // TODO: this gets triggered 2x more often than I expect, find out why
      // answer: timestamp changes on the doc;
      const { POST_RECORD } = this.recordStateEnum;
      if (newVal.recordState !== POST_RECORD || this.canvas) {
        this.enableDrawing();
      }
      let imageSrc;
      // console.log("newVal.imageUrl =", newVal.imageUrl);
      if (this.imageUrl !== newVal.imageUrl) { // ImageURL changed, so fetch the image
        this.imageUrl = newVal.imageUrl;
        imageSrc = this.imageUrl;
      } else {
        // Already have the image blob locally  
        try {
          imageSrc = URL.createObjectURL(this.imageBlob); 
        } catch {
          imageSrc = this.imageUrl;
        }
      }
      this.displayImageAsBackground(imageSrc);
    },
    currentState (oldVal, newVal) {
      if (!newVal || oldVal) return;
      const { POST_RECORD, PRE_RECORD } = this.recordStateEnum;
      if (oldVal === POST_RECORD && newVal === PRE_RECORD) {
        this.enableDrawing();
      }
    },
    eraserActive () {
      this.customCursor();
      this.canvas.getContext("2d").globalCompositeOperation = this.eraserActive
        ? "destination-out"
        : "source-over";
      this.lineWidth = this.eraserActive ? 20 : 2;
    },
    color () { this.customCursor(); },
    visible () { this.blackboardSize(); },
    bg () { this.drawBackground(this.bg); }
  },
  mounted () {
    this.canvas = document.getElementById("myCanvas");
    this.ctx = this.canvas.getContext("2d");
    setTimeout(()=>this.rescaleCanvas(true),0)
    window.addEventListener("resize", () => this.rescaleCanvas(true), false); // for mini blackboard
    this.enableDrawing();

    this.bgCanvas = document.getElementById("background-canvas");
    this.bgCtx = this.bgCanvas.getContext("2d");

    // Hack to fix drawing offset bug
    this.$nextTick(() => {
      this.$root.$emit("toggle-drawer")
      this.$nextTick(() => this.$root.$emit("toggle-drawer"));
    })
       
    // since cursor uses material icons font, load it after fonts are ready
    document.fonts.ready.then(() => this.customCursor());
    this.drawBackground(this.background);
    this.blackboardSize();
    if (this.isRealtime) {
      this.keepSyncingBoardWithDb();
      // TODO: is this detectable by resize - should make blackboard change size in response to this
      this.$root.$on("side-nav-toggled", sideNavOpened => {
        this.canvas.width = document.documentElement.clientWidth;
        this.rescaleCanvas(true);
      });
    }
  },
  updated () {
    if (!this.isRealtime) this.drawBackground(this.background);
  },
  beforeDestroy() {
    if (this.unsubscribe) this.unsubscribe();
  },
  destroyed () {
    // TODO: refactor this to a "resize" module
    window.removeEventListener("resize", () => this.rescaleCanvas(true));
  },
  methods: {
    async initData () {
      // no need to reset data, just reset variables and UI as it's only useful when switching between different blackboards
      this.resetVariables();
      this.wipeBoard();
      this.currentState = this.recordStateEnum.PRE_RECORD;
      if (this.isRealtime) {
        this.loading = true;
        if (!this.blackboardId) return;
        // TODO: remove this blackboard listener
        await this.$binding("blackboard", this.blackboardRef);
        if (this.unsubscribe) this.unsubscribe();
        this.keepSyncingBoardWithDb();
      } 
      this.initCopyAndPasteImage()
    },
    keepSyncingBoardWithDb () {
      this.unsubscribe = this.strokesRef.orderBy("strokeNumber").onSnapshot(snapshot => {
        if (snapshot.docs.length === 0) {
          this.wipeBoard();
          this.resetVariables(); // no need to wipe database again
        }
        snapshot.docChanges().forEach(change => {
          if (change.type === "added") {
            const newStroke = change.doc.data();
            // check if local strokes and db strokes are in sync
            if (this.allStrokes.length < newStroke.strokeNumber) {
              if (this.loading) this.drawStroke(newStroke); // initial render: catch up to current state - draw quickly
              else this.drawStroke(newStroke, this.getPointPeriod(newStroke)); // render the new stroke smoothly
              this.allStrokes.push(newStroke);
            }
          } 
        });
        this.loading = false;
      });
    },
    async resetBoard () {
      console.log("resetBoard()")
      if (this.isRealtime) {
        this.disableDrawing();
        // Delete strokes subcollection // allStrokes is empty if the user himself initiated the deletes
        const strokeDeleteRequests = [];
        this.allStrokes.forEach(stroke => {
          strokeDeleteRequests.push(this.strokesRef.doc(`${stroke.strokeNumber}`).delete());
        })
        console.log("Successfully wiped board");
        const backgroundResetRequest = this.blackboardRef.update({
          imageUrl: ""
        });
        await Promise.all([...strokeDeleteRequests, backgroundResetRequest]);
      }
      this.wipeBoard(); // UI
      this.resetVariables(); // local state
      this.enableDrawing();
    },
    wipeBoard () {
      if (!this.ctx) return;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.bgCtx.clearRect(0, 0, this.bgCanvas.scrollWidth, this.bgCanvas.scrollHeight); // scroll width safer I think
    },
    resetVariables () {
      this.allStrokes = [];
      this.lastX = -1;
      this.currentTime = 0;
      this.imageBlob = null;
      this.imageUrl = "";
    },
    initCopyAndPasteImage () {
       document.onpaste = async event => {
        // use event.originalEvent.clipboard for newer chrome versions
        var items = (event.clipboardData || event.originalEvent.clipboardData).items;
        // console.log(JSON.stringify(items)); // will give you the mime types
        // Find pasted image among pasted items
        
        let blob = null;
        for (var i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image") === 0) {
            blob = items[i].getAsFile();
          }
        }
        
        // Load image if there is a pasted image
        if (blob !== null) {
          this.imageBlob = blob;
          if (!this.isRealtime) {
            const imageUrl = URL.createObjectURL(this.imageBlob);
            this.displayImageAsBackground(imageUrl);
          } else {
            const storageRef = firebase.storage().ref();
            const imageRef = storageRef.child(`images/${this.blackboardId}`);
            const uploadTask = imageRef.put(blob)
            uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, 
              snapshot => {}, 
              error => console.log('error =', error), 
              async () => {
                // Update blackboard doc's image reference to this new image
                const imageUrl = await uploadTask.snapshot.ref.getDownloadURL();
                this.blackboardRef.update({
                  imageUrl
                });
                // Store locally 
                this.imageUrl = imageUrl;
              }
            );
          }
        }
      }
    },
    displayImageAsBackground (src) {
      const image = new Image();
      image.src = src;
      this.bgCanvas.height = this.canvas.scrollHeight;
      this.bgCanvas.width = this.canvas.scrollWidth;
      image.onload = () => this.bgCtx.drawImage(image, 0, 0, this.bgCanvas.scrollWidth, this.bgCanvas.scrollHeight);
    },
    setImage () {
      document.getElementById("whiteboard-bg-input").value = "";
      document.getElementById("whiteboard-bg-input").click();
    },
    handleImage (e) {},
    drawBackground (image) {},
    startTimer () {
      this.currentTime = 0;
      this.timer = setInterval(() => this.currentTime += 0.1, 100);
    },
    stopTimer () {
      clearInterval(this.timer);
    },
    enableDrawing () {
      this.initTouchEvents();
      this.initMouseEvents();
    },
    disableDrawing () {
      this.removeMouseEvents();
      this.removeTouchEvents();
    },
    initTouchEvents () {
      if (!this.canvas) return;
      this.canvas.addEventListener("touchstart", this.touchStart, false);
      this.canvas.addEventListener("touchend", this.touchEnd, false);
      this.canvas.addEventListener("touchmove", this.touchMove, false);
      this.setStyle(this.color, this.lineWidth); // TODO: kind of sketch
    },
    removeTouchEvents () {
      if (!this.canvas) return;
      this.canvas.removeEventListener("touchstart", this.touchStart, false);
      this.canvas.removeEventListener("touchend", this.touchEnd, false);
      this.canvas.removeEventListener("touchmove", this.touchMove, false);
    },
    initMouseEvents () {
      if (!this.canvas) return;
      this.canvas.addEventListener("mousedown", this.mouseDown, false);
      this.canvas.addEventListener("mouseup", this.mouseUp, false);
      this.canvas.addEventListener("mousemove", this.mouseMove, false);
    },
    removeMouseEvents () {
      if (!this.canvas) return;
      this.canvas.removeEventListener("mousedown", this.mouseDown, false);
      this.canvas.removeEventListener("mouseup", this.mouseUp, false);
      this.canvas.removeEventListener("mousemove", this.mouseMove, false);
    },
    convertAndSavePoint (x, y) {
      const unitX = parseFloat(x / this.canvas.width).toFixed(4);
      const unitY = parseFloat(y / this.canvas.height).toFixed(4);
      this.currentStroke.push({ unitX, unitY });
      this.drawToPoint(x, y);
    },
    touchStart (e) {
      if (this.isNotValidTouch(e)) return; 
      // Call preventDefault()  only if we're sure the user is drawing
      // rather than trying to scroll
      e.preventDefault(); // preventDefault only if it's a valid touch to enable scrolling behavior 
      // Automatically disable touch drawing if a stylus is detected
      if (e.touches[0].touchType === "stylus") this.disableTouch = true; 
      this.drawToPointAndSave(e);
      if (this.currentState === this.recordStateEnum.MID_RECORD) { 
        this.startTime = this.currentTime.toFixed(1); // this.startTime keeps track of current stroke's startTime
      } 
    },
    touchMove (e) {
      e.preventDefault(); // this line improves drawing performance for Microsoft Surfaces
      if (this.isNotValidTouch(e)) return; 
      this.drawToPointAndSave(e);
    },
    touchEnd (e) {
      e.preventDefault();
      if (this.currentStroke.length === 0) return;  // user is touching the screen despite that touch is disabled
      const strokeNumber = this.allStrokes.length + 1;
      // Save the stroke
      const { uid, firstName, lastName, email } = this.user;
      const stroke = {
        points: this.currentStroke,
        strokeNumber,
        author: { uid, firstName, lastName, email },
        color: this.color,
        lineWidth: this.lineWidth,
        startTime: Number(this.startTime),
        endTime: Number(this.currentTime.toFixed(1)),
        isErasing: this.eraserActive // mini
      }
      this.allStrokes.push(stroke);
      if (this.isRealtime) {
        this.strokesRef.doc(`${strokeNumber}`).set(stroke);
      }
      // Reset
      this.currentStroke = [];
      this.lastX = -1;
    },
    drawToPointAndSave(e) {
      this.setStyle(this.color, this.lineWidth); //mini
      this.getTouchPos(e);
      // all the touchX and touchY are non-sensical to be honest - ah it's to preserve old value
      this.convertAndSavePoint(this.touchX, this.touchY);
      this.drawToPoint(this.touchX, this.touchY);
    },
    getTouchPos(e) {
      const finger1 = e.touches[0];
      const { left, top } = this.canvas.getBoundingClientRect();
      this.touchX = finger1.pageX - left - window.scrollX;
      this.touchY = finger1.pageY - top - window.scrollY;
    },
    isNotValidTouch (e) {
      if (e.touches.length !== 1) return true;  // multiple fingers not allowed
      return this.isFinger(e) && this.disableTouch;
    },
    isFinger (e) {
      return e.touches[0].touchType !== "stylus"
    },
    mouseDown (e) {
      e.preventDefault();
      this.mousedown = 1;
      this.setStyle(this.color, this.lineWidth);
      this.getMousePos(e);
      this.convertAndSavePoint(this.mouseX, this.mouseY);
      this.drawToPoint(this.mouseX, this.mouseY);
      if (this.currentState === this.recordStateEnum.MID_RECORD) {
        this.startTime = this.currentTime.toFixed(1);
      }
    },
    mouseMove (e) {
      e.preventDefault(); // this line improves drawing performance for Microsoft Surfaces
      this.getMousePos(e);
      // Draw a pixel if the mouse button is currently being pressed
      if (this.mousedown === 1) {
        this.getMousePos(e);
        this.convertAndSavePoint(this.mouseX, this.mouseY);
        this.drawToPoint(this.mouseX, this.mouseY);
      }
    },
    mouseUp (e) {
      this.mousedown = 0;
      const strokeNumber = this.allStrokes.length + 1;
      // Store the stroke locally
      const stroke = {
        points: this.currentStroke,
        strokeNumber,
        author: this.author || "anonymous",
        color: this.color,
        lineWidth: this.lineWidth,
        startTime: Number(this.startTime),
        endTime: Number(this.currentTime.toFixed(1)),
        isErasing: this.eraserActive // mini
      };
      this.allStrokes.push(stroke);
      // Upload it online if it's real-time
      if (this.isRealtime) {
        this.strokesRef.doc(`${strokeNumber}`).set(stroke);
      }
      // Reset current stroke
      this.currentStroke = [];
      this.lastX = -1;
    },
    getMousePos (e) {
      // Get the current mouse position relative to the top-left of the canvas
      this.mouseX = e.offsetX; //- window.scrollX
      this.mouseY = e.offsetY; //- window.scrollY (in case these don't work)
    },
    handleRecordStateChange (newState) {
      const { MID_RECORD, POST_RECORD } = this.recordStateEnum;
      if (newState === MID_RECORD) this.startRecording(); 
      else if (newState === POST_RECORD) this.stopRecording(); 
      else this.tryRecordAgain();
    },
    startRecording () {
      this.startTimer();
      const { MID_RECORD } = this.recordStateEnum;
      this.currentState = MID_RECORD;
      this.$refs.AudioRecorder.startRecording();
      if (this.isRealtime) {
        this.blackboardRef.update({ recordState: MID_RECORD });
      }
      this.$emit("record-start"); // let's Piazza know so it can disable the "submit post" button 
    },
    stopRecording () {
      this.stopTimer();
      const { POST_RECORD } = this.recordStateEnum;
      this.disableDrawing();
      this.$refs.AudioRecorder.stopRecording();
      this.currentState = POST_RECORD;
      if (this.isRealtime) {
        this.blackboardRef.update({ recordState: POST_RECORD });
      }
      this.$emit("audio-upload-start"); // AudioRecorder implicitly starts uploading the file to Firestore
    },
    tryRecordAgain () {
      this.currentTime = 0;
      this.hasUploadedAudio = false;
      const { PRE_RECORD } = this.recordStateEnum;
      this.currentState = PRE_RECORD;
      if (this.isRealtime) {
        this.blackboardRef.update({ recordState: PRE_RECORD, audioUrl: "" });
      }
    },
    saveFileReference ({ url }) {
      this.hasUploadedAudio = true;
      this.audioUrl = url;
      if (this.isRealtime) this.blackboardRef.update({ audioUrl: url });
      this.$emit("audio-upload-end");
    },
    async handleSaving ({ title, description }) {
      // Save the video
      const videoThumbnail = this.createThumbnail();
      const metadata = {
        creator: {
          uid: this.user.uid,
          firstName: this.user.firstName,
          email: this.user.email
        },
        title,
        description,
        isSaved: true, // marks blackboard as saved
        tabNumber: 0,
        thumbnail: videoThumbnail // toDataURL takes a screenshot of a canvas and encodes it as an image URL
      };

      if (this.currentTime) metadata.duration = this.currentTime;
      this.blackboardRef.update(metadata).then(() => this.isUploadingVideo = false);
      this.classRef.update({
        numOfVideos: firebase.firestore.FieldValue.increment(1)
      });

      // Initialize a new blackboard for the workspace
      const roomId = this.$route.params.room_id;
      const boardsRef = db.collection("classes").doc(this.classId).collection("blackboards");
      const newBoardRef = await boardsRef.add({ 
        recordState: this.recordStateEnum.PRE_RECORD 
      });
      const roomsRef = db.collection("rooms").doc(roomId);
      roomsRef.update({
        blackboardId: newBoardRef.id
      });
      this.hasUploadAudio = false;
      this.snackbar = true;
      this.snackbarMessage = 'Successfully archived to the "Saved videos" section';
    },
    createThumbnail () {
      this.ctx.fillStyle = "rgb(62, 66, 66)";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.drawStrokesInstantly();
      return this.canvas.toDataURL();
    },
    customCursor () {
      var dummy_canvas = document.createElement("canvas");
      dummy_canvas.width = 24;
      dummy_canvas.height = 24;
      var ctx = dummy_canvas.getContext("2d");
      ctx.fillStyle = this.eraserActive ? "#fff" : this.color;
      ctx.font = "24px 'Material Design Icons'";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(this.eraserActive ? "\uF1FE" : "\uF64F", 12, 12);
      var dataURL = dummy_canvas.toDataURL("image/png");
      document.getElementById("myCanvas").style.cursor =
        "url(" + dataURL + ") 0 24, auto";
    },
    // If this works you're a genius
    blackboardSize () {
      var board = document.getElementById("myCanvas");
      var mini_height =
        (document.getElementById("blackboard-wrapper").offsetWidth * 9) / 16 +
        "px";
      var realtime_height = window.innerHeight - 48 + "px";
      // var margin_top = this.isRealtime ? "48px" : "";
      board.style.height = this.isRealtime ? realtime_height : mini_height;
      // board.style.marginTop = margin_top;
    },
    // Blackboard specific draw methods
    drawToPoint (x, y) {
      // This is the start of stroke, don't connect to any previous points
      if (this.lastX === -1) {
        this.lastX = x;
        this.lastY = y;
        return;
      }
      this.traceLineTo(x, y);
      this.ctx.stroke();
      this.lastX = x;
      this.lastY = y;
    },
    traceLineTo (x, y) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.lastX, this.lastY);
      this.ctx.lineTo(x, y);
    }
    // sortStrokesByTimestamp () {
    //   this.allStrokes.sort((a, b) => Number(a.startTime) - Number(b.startTime));
    // },
    // getAspectRatio () {
    //   return this.canvas.scrollHeight / this.canvas.scrollWidth;
    // },
  }
};
</script>

<style scoped>
#whiteboard {
  position: relative;
  z-index: 5;
}
#blackboard-wrapper {
  position: relative;
  z-index: -1;
}
#blackboard-wrapper.realtime-canvas {
  z-index: 1;
}
#myCanvas {
  width: 100%;
  height: 100%;
  background-repeat: no-repeat;
  background-size: 100% 100%;
  background-color: transparent;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.25) inset;
  display: block;
}
#background-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-repeat: no-repeat;
  background-color: rgb(62, 66, 66);
  background-size: 100% 100%;
  z-index: -1;
}
#realtime-toolbar {
  margin: -10px;
}
</style>