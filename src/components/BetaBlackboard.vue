<template>
  <div>
    <BlackboardDrawingCanvas 
      :currentTime="currentTime"
      @stroke-drawn="(stroke) => $emit('stroke-drawn', stroke)"
      ref="BlackboardDrawingCanvas"
    >
      <template v-slot:canvas-toolbar="{ changeTool, displayImageFile, wipeBoard }">
        <BlackboardToolBar
          @tool-select="(newTool) => changeTool(newTool)"
          @image-select="(imageFile) => displayImageFile(imageFile)"
          @wipe-board="wipeBoard()"
        >
          <ButtonNew v-if="currentState === RecordState.PRE_RECORD"
            @click="startRecording()" 
            icon="mdi-adjust"
          >
            Record video
          </ButtonNew>
          <ButtonNew v-else-if="currentState === RecordState.MID_RECORD"
            @click="stopRecording()"
            icon="mdi-stop"
          >
            Finish recording
          </ButtonNew>
        </BlackboardToolBar>
      </template>
    </BlackboardDrawingCanvas>

    <BlackboardAudioRecorder
      @audio-recorded=""
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
import BasePopupButton from "@/components/BasePopupButton.vue";
import ButtonNew from "@/components/ButtonNew.vue";
import { RecordState } from "@/CONSTANTS.js";

export default {
  components: { 
    BlackboardToolBar,
    BlackboardAudioRecorder, 
    BlackboardDrawingCanvas,
    BasePopupButton,
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
      this.$emit("record-start"); // let's Piazza know so it can disable the "submit post" button
    },
    stopRecording () {
      clearInterval(this.timer); 
      // TODO: make this a promise
      this.$refs.AudioRecorder.stopRecording();
      this.currentState = RecordState.POST_RECORD;
      this.$emit("record-end");
    },
    getAllData () {
      const { AudioRecorder, BlackboardDrawingCanvas } = this.$refs;
      return {
        strokesArray: BlackboardDrawingCanvas.strokesArray,
        imageBlob: BlackboardDrawingCanvas.getImage(),
        thumbnailBlob: BlackboardDrawingCanvas.getThumbnail(),
        audioBlob: AudioRecorder.audio.blob
      }
    },
    // TODO: refactor
    async emitVideoData () { 
      const { AudioRecorder, BlackboardDrawingCanvas } = this.$refs;
      this.thumbnailBlob = await BlackboardDrawingCanvas.createThumbnail();
      const videoData = { 
        audioBlob: AudioRecorder.audio.blob, 
        strokesArray: this.strokesArray,
        imageUrl: this.imageUrl
      };
      this.$emit("record-end", videoData)
    },
    tryRecordAgain () {
      this.currentTime = 0;
      // modify timestamps so last round's strokes will persist as the initial setup of this round's recording
      for (const stroke of this.strokesArray) {
        [stroke.startTime, stroke.endTime] = [0, 0];
      }
      this.currentState = RecordState.PRE_RECORD;
      const { BlackboardDrawingCanvas } = this.$refs;
      BlackboardDrawingCanvas.strokesArray = this.strokesArray;
      BlackboardDrawingCanvas.renderInitialStrokes();
    },
  }
};
</script>