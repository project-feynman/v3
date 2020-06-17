<template>
  <div>
    <BlackboardCoreDrawing
      :strokesArray="strokesArray" @stroke-drawn="stroke => $emit('stroke-drawn', stroke)"
      :currentTime="currentTime"
      :isRealtime="isRealtime"
      @mounted="getThumbnailBlob => $emit('mounted', getThumbnailBlob)"
      @update:thumbnailBlob="blob => $emit('update:thumbnailBlob', blob)"
      @update:bgImageBlob="blob => $emit('update:bgImageBlob', blob)"
      @board-reset="$emit('board-reset')"
    >
      <template v-slot:canvas-toolbar="{ 
        currentTool,
        isFullScreen,
        changeTool, 
        displayImageFile, 
        resetBoard,
        toggleFullScreen,
        setTouchDisabled,
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
            <ButtonNew @click="setTouchDisabled(!touchDisabled)" icon="mdi-fingerprint">
              {{ touchDisabled ? "Enable" : "Disable" }} Touch
            </ButtonNew>
          </template>
          
          <template v-slot:record-audio-slot>
          <slot name="blackboard-toolbar">
          </slot> 
          
          <ButtonNew v-if="!isRecording" @click="startRecording()" icon="mdi-adjust" filled>
            Record Audio
          </ButtonNew>
          <ButtonNew v-else @click="stopRecording()" icon="mdi-stop" filled>
            Finish Recording
          </ButtonNew>
          </template>
        </BlackboardToolBar>
      </template>
    </BlackboardCoreDrawing>

    <BlackboardAudioRecorder
      @created="({ startRecording, stopRecording }) => bindAudioRecorderMethods(startRecording, stopRecording)"
      @update:audioBlob="blob => $emit('update:audioBlob', blob)"
      @audio-recorded="audioObj => handleNewRecording(audioObj)"
    />
  </div>
</template>

<script>
/** 
 * An enhanced blackboard that supports audio recording.
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
      audioRecorder: {
        startRecording: null,
        stopRecording: null
      },
      timer: null,
      currentTime: 0,
      currentState: RecordState.PRE_RECORD,
      RecordState
    };
  },
  computed: {
    ...mapState([
      "user"
    ]),
    isRecording () {
      return this.currentState === RecordState.MID_RECORD; 
    }
  },
  methods: {
    bindAudioRecorderMethods (startRecording, stopRecording) {
      this.audioRecorder.startRecording = startRecording;
      this.audioRecorder.stopRecording = stopRecording;
    },
    async startRecording () {
      this.audioRecorder.startRecording();
      this.currentTime = 0;
      this.timer = setInterval(
        () => { 
          this.currentTime += 0.1;
          this.$emit("update:currentTime", this.currentTime);
        }, 
        100
      );   
      this.currentState = RecordState.MID_RECORD;
      this.$emit("record-start"); // inform the parent to disable the "submit post" button
    },
    async stopRecording () {
      clearInterval(this.timer); 
      await this.audioRecorder.stopRecording(); 
      this.currentState = RecordState.POST_RECORD; 
      this.$emit("record-end"); 
    }
  }
};
</script>