<template>
  <div>
    <div id="whiteboard" :outlined="!isRealtime" :elevation="isRealtime?'0':'1'">
      <v-snackbar v-model="snackbar">
        {{ snackbarMessage }}
        <v-btn @click="snackbar = false" color="accent" text>CLOSE</v-btn>
      </v-snackbar>

      <TheAppBar v-if="isRealtime" :loading="loading" page="realtime">
        <div id="realtime-toolbar">
          <BlackboardToolBar
            :currentState="blackboard.recordState"
            :eraserActive="eraserActive"
            :color="color"
            :isRealtime="isRealtime"
            :hasUploadedAudio="hasUploadedAudio"
            @eraser-click="eraserClick"
            @set-image="handleImage"
            @color-click="newColor => color = newColor"
            @wipe-board="wipeBoard()"
            @record-state-change="newState => handleRecordStateChange(newState)"
            @video-save="payload => handleSaving(payload)"
            @animation-save="handleSaving({title: 'No title yet', description: 'No description yet'})"
          />
        </div>
      </TheAppBar>

      <!-- APP BAR -->
      <div v-if="!isRealtime" id="mini-toolbar">
        <BlackboardToolBar
          :currentState="currentState"
          :eraserActive="eraserActive"
          :color="color"
          :isRealtime="isRealtime"
          :hasUploadedAudio="hasUploadedAudio"
          @eraser-click="status => eraserClick(status)"
          @set-image="e => handleImage(e)"
          @color-click="newColor => {color=newColor}"
          @wipe-board="wipeBoard"
          @record-state-change="newState => handleRecordStateChange(newState)"
          ref="blackboardToolbar"
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

      <!-- "@start-recording" is necessary because the audio-recorder can't 
      start recording instantaneously - and if we falsely believe it is, then `getAudioTime` will be 
      null-->
      <!-- :audioUrl="blackboard.audioUrl" -->
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
import { mapState } from "vuex";
import firebase from "firebase/app";
import "firebase/functions";
import slugify from "slugify";
import db from "@/database.js";
import DrawMethods from "@/mixins/DrawMethods.js";
import Swatches from "vue-swatches";
import "vue-swatches/dist/vue-swatches.min.css";
import AudioRecorder from "@/components/AudioRecorder.vue";
import TheAppBar from "@/components/TheAppBar.vue";
import BlackboardToolBar from "@/components/BlackboardToolBar.vue";
import CONSTANTS from "@/CONSTANTS.js";

export default {
  props: {
    isRealtime: Boolean,
    blackboardId: String,
    hideToolbar: Boolean,
    height: String,
    visible: Boolean,
    background: String
  },
  components: {
    AudioRecorder,
    Swatches,
    TheAppBar,
    BlackboardToolBar
  },
  mixins: [DrawMethods],
  data () {
    return {
      loading: true,
      blackboard: null,
      color: "white",
      lineWidth: 2,
      colors: ["white", "orange", "#0AF2F2", "deeppink", "rgb(62, 66, 66)"],
      disableTouch: false,
      saveSilently: false,
      saveVideoPopup: false,
      stylus: false,
      allStrokes: [],
      currentStroke: [],
      canvas: null,
      ctx: null,
      timer: null,
      getCurrentTime: null,
      currentTime: 0,
      startTime: 0,
      endTime: null,
      touchX: null,
      touchY: null,
      lastX: -1,
      lastY: -1,
      unsubscribe: null,
      redrawTimeout: null, // needed for mixins/DrawMethods.js TODO: consider declaring it in the data () section of DrawMethods.js instead,
      hasUploadedAudio: false,
      mouseX: 0,
      mouseY: 0,
      mousedown: 0,
      clearRectTimeout: null,
      snackbar: false,
      snackbarMessage: "",
      currentState: "",
      audioObj: {},
      audioPath: "",
      audioUrl: "",
      recordStateEnum: CONSTANTS.recordStateEnum,
      smallScreen: window.innerWidth < 960,
      palleteVisibility: false,
      eraserActive: false,
    }
  },
  computed: {
    ...mapState(["user"]),
    classId () {
      return this.$route.params.class_id;
    },
    classRef () {
      return db.collection("classes").doc(this.classId);
    },
    blackboardRef () {
      return this.classRef.collection("blackboards").doc(this.blackboardId);
    },
    strokesRef () {
      return this.blackboardRef.collection("strokes");
    },
    bg () { 
      return this.background; // mini
    } 
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
      const { POST_RECORD } = this.recordStateEnum;
      if (!newVal) return;
      if (newVal.recordState !== POST_RECORD || this.canvas || this.ctx) {
        this.initTouchEvents();
        this.initMouseEvents();
      }
    },
    eraserActive() {
      // all these are mini
      this.customCursor();
      this.canvas.getContext("2d").globalCompositeOperation = this.eraserActive
        ? "destination-out"
        : "source-over";
      this.lineWidth = this.eraserActive ? 20 : 2;
    },
    color () {
      this.customCursor();
    },
    visible () {
      this.blackboardSize();
    },
    bg () {
      this.drawBackground(this.bg);
    }
  },
  mounted () {
    // the mounted() hook is never called for subsequent switches between whiteboards
    this.canvas = document.getElementById("myCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.rescaleCanvas(true);
    if (this.isRealtime) {
      window.addEventListener("resize", () => {
          this.canvas.width = document.documentElement.clientWidth;
          this.rescaleCanvas(true);
        },
        false
      );
    } else {
      window.addEventListener("resize", () => this.rescaleCanvas(true), false); // for mini blackboard
    }
    this.initTouchEvents();
    this.initMouseEvents();
    document.fonts.ready.then(() => this.customCursor());
    if (this.isRealtime) {
      this.keepSyncingBoardWithDb();
      this.$root.$on("side-nav-toggled", sideNavOpened => {
        this.canvas.width = document.documentElement.clientWidth;
        this.rescaleCanvas(true);
      });
    } else {
      // mini
      document.fonts.ready.then(() => this.customCursor()); //since cursor uses material icons font, load it after fonts are ready
      this.blackboardSize();
      window.addEventListener("resize", this.blackboardToolbar);
      window.addEventListener("orientationchange", this.blackboardToolbar);
      window.addEventListener("click", e => this.palleteClose(e));
      this.drawBackground(this.background);
    }
  },
  updated () {
    if (!this.isRealtime) this.drawBackground(this.background);
  },
  beforeDestroy() {
    if (this.unsubscribe) this.unsubscribe();
  },
  destroyed() {
    //mini
    window.removeEventListener("resize", this.blackboardToolbar);
    window.removeEventListener("orientationchange", this.blackboardToolbar);
    window.removeEventListener("resize", () => this.rescaleCanvas(true));
    window.removeEventListener("click", e => this.palleteClose(e));
  },
  methods: {
    wipeBoard () {
      this.allStrokes = [];
      if (this.canvas && this.ctx) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    },
    setImage () {
      document.getElementById("whiteboard-bg-input").value = "";
      document.getElementById("whiteboard-bg-input").click();
    },
    handleImage(e) {
      var file = e.target.files[0];
      var reader = new FileReader();
      var vue = this;
      reader.onload = function(event) {
        var img = event.target.result;
        vue.drawBackground(img);
        vue.$emit("boardImage", img);
      };
      if (file) reader.readAsDataURL(file); 
    },
    drawBackground (image) {
      var canvas = document.getElementById("background-canvas");
      var ctx = canvas.getContext("2d");

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (image === "") return; 
      var img = new Image();
      img.onload = function() {
        var w = img.width;
        var h = img.height;
        var img_aspect_ratio = w / h;
        var x,
          y = 0;
        if (img_aspect_ratio < canvas.width / canvas.height) {
          h = canvas.height;
          w = h * img_aspect_ratio;
          x = (canvas.width - w) / 2;
        } else {
          w = canvas.width;
          h = w / img_aspect_ratio;
          y = (canvas.height - h) / 2;
        }
        ctx.drawImage(img, x, y, w, h);
      };
      img.src = image;
    },
    async initData () {
      if (this.isRealtime) {
        this.loading = true;
        if (!this.blackboardId) return;
        // TODO: remove this blackboard listener
        await this.$binding("blackboard", this.blackboardRef);
        this.wipeBoard();
        if (this.unsubscribe) this.unsubscribe();
        this.keepSyncingBoardWithDb();
      } else {
        this.wipeBoard();
        this.currentState = this.recordStateEnum.PRE_RECORD;
      }
    },
    keepSyncingBoardWithDb () {
      this.unsubscribe = this.strokesRef.orderBy("strokeNumber")
        .onSnapshot(snapshot => {
          snapshot.docChanges().forEach(change => {
            if (change.type === "added") {
              const stroke = change.doc.data();
              // check if local strokes and db strokes are in sync
              if (this.allStrokes.length < stroke.strokeNumber) {
                this.drawStroke(stroke, null);
                this.allStrokes.push(stroke);
              }
            } else if (change.type === "removed") {
              // inefficient way to clear canvas for OTHER users (since the current user's UI is already updated)
              clearTimeout(this.clearRectTimeout);
              this.clearRectTimeout = setTimeout(
                () =>
                  this.ctx.clearRect(
                    0,
                    0,
                    this.canvas.width,
                    this.canvas.height
                  ),
                400
              );
              this.resetVariables();
            }
          });
          this.loading = false;
        });
    },
    resetVariables () {
      if (this.isRealtime) { this.allStrokes = []; }
      this.lastX = -1;
    },
    sortStrokesByTimestamp () {
      this.allStrokes.sort((a, b) => Number(a.startTime) - Number(b.startTime));
    },
    // getAspectRatio () {
    //   return this.canvas.scrollHeight / this.canvas.scrollWidth;
    // },
    startTimer () {
      this.currentTime = 0;
      this.timer = setInterval(() => this.currentTime += 0.1, 100);
    },
    stopTimer () {
      clearInterval(this.timer);
    },
    initTouchEvents () {
      this.canvas.addEventListener("touchstart", this.touchStart, false);
      this.canvas.addEventListener("touchend", this.touchEnd, false);
      this.canvas.addEventListener("touchmove", this.touchMove, false);
      this.setStyle(this.color, this.lineWidth);
    },
    removeTouchEvents () {
      this.canvas.removeEventListener("touchstart", this.touchStart, false);
      this.canvas.removeEventListener("touchend", this.touchEnd, false);
      this.canvas.removeEventListener("touchmove", this.touchMove, false);
    },
    initMouseEvents() {
      this.canvas.addEventListener("mouseup", this.mouseUp, false);
      this.canvas.addEventListener("mousedown", this.mouseDown, false);
      this.canvas.addEventListener("mousemove", this.mouseMove, false);
    },
    removeMouseEvents () {
      this.canvas.removeEventListener("mouseup", this.mouseUp, false);
      this.canvas.removeEventListener("mousedown", this.mouseDown, false);
      this.canvas.removeEventListener("mousemove", this.mouseMove, false);
    },
    async deleteStrokesSubcollection () {
      for (let i = 1; i < this.allStrokes.length + 1; i++) {
        this.strokesRef.doc(`${i}`).delete();
      }
      this.allStrokes = [];
    },
    convertAndSavePoint (x, y) {
      const unitX = parseFloat(x / this.canvas.width).toFixed(4);
      const unitY = parseFloat(y / this.canvas.height).toFixed(4);
      this.currentStroke.push({ unitX, unitY });
      this.drawToPoint(x, y);
    },
    touchStart (e) {
      e.preventDefault(); // speeds up drawing massively
      if (!this.isRealtime) this.palleteVisibility = false; // mini
      if (this.isNotValidTouch(e)) return; 
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
      if (this.currentStroke.length == 0) return;  // user is touching the screen despite that touch is disabled
      const strokeNumber = this.allStrokes.length + 1;
      // save
      const { uid, firstName, lastName, email } = this.user;
      const stroke = {
        strokeNumber,
        author: { uid, firstName, lastName, email },
        color: this.color,
        lineWidth: this.lineWidth,
        startTime: Number(this.startTime),
        endTime: Number(this.currentTime.toFixed(1)),
        points: this.currentStroke,
        isErasing: this.eraserActive // mini
      }
      this.allStrokes.push(stroke);
      if (this.isRealtime) {
        this.strokesRef.doc(strokeNumber).set(stroke);
      }
      // reset
      this.currentStroke = [];
      this.lastX = -1;
    },
    drawToPointAndSave(e) {
      this.setStyle(this.color, this.lineWidth); //mini
      this.getTouchPos(e);
      this.convertAndSavePoint(this.touchX, this.touchY);
      this.drawToPoint(this.touchX, this.touchY);
    },
    getTouchPos(e) {
      const finger1 = e.touches[0];
      this.touchX =
        finger1.pageX -
        this.canvas.getBoundingClientRect().left -
        window.scrollX;
      this.touchY =
        finger1.pageY -
        this.canvas.getBoundingClientRect().top -
        window.scrollY;
    },
    isNotValidTouch(e) {
      if (e.touches.length !== 1) return true;  // multiple fingers not allowed
      return this.isFinger(e) && this.disableTouch;
    },
    isFinger(e) {
      return e.touches[0].touchType !== "stylus"
    },
    // --- Mouse Drawing --- //
    mouseDown (e) {
      e.preventDefault();
      this.mousedown = 1;
      this.palleteVisibility = false; // mini
      // referenced from touchStart
      this.setStyle(this.color, this.lineWidth);
      this.getMousePos(e);
      this.convertAndSavePoint(this.mouseX, this.mouseY);
      this.drawToPoint(this.mouseX, this.mouseY);
      if (this.currentState === this.recordStateEnum.MID_RECORD) {
        this.startTime = this.currentTime.toFixed(1);
      }
    },
    mouseUp (e) {
      this.mousedown = 0;
      // referenced from touchEnd
      const strokeNumber = this.allStrokes.length + 1;
      // save
      const stroke = {
        strokeNumber,
        author: this.author || "anonymous",
        color: this.color,
        lineWidth: this.lineWidth,
        startTime: Number(this.startTime),
        endTime: Number(this.currentTime.toFixed(1)),
        points: this.currentStroke,
        isErasing: this.eraserActive // mini
      };
      this.allStrokes.push(stroke);
      if (this.isRealtime) {
        this.strokesRef.doc(`${strokeNumber}`).set(stroke);
      }
      // reset
      this.currentStroke = [];
      this.lastX = -1;
    },
    mouseMove (e) {
      e.preventDefault(); // this line improves drawing performance for Microsoft Surfaces
      // Update the mouse co-ordinates when moved
      this.getMousePos(e);

      // Draw a pixel if the mouse button is currently being pressed
      if (this.mousedown === 1) {
        this.getMousePos(e);
        this.convertAndSavePoint(this.mouseX, this.mouseY);
        this.drawToPoint(this.mouseX, this.mouseY);
      }
    },
    getMousePos (e) {
      // Get the current mouse position relative to the top-left of the canvas
      if (!e) var e = event;
      if (this.isRealtime) {
        if (e.offsetX) {
          this.mouseX = e.offsetX - window.scrollX;
          this.mouseY = e.offsetY - window.scrollY;
        } else if (e.layerX) {
          this.mouseX = e.layerX - window.scrollX;
          this.mouseY = e.layerY - window.scrollY;
        }
      } else {
        //mini
        if (e.offsetX) {
          this.mouseX = e.offsetX; //- window.scrollX
          this.mouseY = e.offsetY; //- window.scrollY (in case these don't work)
        } else if (e.layerX) {
          this.mouseX = e.layerX; //- window.scrollX
          this.mouseY = e.layerY; //- window.scrollY
        }
      }
    },
    // --- END Mouse Drawing --- //
    useEraser () {
      this.color = "rgb(62, 66, 66)";
      this.lineWidth = 18;
    },
    handleRecordStateChange (newState) {
      const { MID_RECORD, POST_RECORD } = this.recordStateEnum
      if (newState === MID_RECORD) this.startRecording(); 
      else if (newState === POST_RECORD) this.stopRecording(); 
      else this.tryRecordAgain();
    },
    startRecording () {
      this.startTimer();
      const { MID_RECORD } = this.recordStateEnum;
      if (this.isRealtime) this.blackboardRef.update({ recordState: MID_RECORD });
      else this.currentState = MID_RECORD;
      this.$refs.AudioRecorder.startRecording();
    },
    stopRecording () {
      this.stopTimer();
      const { POST_RECORD } = this.recordStateEnum;
      this.removeTouchEvents();
      this.removeMouseEvents();
      this.$refs.AudioRecorder.stopRecording();
      if (this.isRealtime) this.blackboardRef.update({ recordState: POST_RECORD });
      else this.currentState = POST_RECORD; //mini
    },
    tryRecordAgain () {
      this.currentTime = 0;
      this.hasUploadedAudio = false;
      if (!this.isRealtime) {
        this.currentState = this.recordStateEnum.PRE_RECORD;
      } else {
        this.blackboardRef.update({
          recordState: this.currentState,
          audioUrl: "",
          audioPath: ""
        });
      }
    },
    saveFileReference ({ url, path }) {
      if (!this.isRealtime) this.audioUrl = url;
      else {
        this.hasUploadedAudio = true;
        this.blackboardRef.update({
          audioUrl: url,
          audioPath: path //i spath useful?
        });
      }
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
      this.blackboardRef.update(metadata);
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
    blackboardToolbar () {
      this.smallScreen = window.innerWidth < 960;
    },
    palleteClose (e) {
      var pallete = document.getElementById("swatches-wrapper");
      if (pallete && !pallete.contains(e.target)) {
        this.palleteVisibility = false;
      }
    },
    eraserClick (status) {
      this.eraserActive = status;
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
    blackboardSize () {
      var board = document.getElementById("myCanvas");
      var mini_height =
        (document.getElementById("blackboard-wrapper").offsetWidth * 9) / 16 +
        "px";
      var realtime_height = window.innerHeight - 48 + "px";
      var margin_top = this.isRealtime ? "48px" : "";
      board.style.height = this.isRealtime ? realtime_height : mini_height;
      board.style.marginTop = margin_top;
    }
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