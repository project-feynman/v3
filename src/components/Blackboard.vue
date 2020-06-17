<template>
  <div>
    <BlackboardCoreDrawing
      :strokesArray="strokesArray"
      @stroke-drawn="stroke => $emit('stroke-drawn', stroke)"
      :currentTime="currentTime"
      :isRealtime="isRealtime"
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
        <!-- TODO: refactor resetBoard() -->
        <BlackboardToolBar
          :currentTool="currentTool.type"
          :isFullScreen="isFullScreen"
          @tool-select="newTool => changeTool(newTool)"
          @image-select="imageFile => displayImageFile(imageFile)"
          @wipe-board="resetBoard()"
          @toggle-fullScreen="toggleFullScreen()"
        >
          <template v-slot:touch-slot>
            <ButtonNew @click="toggleTouchDrawing()" icon="mdi-fingerprint">
              {{ touchDisabled ? "Enable" : "Disable" }} Touch
            </ButtonNew>
          </template>

          <template v-slot:record-audio-slot>
            <slot name="blackboard-toolbar"> 

            </slot> 
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
          </template>
        </BlackboardToolBar>
      </template>
    </BlackboardCoreDrawing>

    <BlackboardAudioRecorder
      @audio-recorded="audioObj => handleNewRecording(audioObj)"
      ref="AudioRecorder"
    />
  </div>
</template>

<script>
/** 
 * A functional blackboard that supports saving and recording:
    - Saving: The user can save the state of the blackboard as a replayable animation. 
    - Recording: By pressing "record", the user can record a voiced video explanation. 

 * Maintains the invariant that the UI <canvas/> contains exactly the strokes from `strokesArray`. 
 * Manages its own state i.e. currentTime, strokesArray, audioBlob and imageBlob.
*/
import BlackboardToolBar from "@/components/BlackboardToolBar.vue";
import BlackboardCoreDrawing from "@/components/BlackboardCoreDrawing.vue";
import BlackboardAudioRecorder from "@/components/BlackboardAudioRecorder.vue";
import ButtonNew from "@/components/ButtonNew.vue";
import { RecordState } from "@/CONSTANTS.js";
import { mapState } from "vuex";

export default {
  props: {
    strokesArray: {
      type: Array,
      required: true
    },
    isRealtime: {
      type: Boolean,
      required: true
    }
  },
  components: { 
    BlackboardToolBar,
    BlackboardAudioRecorder, 
    BlackboardCoreDrawing,
    ButtonNew
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
    ...mapState([
      "user"
    ])
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
      return new Promise(async resolve => {
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
      return [...this.strokesArray]; // use a defensive copy to avoid rep exposure / client mutating the array
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
    toggleTouchDrawing () {
      this.$refs.BlackboardDrawingCanvas.touchDisabled = !this.$refs.BlackboardDrawingCanvas.touchDisabled;
    }
  }
};
</script>