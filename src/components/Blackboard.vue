<template>
  <div>
    <div id="whiteboard" :outlined="!isRealtime" :elevation="isRealtime? '0' : '1'">
      <TheAppBar v-if="isRealtime" page="realtime">
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
            @image-selected="imageFile => saveAndDisplayImage(imageFile)"
          >
            <BasePopupButton
              actionName="Save video"
              :disabled="!hasUploadedAudio"
              :inputFields="['title', 'description']"
              @action-do="payload => handleSaving(payload)"
            >
              <v-btn :loading="!hasUploadedAudio" :disabled="!hasUploadedAudio" class="white--text">
                Upload video
              </v-btn>
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
          @wipe-board="resetBoard()"
          @record-state-change="newState => handleRecordStateChange(newState)"
          @image-selected="imageFile => saveAndDisplayImage(imageFile)"
        />
      </div>
      <!-- BLACKBOARD -->
      <!-- position relative allows the background canvas to be directly on top of the normal canvas -->
      <div id="blackboard-wrapper" style="position: relative; z-index: -1;" :class="isRealtime? 'realtime-canvas':''">
        <canvas id="myCanvas"></canvas>
        <canvas id="background-canvas"></canvas>
      </div>
      <AudioRecorder v-show="false" ref="AudioRecorder"
        @file-uploaded="audio => saveFileReference(audio)"
        @audio-saved="handleAudioSaved()"
      />
    </div>
  </div>
</template>

<script>
import firebase from "firebase/app";
import "firebase/functions";
import db from "@/database.js";
import AudioRecorder from "@/components/AudioRecorder.vue";
import TheAppBar from "@/components/TheAppBar.vue";
import BlackboardToolBar from "@/components/BlackboardToolBar.vue";
import BasePopupButton from "@/components/BasePopupButton.vue";
import { RecordState } from "@/CONSTANTS.js";
import CanvasDrawMixin from "@/mixins/CanvasDrawMixin.js";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";

export default {
  props: {
    blackboardId: String,
    isRealtime: Boolean,
    visible: Boolean,
  },
  mixins: [CanvasDrawMixin, DatabaseHelpersMixin],
  components: {
    BlackboardToolBar,
    AudioRecorder,
    TheAppBar,
    BasePopupButton
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
      eraserActive: false,
      lineWidth: 2.5,
      disableTouch: false,
      allStrokes: [],
      currentStroke: { points: [] },
      imageUrl: "",
      imageBlob: null,
      timer: null,
      currentTime: 0,
      currPoint: { x: 0, y: 0 },
      prevPoint: { x: -1, y: -1 },
      mousedown: 0, // necessary to know if user is holding left click while dragging the mouse
      unsubscribe: null,
      currentState: "",
      audioUrl: "",
      hasUploadedAudio: false,
    }
  },
  computed: {
    user () { return this.$store.state.user; },
    author () {
      if (this.user) { 
        const { uid, firstName, lastName, email } = this.user;
        return { uid, firstName, lastName, email };
      } else { 
        return { uid: "Anonymous" }; 
      }
    },
    classRef () { 
      const { class_id } = this.$route.params;
      return db.collection("classes").doc(class_id); 
    },
    blackboardRef () { return this.classRef.collection("blackboards").doc(this.blackboardId); },
    strokesRef () { return this.blackboardRef.collection("strokes"); },
  },
  watch: {
    blackboardId: {
      handler: "initData",
      immediate: true
    },
    blackboard (newVal) {
      if (newVal.recordState !== RecordState.POST_RECORD || this.canvas) {
        this.enableDrawing();
      }
      // TODO: make it more readable
      let imageSrc;
      if (this.imageUrl !== newVal.imageUrl) { // ImageURL changed, so fetch the image
        this.imageUrl = newVal.imageUrl;
        imageSrc = this.imageUrl;
      } else {
        try { imageSrc = URL.createObjectURL(this.imageBlob); } // means we already have the image blob locally
        catch { imageSrc = this.imageUrl; }
      }
      this.displayImageAsBackground(imageSrc);
    },
    eraserActive () {
      this.customCursor();
      this.canvas.getContext("2d").globalCompositeOperation = this.eraserActive
        ? "destination-out"
        : "source-over";
      this.lineWidth = this.eraserActive ? 25 : 2.5;
    },
    color () { this.customCursor(); },
    visible () { this.adjustBoardSize(); },
  },
  mounted () {
    this.canvas = document.getElementById("myCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.bgCanvas = document.getElementById("background-canvas");
    this.bgCtx = this.bgCanvas.getContext("2d");
    this.adjustBoardSize();
    window.addEventListener("resize", this.adjustBoardSize, false); 
    this.enableDrawing();
    document.fonts.ready.then(() => this.customCursor()); // since cursor uses material icons font, load it after fonts are ready
    if (this.isRealtime) { this.keepSyncingBoardWithDb(); }
  },
  beforeDestroy() { 
    if (this.unsubscribe) { this.unsubscribe(); } 
  },
  destroyed () {
    window.removeEventListener("resize", this.adjustBoardSize);
  },
  methods: {
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
      this.unsubscribe = this.strokesRef.orderBy("strokeNumber").onSnapshot(snapshot => {
        if (snapshot.docs.length === 0) {
          this.wipeBoard();
          this.resetVariables(); // no need to wipe database again
        }
        snapshot.docChanges().forEach(change => {
          if (change.type === "added") {
            const newStroke = change.doc.data();
            if (this.allStrokes.length < newStroke.strokeNumber) { // check if local strokes and db strokes are in sync
              if (this.loading) { this.$_drawStroke(newStroke); } // initial render: catch up to current state - draw quickly
              else { this.$_drawStroke(newStroke, this.$_getPointDuration(newStroke)); } 
              this.allStrokes.push(newStroke);
            }
          }
        });
        this.loading = false;
      });
    },
    uploadAudio () {
      return new Promise(async (resolve) => {
        const { AudioRecorder } = this.$refs;
        await AudioRecorder.uploadRecording();
        resolve();
      })
    },
    async resetBoard () {
      if (this.isRealtime) {
        this.disableDrawing();
        const strokeDeleteRequests = [];
        this.allStrokes.forEach(stroke => {
          strokeDeleteRequests.push(this.strokesRef.doc(`${stroke.strokeNumber}`).delete());
        })
        const backgroundResetRequest = this.blackboardRef.update({ imageUrl: "" });
        await Promise.all([...strokeDeleteRequests, backgroundResetRequest]);
      }
      this.wipeBoard(); // UI
      this.resetVariables(); // local state
      this.enableDrawing();
    },
    wipeBoard () {
      if (!this.ctx) { return; }
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.bgCtx.clearRect(0, 0, this.bgCanvas.scrollWidth, this.bgCanvas.scrollHeight); // scroll width safer I think
    },
    resetVariables () {
      this.allStrokes = [];
      this.prevPoint = { x: -1, y: -1 };
      this.currentTime = 0;
      this.imageBlob = null;
      this.imageUrl = "";
    },
    initCopyAndPasteImage () {
       document.onpaste = async event => {
        const items = (event.clipboardData || event.originalEvent.clipboardData).items; // use event.originalEvent.clipboard for newer chrome versions
        // Find pasted image among pasted items
        let blob = null;
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image") === 0) {
            blob = items[i].getAsFile();
          }
        }

        // Load image if there is a pasted image
        if (blob === null) { return; }
        this.imageBlob = blob;
        if (!this.isRealtime) {
          const imageUrl = URL.createObjectURL(this.imageBlob);
          this.displayImageAsBackground(imageUrl);
        } else {
          const imageUrl = await this.$_saveToStorage(`images/${this.blackboardId}`, blob);
          this.blackboardRef.update({ imageUrl });
          this.imageUrl = imageUrl; // store locally
        }     
      }
    },
    async saveAndDisplayImage (blob) { // TODO: this was a quick-fix for image files
      if (blob === null) { return; }
      this.imageBlob = blob;
      if (!this.isRealtime) {
        const imageUrl = URL.createObjectURL(this.imageBlob);
        this.displayImageAsBackground(imageUrl);
      } else {
        const imageUrl = await this.$_saveToStorage(`images/${this.blackboardId}`, blob);
        this.blackboardRef.update({ imageUrl });
        this.imageUrl = imageUrl; // store locally
      }     
    },
    displayImageAsBackground (src) {
      const image = new Image();
      image.src = src;
      this.bgCanvas.height = this.canvas.scrollHeight;
      this.bgCanvas.width = this.canvas.scrollWidth;
      image.onload = () => this.bgCtx.drawImage(image, 0, 0, this.bgCanvas.scrollWidth, this.bgCanvas.scrollHeight);
    },
    handleImage (e) {},
    drawBackground (image) {},
    startTimer () {
      this.currentTime = 0;
      this.timer = setInterval(() => this.currentTime += 0.1, 100);
    },
    stopTimer () { clearInterval(this.timer); },
    convertAndSavePoint (x, y) {
      const unitX = parseFloat(x / this.canvas.width).toFixed(4);
      const unitY = parseFloat(y / this.canvas.height).toFixed(4);
      this.currentStroke.points.push({ unitX, unitY });
    },
    startNewStroke (e) {
      // set up the strokes object
      this.currentStroke.strokeNumber = this.allStrokes.length + 1;
      this.currentStroke.startTime = Number(this.currentTime.toFixed(1));
      this.currentStroke.author = this.author;
      this.currentStroke.color = this.color;
      this.currentStroke.lineWidth = this.lineWidth;
      this.currentStroke.isErasing = this.eraserActive;

      this.$_rescaleCanvas(false);
      e.preventDefault(); // not put in the beginning because sometimes we allow scrolling 
      this.$_setStyle(this.color, this.lineWidth);
      if (this.currentState === RecordState.MID_RECORD) {
        this.startTime = this.currentTime.toFixed(1);
      }
    },
    touchStart (e) {
      if (this.isNotValidTouch(e)) { return; }
      if (e.touches[0].touchType === "stylus") { this.disableTouch = true; }
      this.startNewStroke(e);
      this.drawToPointAndSave(e);
    },
    touchMove (e) {
      if (this.isNotValidTouch(e)) { return; }
      this.drawToPointAndSave(e);
    },
    touchEnd (e) { this.saveStrokeThenReset(e); },
    saveStrokeThenReset (e) {
      e.preventDefault()
      if (this.currentStroke.points.length === 0) { return; }  // user is touching the screen despite that touch is disabled
      this.currentStroke.endTime = Number(this.currentTime.toFixed(1));
      this.allStrokes.push(this.currentStroke);
      if (this.isRealtime) {
        this.strokesRef.doc(`${this.allStrokes.length}`).set(this.currentStroke); // 1st stroke = 1
      }
      this.currentStroke = { points: [] };
      this.prevPoint = { x: -1, y: -1 };
    },
    drawToPointAndSave(e, isMouseDraw) {
      e.preventDefault();
      if (isMouseDraw) { this.currPoint = { x: e.offsetX, y: e.offsetY }; } 
      else { this.getTouchPos(e); }
      this.convertAndSavePoint(this.currPoint.x, this.currPoint.y);
      this.drawToPoint(this.currPoint);
    },
    getTouchPos(e) {
      const finger1 = e.touches[0];
      const { left, top } = this.canvas.getBoundingClientRect();
      this.currPoint.x = finger1.pageX - left - window.scrollX;
      this.currPoint.y = finger1.pageY - top - window.scrollY;
    },
    isNotValidTouch (e) {
      if (e.touches.length !== 1) { return true; }  // multiple fingers not allowed
      return this.isFinger(e) && this.disableTouch;
    },
    isFinger (e) { return e.touches[0].touchType !== "stylus" },
    mouseDown (e) {
      this.mousedown = 1;
      this.startNewStroke(e);
      const isMouseDraw = true;
      this.drawToPointAndSave(e, isMouseDraw);
    },
    mouseMove (e) {
      if (this.mousedown !== 1) { return; }
      const isMouseDraw = true;
      this.drawToPointAndSave(e, isMouseDraw);
    },
    mouseUp (e) {
      this.mousedown = 0;
      this.saveStrokeThenReset(e);
    },
    handleRecordStateChange (newState) {
      const { PRE_RECORD, MID_RECORD, POST_RECORD } = RecordState;
      if (newState === MID_RECORD) { this.startRecording(); }
      else if (newState === POST_RECORD) { this.stopRecording(); }
      else if (newState === PRE_RECORD) {this.tryRecordAgain(); }
      else { throw `Error: blackboard state was set to an illegal value = ${newState}` }
    },
    startRecording () {
      this.startTimer();
      const { MID_RECORD } = RecordState;
      this.currentState = MID_RECORD;
      this.$refs.AudioRecorder.startRecording();
      if (this.isRealtime) {
        this.blackboardRef.update({ recordState: MID_RECORD });
      }
      this.$emit("record-start"); // let's Piazza know so it can disable the "submit post" button
    },
    stopRecording () {
      this.stopTimer();
      const { AudioRecorder } = this.$refs;
      const { POST_RECORD } = RecordState;
      this.disableDrawing();
      AudioRecorder.stopRecording();
      this.currentState = POST_RECORD;
      if (this.isRealtime) {
        this.blackboardRef.update({ recordState: POST_RECORD });
      }
    },
    handleAudioSaved () { 
      const { AudioRecorder } = this.$refs;
      const videoData = { 
        audio: AudioRecorder.audio, 
        strokes: this.allStrokes,
        image: this.imageBlob
      };
      this.$emit("record-end", videoData)
    },
    tryRecordAgain () {
      this.currentTime = 0;
      this.hasUploadedAudio = false;
      // last round's strokes will persist as the initial setup of this round's recording
      for (const stroke of this.allStrokes) {
        [stroke.startTime, stroke.endTime] = [0, 0];
      }
      const { PRE_RECORD } = RecordState;
      this.currentState = PRE_RECORD;
      this.enableDrawing();
      if (this.isRealtime) {
        this.blackboardRef.update({ recordState: PRE_RECORD, audioUrl: "" });
      }
      const willRedraw = true;
      this.$_rescaleCanvas(willRedraw);
    },
    saveFileReference ({ url }) {
      this.hasUploadedAudio = true;
      this.audioUrl = url;
      if (this.isRealtime) {
        this.blackboardRef.update({ audioUrl: url })
      }
      this.$emit("audio-upload-end", { blackboardStrokes: this.allStrokes, audioUrl: url});
    },
    async handleSaving ({ title, description }) {
      const videoThumbnail = this.createThumbnail();
      const metadata = {
        creator: this.author,
        title,
        description,
        isSaved: true, // marks blackboard as saved
        thumbnail: videoThumbnail // toDataURL takes a screenshot of a canvas and encodes it as an image URL
      };

      if (this.currentTime) { metadata.duration = this.currentTime; }
      this.blackboardRef.update(metadata).then(() => this.isUploadingVideo = false);
      this.classRef.update({
        numOfVideos: firebase.firestore.FieldValue.increment(1)
      });

      // Initialize a new blackboard for the workspace
      const { room_id, class_id } = this.$route.params;
      const boardsRef = db.collection("classes").doc(class_id).collection("blackboards");
      const newBoardRef = await boardsRef.add({
        recordState: RecordState.PRE_RECORD
      });
      const roomsRef = db.collection("rooms").doc(room_id);
      roomsRef.update({
        blackboardId: newBoardRef.id
      });
      this.hasUploadAudio = false;
      const messageToUser = 'Successfully archived to the "Saved videos" section';
      this.$root.$emit("show-snackbar", messageToUser);
    },
    createThumbnail () {
      if (this.imageUrl || this.imageBlob) {
        this.$_drawStrokesInstantly2();
        return this.bgCanvas.toDataURL(); //this just makes the background image the thumbnail
      } else {
        this.ctx.fillStyle = "rgb(62, 66, 66)";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.$_drawStrokesInstantly();
        return this.canvas.toDataURL();
      }
    },
    customCursor () {
      const dummy_canvas = document.createElement("canvas");
      dummy_canvas.width = 24;
      dummy_canvas.height = 24;
      const ctx = dummy_canvas.getContext("2d");
      ctx.fillStyle = this.eraserActive ? "#fff" : this.color;
      ctx.font = "24px 'Material Design Icons'";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(this.eraserActive ? "\uF1FE" : "\uF64F", 12, 12);
      var dataURL = dummy_canvas.toDataURL("image/png");
      document.getElementById("myCanvas").style.cursor =
        "url(" + dataURL + ") 0 24, auto";
    },
    adjustBoardSize () {
      const navbarHeight = 48; 
      const aspectRatio = 9/16;
      const epsilon = 20;
      const blackboard = document.getElementById("blackboard-wrapper");
      blackboard.style.height = "unset" // To reset the blackboard height when the user retries to make medio after previewing
      let offlineWidth = blackboard.offsetWidth;
      let offlineHeight = offlineWidth * aspectRatio;
      if (offlineHeight > window.innerHeight - navbarHeight) {
        offlineHeight = window.innerHeight - navbarHeight - epsilon; 
      }
      const realtime_height = window.innerHeight - navbarHeight;
      if (!this.isRealtime) { this.canvas.style.height = offlineHeight + "px"; } 
      else { this.canvas.style.height = realtime_height + "px"; }
      const willRedraw = true;
      this.$_rescaleCanvas(willRedraw);
    },
    // Blackboard specific draw methods
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
    enableDrawing () {
      this.initTouchEvents();
      this.initMouseEvents();
    },
    disableDrawing () {
      this.removeMouseEvents();
      this.removeTouchEvents();
    },
    initTouchEvents () {
      if (!this.canvas) { return; }
      this.canvas.addEventListener("touchstart", this.touchStart, false);
      this.canvas.addEventListener("touchend", this.touchEnd, false);
      this.canvas.addEventListener("touchmove", this.touchMove, false);
      this.$_setStyle(this.color, this.lineWidth); // TODO: kind of sketch
    },
    removeTouchEvents () {
      if (!this.canvas) { return; }
      this.canvas.removeEventListener("touchstart", this.touchStart, false);
      this.canvas.removeEventListener("touchend", this.touchEnd, false);
      this.canvas.removeEventListener("touchmove", this.touchMove, false);
    },
    initMouseEvents () {
      if (!this.canvas) { return; }
      this.canvas.addEventListener("mousedown", this.mouseDown, false);
      this.canvas.addEventListener("mouseup", this.mouseUp, false);
      this.canvas.addEventListener("mousemove", this.mouseMove, false);
    },
    removeMouseEvents () {
      if (!this.canvas) { return; }
      this.canvas.removeEventListener("mousedown", this.mouseDown, false);
      this.canvas.removeEventListener("mouseup", this.mouseUp, false);
      this.canvas.removeEventListener("mousemove", this.mouseMove, false);
    }
  }
};
</script>

<style scoped>
#whiteboard {
  position: relative;
  z-index: 5;
}
#myCanvas {
  width: 100%;
  height: 1px;
  background-color: transparent;
  display: block;
}
#background-canvas {
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
