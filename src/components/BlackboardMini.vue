<template>
  <v-card id="whiteboard" outlined elevation="1">
    <!-- SNACKBAR -->
    <v-snackbar v-model="snackbar">
      {{ snackbarMessage }}
      <v-btn @click="snackbar = false" color="pink" text>
        CLOSE
      </v-btn>
    </v-snackbar>

      <!-- APP BAR -->
      <v-app-bar dense color="#eee" elevation="1" class="blackboard-toolbar">
        <template v-if="currentState != recordingStateEnum.POST_RECORDING">
          <v-container class="py-1 px-0">
            <v-row align="center" justify="space-between">
              <v-col class="py-0">
                <v-row justify="start" align="center">
                  <v-col class="px-1 py-0" cols="auto">
                    <div :class="[smallScreen? 'dropdown ':'', palleteVisibility? 'active ':'', 'd-flex',]" id="swatches-wrapper"
                        @click="swatchClick()">
                      <v-btn 
                        :color="(!smallScreen || palleteVisibility || eraserActive)? 'accent lighten-1':color"
                        @click="palleteClick()"
                        :outlined="eraserActive? true:false"
                        min-width="36px"
                        class="px-3"
                        height="38px"
                        max-width="64px"
                      >
                        <v-icon>mdi-lead-pencil</v-icon>
                        <v-icon class="down">keyboard_arrow_down</v-icon>
                      </v-btn>
                      <swatches 
                        v-model="color"
                        :colors="colors"
                        :show-border="true"
                        :wrapper-style="{ padding:'0px', maxHeight:'26px', display:'flex' }"
                        :swatch-style="{margin:'0 5px', borderRadius:'50%'}"
                        inline
                        background-color="rgba(0, 0, 0, 0)"
                        swatch-size="26"
                      />
                    </div>
                  </v-col>
                  <v-col class="py-0 px-0" cols="auto">
                    <v-btn 
                      @click="eraserClick()"
                      :outlined="eraserActive? false:true"
                      color="accent lighten-1"
                      class="board-action-btn normal-text"
                    >
                      <span class="d-none d-md-block mr-2">Eraser</span>
                      <v-icon>mdi-eraser</v-icon>
                    </v-btn>
                  </v-col>
                  <v-col class="py-0 px-0" cols="auto">
                    <v-btn 
                      @click="setImage()"
                      outlined
                      color="accent lighten-1"
                      class="board-action-btn normal-text"
                    >
                      <span class="d-none d-md-block mr-2">Background</span>
                      <v-icon>image</v-icon>
                    <input
                      @change="handleImage"
                      id="whiteboard-bg-input"
                      name="whiteboard-bg"
                      type="file"
                      style="display: none;"
                    />
                    </v-btn>
                  </v-col>
                </v-row>
              </v-col>
              <v-col cols="auto" class="py-0 px-0">
                <template v-if="!isRecording">
                  <v-btn 
                    v-if="!isRecording"
                    @click="wipeBoard()"
                    outlined
                    color="red"
                    class="board-action-btn normal-text"
                  >
                    <span class="d-none d-lg-block mr-2">Clear</span>
                    <v-icon>clear</v-icon>
                  </v-btn>
                  <v-btn @click="startRecording()" 
                  color="accent lighten-1"
                  class="board-action-btn">
                    <span class="d-none d-sm-block mr-2">Record</span>
                    <v-icon>adjust</v-icon>
                  </v-btn>
                </template>
                <v-btn v-else @click="stopRecording()" color="pink white--text">
                  STOP VIDEO
                </v-btn>
              </v-col>
            </v-row>
          </v-container>
        </template>
        <template v-else>
          <v-btn @click="initReplayLogic()">PREVIEW</v-btn>
          <v-btn @click="recordAgain()">RETRY</v-btn>
          <!-- <v-btn @click="handleSaving('No title yet')" :disabled="!hasUploadedAudio" class="pink white--text">
            SAVE VIDEO
          </v-btn> -->
        </template>
      </v-app-bar>

      <!-- WHITEBOARD -->
      <div id="blackboard-wrapper" v-resize="blackboardSize">
        <canvas id="myCanvas">
        </canvas>
        <canvas id="background-canvas"></canvas>
      </div>

      <!-- "@start-recording" is necessary because the audio-recorder can't 
      start recording instantaneously - and if we falsely believe it is, then `getAudioTime` will be 
      null-->
      <AudioRecorderMini
        v-show="false"
        ref="audio-recorder"
        @start-recording="isRecording = true"
        @file-uploaded="audioObj => this.audioObj = audioObj"
      />

  </v-card>
</template>

<script>
import { mapState } from 'vuex'
import firebase from 'firebase/app'
import 'firebase/functions'
import slugify from 'slugify'
import db from '@/database.js'
import DrawMethods from '@/mixins/DrawMethods.js'
import Swatches from 'vue-swatches'
import 'vue-swatches/dist/vue-swatches.min.css'
import AudioRecorder from '@/components/AudioRecorder.vue'
import AudioRecorderMini from "@/components/AudioRecorderMini.vue"
import BaseAppBar from "@/components/BaseAppBar.vue"

export default {
  props: {
    allStrokes: Array,
    hideToolbar: Boolean,
    height: String,
    visible: Boolean
  },
  components: {
    AudioRecorderMini,
    Swatches,
    BaseAppBar
  },
  mixins: [DrawMethods],
  computed: {
    ...mapState(['user']),
    author () {
      if (this.user) {
        if (this.user.name) {
          return {
            name: this.user.name,
            uid: this.user.uid
          }
        } else {
          return {
            email: this.user.email,
            uid: this.user.uid
          }
        }
      } else {
        return {
          name: 'Anonymous',
          uid: 'Anonymous'
        }
      }
    },
  },
  data () {
    return {
      allStrokes: [],
      currentState: "",
      audioObj: {},
      recordingStateEnum: {
        PRE_RECORDING: "pre-recording",
        MID_RECORDING: "mid-recording",
        POST_RECORDING: "post-recording"
      },
      whiteboardDoc: null,
      color: 'white',
      lineWidth: 2,
      colors: ['white', 'orange', '#0AF2F2', 'deeppink', 'rgb(62, 66, 66)'],
      disableTouch: false,
      isRecording: false,
      stylus: false, 
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
      redrawTimeout: null, // needed for mixins/DrawMethods.js TODO: consider declaring it in the data () section of DrawMethods.js instead,
      hasUploadedAudio: false,
      mouseX : 0,
      mouseY : 0,
      mousedown : 0,
      clearRectTimeout: null,
      snackbar: false,
      snackbarMessage: "",
      smallScreen: window.innerWidth<960,
      palleteVisibility: false,
      eraserActive: false
    }
  },
  watch: {
    whiteboardID: {
      handler: 'initData',
      immediate: true
    },
    // detects when user switches from the eraser back to drawing (TODO: high surface area for bugs)
    color () {
      if (this.color != 'rgb(62, 66, 66)') { // eraser color stroke width is larger
        this.lineWidth = 2
      } else {
        this.lineWidth = 30
      }
      this.setStyle(this.color, this.lineWidth)
    },
    isRecording () {
      if (this.isRecording) {
        this.startTimer()
      } else {
        this.stopTimer()
      }
    },
    whiteboardDoc (newVal) {
      // TODO: this gets triggered 2x more often than I expect, find out why
      if (newVal) {
        if (!newVal.isAnswered || this.canvas || this.ctx) {
          this.initTouchEvents()
          this.initMouseEvents()
        }
      }
    },
    eraserActive() {
      this.customCursor()
      this.canvas.getContext("2d").globalCompositeOperation=this.eraserActive?'destination-out':'source-over'
      this.lineWidth=this.eraserActive?10:2
    },
    color(){
      this.customCursor()
    },
    visible() {
      this.blackboardSize()
    },
  },
  mounted () {  // the mounted() hook is never called for subsequent switches between whiteboards
    this.canvas = document.getElementById('myCanvas')
    this.ctx = this.canvas.getContext('2d')
    // calculate appropriate height for blackboard given the width available
    // note that sidenav width = 200, BaseList width = 300
    const height = 9/16 * (window.innerWidth - 500)
    this.canvas.height = height - 48 // the blackboard's top-app-bar is 48px high
    this.rescaleCanvas()
    window.addEventListener('resize', this.rescaleCanvas, false)
    this.initTouchEvents()
    this.initMouseEvents()
    document.fonts.ready.then(()=>this.customCursor()); //since cursor uses material icons font, load it after fonts are ready
    this.blackboardSize()
    window.addEventListener("resize", this.blackboardToolbar);
    window.addEventListener("orientationchange", this.blackboardToolbar);
    window.addEventListener("click", e=>this.palleteClose(e));
    // USE THIS TO ENSURE THE BLACKBOARD SCALES CORRECTLY
    // this.$root.$on("side-nav-toggled", sideNavOpened => {
    //   if (sideNavOpened) {
    //     this.canvas.width = document.documentElement.clientWidth
    //   } else {
    //     this.canvas.width = document.documentElement.clientWidth
    //   }
    //   this.rescaleCanvas()
    // })
  },
  destroyed() {
    window.removeEventListener("resize", this.blackboardToolbar);
    window.removeEventListener("orientationchange", this.blackboardToolbar);
    window.removeEventListener('resize', this.rescaleCanvas);
    window.removeEventListener("click", e=>this.palleteClose(e));
  },
  methods: {
    wipeBoard () {
      if (this.ctx) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
      }
      this.allStrokes = []
    },
    setImage () {
      document.getElementById('whiteboard-bg-input').click()
    },
    handleImage (e) {
      var canvas = document.getElementById('background-canvas');
      var ctx = canvas.getContext('2d');
      var reader = new FileReader();
      var vue = this
      reader.onload = function(event){
          var img = new Image();
          img.onload = function(){
              ctx.drawImage(img,0,0);
          }
          img.src = event.target.result;
          var uri = canvas.toDataURL('image/png'),
          boardImage = uri.replace(/^data:image.+;base64,/, '');
          vue.$emit('board-image', boardImage);
      }
      reader.readAsDataURL(e.target.files[0]);
    },
    toggleDrawer () {
      this.$root.$emit("toggle-drawer")
    },
    // takePicture () {
    //   const dataURL = this.canvas.toDataURL()
    // },
    async initData () {
      this.wipeBoard()
      this.currentState = this.recordingStateEnum.PRE_RECORDING 
    },
    resetVariables () {
      this.lastX = -1
    },
    // TODO: keep track of aspect ratio to ensure a high quality viewing experience
    // getAspectRatio () {
    //   return this.canvas.scrollHeight / this.canvas.scrollWidth
    // },
    startTimer () {
      this.currentTime = 0 
      this.timer = setInterval(() => this.currentTime += 0.1, 100)
    },
    stopTimer () {
      clearInterval(this.timer)
    },
    initReplayLogic () {
      this.quickplay()
    },
    
    Events () {
      this.canvas.addEventListener('touchstart', this.touchStart, false)
      this.canvas.addEventListener('touchend',this.touchEnd, false)
      this.canvas.addEventListener('touchmove', this.touchMove, false)
      this.setStyle(this.color, this.lineWidth)
    },
    removeTouchEvents () {
      this.canvas.removeEventListener('touchstart', this.touchStart, false)
      this.canvas.removeEventListener('touchend', this.touchEnd, false)
      this.canvas.removeEventListener('touchmove', this.touchMove, false)
    },
    initMouseEvents() {
      // TODO: implement mouseUp, mouseDown, mouseMove
      this.canvas.addEventListener('mouseup', this.mouseUp, false);
      this.canvas.addEventListener('mousedown', this.mouseDown, false);
      this.canvas.addEventListener('mousemove', this.mouseMove, false);
    },
    removeMouseEvents() {
      this.canvas.removeEventListener('mouseup', this.mouseUp, false);
      this.canvas.removeEventListener('mousedown', this.mouseDown, false);
      this.canvas.removeEventListener('mousemove', this.mouseMove, false);
    },
    convertAndSavePoint (x, y) {
      const unitX = parseFloat(x / this.canvas.width).toFixed(4)
      const unitY = parseFloat(y / this.canvas.height).toFixed(4)
      this.currentStroke.push({ unitX, unitY })
      this.drawToPoint(x, y);
    },
    touchStart (e) {
      e.preventDefault()
      this.palleteVisibility=false
      if (this.isNotValidTouch(e)) { 
        return 
      }
      if (e.touches[0].touchType == 'stylus') {
        this.disableTouch = true
      } 
      this.drawToPointAndSave(e)
      if (this.isRecording) {
        this.startTime = this.currentTime.toFixed(1) // this.startTime keeps track of current stroke's startTime
      }
    },
    touchMove (e) {
      e.preventDefault()
      if (this.isNotValidTouch(e)) { 
        return 
      }
      this.drawToPointAndSave(e)
    },
    touchEnd (e) {
      e.preventDefault()
      if (this.currentStroke.length == 0) {
        return // user is touching the screen despite that touch is disabled
      }
      const strokeNumber = this.allStrokes.length + 1
      const stroke = {
        strokeNumber,
        author: this.author || 'anonymous',
        color: this.color,
        lineWidth: this.lineWidth,
        startTime: Number(this.startTime),
        endTime: Number(this.currentTime.toFixed(1)),
        points: this.currentStroke,
        isErasing: this.eraserActive
      }
      this.allStrokes.push(stroke)
      // reset 
      this.currentStroke = []
      this.lastX = -1
    },
    drawToPointAndSave (e) {
      this.getTouchPos(e)
      this.convertAndSavePoint(this.touchX, this.touchY)
      this.drawToPoint(this.touchX, this.touchY)
    },
    getTouchPos (e) {
      const finger1 = e.touches[0] 
      this.touchX = finger1.pageX - this.canvas.getBoundingClientRect().left - window.scrollX
      this.touchY = finger1.pageY - this.canvas.getBoundingClientRect().top - window.scrollY
    },
    isNotValidTouch (e) {
      // multiple fingers not allowed 
      if (e.touches.length != 1) {
        return true
      }
      if (this.isFinger(e) && this.disableTouch) {
        return true
      } else {
        return false 
      }
    },
    isFinger (e) {
      if (e.touches[0].touchType != 'stylus') {
        return true 
      } 
      return false
    },

    // --- Mouse Drawing --- // 
    mouseDown(e) {
      this.mousedown=1;
      this.palleteVisibility=false

      // referenced from touchStart
      this.setStyle(this.color, this.lineWidth);
      this.getMousePos(e);
      this.convertAndSavePoint(this.mouseX, this.mouseY);
      this.drawToPoint(this.mouseX, this.mouseY);
      if (this.isRecording) {
        this.startTime = this.currentTime.toFixed(1)
      }
      event.preventDefault();
    },

    mouseUp(e) {
      this.mousedown=0;
      // referenced from touchEnd
      const strokeNumber = this.allStrokes.length + 1
      // save
      const stroke = {
        strokeNumber,
        author: this.author || 'anonymous',
        color: this.color,
        lineWidth: this.lineWidth,
        startTime: Number(this.startTime),
        endTime: Number(this.currentTime.toFixed(1)),
        points: this.currentStroke,
        isErasing: this.eraserActive
      }
      this.allStrokes.push(stroke)
      // reset 
      this.currentStroke = [];
      this.lastX = -1;
    },

    mouseMove(e) { // Update the mouse co-ordinates when moved
      this.getMousePos(e);

      // Draw a pixel if the mouse button is currently being pressed 
      if (this.mousedown == 1) { 
        // referenced from touchMove
        this.getMousePos(e);
        this.convertAndSavePoint(this.mouseX, this.mouseY);
        this.drawToPoint(this.mouseX, this.mouseY);
        e.preventDefault() // this line improves drawing performance for Microsoft Surfaces
      }
    },

    getMousePos(e) { // Get the current mouse position relative to the top-left of the canvas
      if (!e)
        var e = event
      if (e.offsetX) {
        this.mouseX = e.offsetX; //- window.scrollX
        this.mouseY = e.offsetY; // - window.scrollY (in case these don't work)
      }
      else if (e.layerX) {
        this.mouseX = e.layerX; 
        this.mouseY = e.layerY;
      }
      // To get the pixel data of the canvas
      // var c = document.getElementById('myCanvas');
      // var pixelData = this.canvas.getContext('2d').getImageData(e.offsetX, e.offsetY, 1, 1).data;
      // console.log(pixelData)
    },
    // --- END Mouse Drawing --- // 
    useEraser () {
      this.color = 'rgb(62, 66, 66)'
      this.lineWidth = 18
    },
    startRecording () {
      this.currentState = this.recordingStateEnum.MID_RECORDING
      const audioRecorder = this.$refs['audio-recorder']
      audioRecorder.startRecording()
    },
    stopRecording () {
      this.currentState = this.recordingStateEnum.POST_RECORDING
      this.isRecording = false
      this.removeTouchEvents()
      this.removeMouseEvents()
      const audioRecorder = this.$refs['audio-recorder']
      audioRecorder.stopRecording()
    },
    recordAgain () {
      this.currentTime = 0 
      this.hasUploadedAudio = false
      this.currentState = this.recordingStateEnum.PRE_RECORDING
    },
    blackboardToolbar() {
      this.smallScreen= window.innerWidth<960;
    },
    palleteClick() {
      if (this.eraserActive) {
        this.palleteVisibility=false;
      } else {
        this.palleteVisibility=!this.palleteVisibility;
      }
    },
    swatchClick(){
      this.eraserActive=false;
    },
    eraserClick() {
      this.eraserActive=true;
      this.palleteVisibility=false;
    },
    palleteClose(e) {
      var pallete = document.getElementById('swatches-wrapper');
      if (!pallete.contains(e.target)) {
        this.palleteVisibility=false
      }
    },
    customCursor() {
      var dummy_canvas = document.createElement("canvas");
      dummy_canvas.width = 24;
      dummy_canvas.height = 24;
      var ctx = dummy_canvas.getContext("2d");
      ctx.fillStyle = this.eraserActive?"#fff":this.color;
      ctx.font = "24px 'Material Design Icons'";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(this.eraserActive?"\uF1FE":"\uF64F", 12, 12);
      var dataURL = dummy_canvas.toDataURL('image/png')
      document.getElementById("myCanvas").style.cursor='url('+dataURL+') 0 24, auto';
    },
    blackboardSize() {
      var board=document.getElementById('myCanvas');
      board.style.height=document.getElementById('blackboard-wrapper').offsetWidth*9/16+'px'
    }
    // saveFileReference({ url, path }) {
    //   this.hasUploadedAudio = true
    //   const ID = this.whiteboardDoc['.key']
    //   db.collection('whiteboards').doc(ID).update({
    //     audioURL: url,
    //     audioPath: path
    //   })
    // }
  }
}
</script>

<style scoped>
#blackboard-wrapper {
  position: relative;
  z-index: 10;
}
#myCanvas {
  width: 100%;
  height: 100%;
  background-repeat: no-repeat;
  background-size: 100% 100%;
  background-color: transparent;
  box-shadow: 0 0 10px rgba(0,0,0,0.25) inset;
}
#background-canvas {
  position: absolute;
  top:0;
  left:0;
  width: 100%;
  height: 100%;
  background-repeat: no-repeat;
  background-color: rgb(62, 66, 66);
  background-size: 100% 100%;
  z-index:-1;
}
@media (max-width:350px), (min-width:600px) and (max-width:670px), (min-width:1264px) and (max-width:1300px) {
  .blackboard-toolbar {
    zoom: 0.95;
  }
}
@media (min-width:960px) and (max-width:1050px) {
  .blackboard-toolbar {
    zoom: 0.9;
  }
}
#swatches-wrapper {
  position: relative;
}
#swatches-wrapper .vue-swatches {
  border: 1px solid #F03C02;
  border-radius: 0 10px 10px 0;
}
#swatches-wrapper button{
  border-radius:9px 0 0 9px;
  border: 1px solid #F03C02 !important;
}
#swatches-wrapper button .v-icon.down {
  display: none;
}
#swatches-wrapper.dropdown button {
  border-radius: 10px;
  left:0;
  padding: 0 8px;
}
#swatches-wrapper.dropdown button .v-icon {
  display: block;
}
#swatches-wrapper.dropdown .vue-swatches {
  display: none;
}
#swatches-wrapper.dropdown.active > * {
  box-shadow: 0 0 10px rgba(0,0,0,0.25);
}
#swatches-wrapper.dropdown.active button {
  border-radius:10px 10px 0 0;
}
#swatches-wrapper.dropdown.active .vue-swatches {
  display: block;
  position: absolute;
  top: 38px;
  left: 0;
  background: white;
  border-radius: 0 10px 10px 10px;
}
button {
  min-width: 36px !important;
}
.board-action-btn {
  margin: 0 5px;
}
.board-action-btn .v-icon {
  margin: 0 -6px;
}
.v-icon {
  font-size: 20px;
}
.board-action-btn.normal-text {
  letter-spacing: unset;
  text-transform: unset;
  font-size: 0.9em;
}
</style>