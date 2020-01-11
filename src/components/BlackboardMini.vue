<template>
  <div id="whiteboard">
    <!-- APP BAR -->
    <v-app-bar dense>
      <template v-if="currentState != recordingStateEnum.POST_RECORDING">
        <swatches 
          v-model="color"
          :colors="colors"
          :show-border="true"
          :wrapper-style="{ paddingTop: '0px', paddingBottom: '0px', paddingLeft: '40px', height: '30px' }"
          inline
          background-color="rgba(0, 0, 0, 0)"
          swatch-size="40"
        />
        <v-btn 
          v-if="!isRecording"
          @click="wipeBoard()"
          color="red darken-2 white--text"
        >
          CLEAR
          <v-icon dark right>clear</v-icon>
        </v-btn>
        <template v-if="!isRecording">
          <v-btn @click="startRecording()" color="pink white--text" dark>
            RECORD
            <v-icon dark right>fiber_manual_record</v-icon>
          </v-btn>
        </template>
        <v-btn v-else @click="stopRecording()" color="pink white--text">
          STOP VIDEO
        </v-btn>
        <v-btn 
          @click="setImage()"
          color="green white--text"
        >
          SET BACKGROUND
        <input
          @change="handleImage"
          id="whiteboard-bg-input"
          name="whiteboard-bg"
          type="file"
          style="display: none;"
        />
        </v-btn>
      </template>
      <template v-else>
        <v-btn @click="initReplayLogic()">PREVIEW</v-btn>
        <v-btn @click="recordAgain()">RETRY</v-btn>
      </template>
    </v-app-bar>

    <!-- WHITEBOARD -->
    <!-- <canvas 
      id="myCanvas"  
      style="background-repeat: no-repeat; background-size: 100% 100%; background-color: rgb(62, 66, 66); background: url('https://i.imgur.com/8B7L7BR.jpg')">
    </canvas> -->
    <canvas 
      id="myCanvas"  
      style="background-color: rgb(62, 66, 66)"
    ></canvas>
    <!-- "@start-recording" is necessary because the audio-recorder can't 
    start recording instantaneously - and if we falsely believe it is, then `getAudioTime` will be 
    null-->
    <audio-recorder
      v-if="whiteboardDoc"
      v-show="false"
      ref="audio-recorder"
      :audioURL="whiteboardDoc.audioURL"
      :audioPath="whiteboardDoc.audioPath"
      @start-recording="isRecording = true"
      @file-uploaded="audio => $emit('new-audio', audio)"
    />
  </div>
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
import BaseAppBar from "@/components/BaseAppBar.vue"

export default {
  props: {
    hideToolbar: Boolean
  },
  components: {
    AudioRecorder,
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
    }
  },
  created () {
    // this.setImageUpload()
  },
  data () {
    return {
      allStrokes: [],
      currentState: "",
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
    // TODO: scale blackboard correctly across all edge cases
    // this.$root.$on("side-nav-toggled", sideNavOpened => {
    //   if (sideNavOpened) {
    //     this.canvas.width = document.documentElement.clientWidth
    //   } else {
    //     this.canvas.width = document.documentElement.clientWidth
    //   }
    //   this.rescaleCanvas()
    // })
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
      var canvas = document.getElementById('myCanvas');
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
    initTouchEvents () {
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
        points: this.currentStroke
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
        points: this.currentStroke
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
        event.preventDefault() // this line improves drawing performance for Microsoft Surfaces
      }
    },

    getMousePos(e) { // Get the current mouse position relative to the top-left of the canvas
      if (!e)
        var e = event
      if (e.offsetX) {
        this.mouseX = e.offsetX - window.scrollX
        this.mouseY = e.offsetY - window.scrollY
      }
      else if (e.layerX) {
        this.mouseX = e.layerX - window.scrollX
        this.mouseY = e.layerY - window.scrollY
      }
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
#myCanvas {
  width: 100%;
  height: 100%;
}
</style>