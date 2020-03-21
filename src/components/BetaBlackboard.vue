<template>
  <div>
    <BlackboardCanvasDrawing
      @stroke-drawn="(stroke) => save(stroke)"
      ref="BlackboardCanvasDrawing"
    >
      <template v-slot:toolbar-buttons>
        <ButtonNew>Start Recording</ButtonNew>
      </template>
    </BlackboardCanvasDrawing>
    <AudioRecorder v-show="false" 
      @file-uploaded="(audio) => saveFileReference(audio)"
      @audio-recorded="emitVideoData()"
      ref="AudioRecorder"
    />
  </div>
</template>

<script>
/* A functional blackboard that supports saving:
    1. At any point in time, the user can save the blackboard as a replayable silent animation. 
    2. By pressing "record", the user can record a voiced video explanation. 
  This component keeps track of its state i.e. currentTime, strokesArray, audioBlob and imageBlob
*/
import AudioRecorder from "@/components/AudioRecorder.vue";
import BasePopupButton from "@/components/BasePopupButton.vue";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import ButtonNew from "@/components/ButtonNew.vue";
import BlackboardCanvasDrawing from "@/components/BlackboardCanvasDrawing.vue";
import { RecordState } from "@/CONSTANTS.js";

export default {
  props: {
    blackboardId: String,
    visible: Boolean,
  },
  mixins: [
    CanvasDrawMixin, 
    DatabaseHelpersMixin
  ],
  components: { 
    AudioRecorder, 
    BasePopupButton,
    ButtonNew
  },
  data () {
    return {
      strokesArray: [],
      timer: null,
      currentTime: 0,
      currentState: "",
      audioUrl: "",
      hasUploadedAudio: false,
      thumbnailBlob: null
    }
  },
  computed: {
    user () { 
      return this.$store.state.user; 
    }
  },
  methods: {
    save (stroke) {
      this.strokesArray.push({
        
      });
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
      this.$emit("record-start"); // let's Piazza know so it can disable the "submit post" button
    },
    stopRecording () {
      this.stopTimer();
      this.$refs.AudioRecorder.stopRecording();
      this.currentState = RecordState.POST_RECORD;
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
      this.$refs.BlackboardCanvasDrawing.renderBoard(this.strokesArray);
    },
    // TODO: refactor
    async emitVideoData () { 
      this.thumbnailBlob = await this.createThumbnail();
      const videoData = { 
        audio: this.$refs.AudioRecorder.audio, 
        strokes: this.strokesArray,
        imageUrl: this.imageUrl
      };
      this.$emit("record-end", videoData)
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
    uploadAudio () {
      return new Promise(async (resolve) => {
        await this.$refs.AudioRecorder.uploadRecording();
        resolve();
      })
    },
    async resetBoard () {
      this.wipeBoard(); // UI
      this.resetVariables(); // local state
    },
    wipeBoard () {
      this.$refs.BlackboardCanvasDrawing.wipeBoard();
    },
    resetVariables () {
      this.strokesArray = [];
      this.currentTime = 0;
    },
    startTimer () {
      this.currentTime = 0;
      this.timer = setInterval(() => this.currentTime += 0.1, 100);
    },
    stopTimer () { 
      clearInterval(this.timer); 
    }
  }
};
</script>