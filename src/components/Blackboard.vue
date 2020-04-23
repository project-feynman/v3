<template>
  <div>
    <slot name="database-listener"
      :drawStrokeOnCanvas="drawStrokeOnCanvas"
      :wipeBoard="wipeBoard"
      :resetBoard="resetBoard"
    >

    </slot>
    <BlackboardDrawingCanvas 
      :currentTime="currentTime"
      :isRealtime="isRealtime"
      @stroke-drawn="(stroke) => $emit('stroke-drawn', stroke)"
      @board-reset="$emit('board-reset')"
      ref="BlackboardDrawingCanvas"
    >
      <template v-slot:canvas-toolbar="{ 
        currentTool,
        isFullScreen,
        changeTool, 
        displayImageFile, 
        resetBoard,
        toggleFullScreen,
        touchDisabled
      }"
      >
        <BlackboardToolBar
          :currentTool="currentTool.type"
          :isFullScreen="isFullScreen"
          @tool-select="(newTool) => changeTool(newTool)"
          @image-select="(imageFile) => displayImageFile(imageFile)"
          @wipe-board="resetBoard()"
          @toggle-fullScreen="toggleFullScreen()"
        >
          <slot name="blackboard-toolbar"> 

          </slot> 
          <ButtonNew @click="toggleTouchDrawing()" icon="mdi-fingerprint">
            {{ touchDisabled ? "Enable" : "Disable" }} Touch
          </ButtonNew>

          <ButtonNew v-if="currentState === RecordState.PRE_RECORD"
            @click="startRecording()" 
            icon="mdi-adjust"
            filled
          >
            Record Audio
          </ButtonNew>

          <ButtonNew v-else-if="currentState === RecordState.MID_RECORD"
            @click="stopRecording()"
            icon="mdi-stop"
            filled
          >
            Finish Recording
          </ButtonNew>
        </BlackboardToolBar>
      </template>
    </BlackboardDrawingCanvas>

    <BlackboardAudioRecorder
      @audio-recorded="(audioObj) => handleNewRecording(audioObj)"
      ref="AudioRecorder"
    />
  </div>
</template>

<script>
/* A functional blackboard that supports saving and recording:
    - Saving: The user can save the state of the blackboard as a replayable animation. 
    - Recording: By pressing "record", the user can record a voiced video explanation. 
  This component manages its own state i.e. currentTime, strokesArray, audioBlob and imageBlob
*/
import BlackboardToolBar from "@/components/BlackboardToolBar.vue";
import BlackboardDrawingCanvas from "@/components/BlackboardDrawingCanvas.vue";
import BlackboardAudioRecorder from "@/components/BlackboardAudioRecorder.vue";
import ButtonNew from "@/components/ButtonNew.vue";
import { RecordState } from "@/CONSTANTS.js";

export default {
  props: {
    isRealtime: Boolean
  },
  components: { 
    BlackboardToolBar,
    BlackboardAudioRecorder, 
    BlackboardDrawingCanvas,
    ButtonNew,
  },
  data () {
    return {
      timer: null,
      currentTime: 0,
      currentState: RecordState.PRE_RECORD,
      RecordState
    }
  },
  computed: {
    user () { 
      return this.$store.state.user; 
    }
  },
  methods: {
    async startRecording () {
      await this.$refs.AudioRecorder.startRecording();
      this.currentTime = 0;
      this.timer = setInterval(() => this.currentTime += 0.1, 100);   
      this.currentState = RecordState.MID_RECORD;
      this.$emit("record-start"); // inform the parent to disable the "submit post" button
    },
    stopRecording () {
      clearInterval(this.timer); 
      // after calling `stopRecording()`, some time is needed before
      // the new recording is ready, and we'll handle it in `handleNewRecording()`
      this.$refs.AudioRecorder.stopRecording(); 
    },
    handleNewRecording (audioObj) {
      this.currentState = RecordState.POST_RECORD;
      this.$emit("record-end", this.getBlackboardData);
    },
    async getBlackboardData () {
      return new Promise(async (resolve) => {
        const { AudioRecorder, BlackboardDrawingCanvas } = this.$refs;
        const thumbnailBlob = await BlackboardDrawingCanvas.getThumbnail();
        resolve({
          strokesArray: BlackboardDrawingCanvas.strokesArray,
          imageBlob: BlackboardDrawingCanvas.imageBlob,
          audio: AudioRecorder.audio,
          thumbnailBlob
        });
      });
    },
    getStrokesArray () {
      return this.$refs.BlackboardDrawingCanvas.strokesArray;
    },
    getImageBlob () {
      return this.$refs.BlackboardDrawingCanvas.imageBlob;
    },
    getThumbnail () {
      return this.$refs.BlackboardDrawingCanvas.getThumbnail();
    },
    tryRecordAgain () {
      this.currentTime = 0;
      const { BlackboardDrawingCanvas } = this.$refs;
      BlackboardDrawingCanvas.convertAllStrokesToBeInitialStrokes();
      this.currentState = RecordState.PRE_RECORD;
    },
    drawStrokeOnCanvas (stroke, drawInstantly = true) {
      // TODO: add timestamp so online recording also works
      const { BlackboardDrawingCanvas } = this.$refs;
      BlackboardDrawingCanvas.appendToStrokesArray(stroke);
      if (drawInstantly) {
        BlackboardDrawingCanvas.$_drawStroke(stroke); 
      } else {
        const { $_getPointDuration } = BlackboardDrawingCanvas;
        BlackboardDrawingCanvas.$_drawStroke(stroke, $_getPointDuration(stroke))
      }
    },
    resetBoard () {
      this.$refs.BlackboardDrawingCanvas.resetBoard();
    },
    wipeBoard () {
      this.$refs.BlackboardDrawingCanvas.wipeBoard();
    },
    toggleTouchDrawing () {
      this.$refs.BlackboardDrawingCanvas.touchDisabled = !this.$refs.BlackboardDrawingCanvas.touchDisabled;
    }
  }
};
</script>