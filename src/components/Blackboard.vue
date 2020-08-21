<template>
  <div>
    <BlackboardCoreDrawing
      :strokesArray="strokesArray" @stroke-drawn="stroke => $emit('stroke-drawn', stroke)"
      :backgroundImage="backgroundImage" @update:background-image="image => $emit('update:background-image', image)"
      :currentTime="currentTime"
      :isRealtime="isRealtime"
      @mounted="blackboardMethods => $emit('mounted', blackboardMethods)"
      @update:thumbnailBlob="blob => $emit('update:thumbnailBlob', blob)"
      @board-reset="$emit('board-reset')"
      :isActive="isActive"
    >
      <template v-slot:canvas-toolbar="{ 
        currentTool,
        isFullScreen,
        changeTool, 
        handleImageFile,
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
          @toggle-fullScreen="toggleFullScreen()"
        >
          <template v-slot:touch-slot>
            <BaseButton @click="setTouchDisabled(!touchDisabled)" icon="mdi-fingerprint">
              {{ touchDisabled ? "Enable" : "Disable" }} touch
            </BaseButton>
          </template>
          
          <template v-slot:record-audio-slot>
            <slot name="blackboard-toolbar">
            
            </slot> 

            <template v-if="currentState === RecordState.PRE_RECORD">

              <!-- SET BACKGROUND IMAGE -->
              <slot name="set-background-button-slot">
                <BaseButton @click="$refs.fileInput.click()" icon="mdi-image">
                  <input 
                    @change="e => handleImageFile(e)" 
                    style="display: none" 
                    type="file" 
                    ref="fileInput"
                  >
                  Set background
                </BaseButton>
              </slot>

              <!-- WIPE BOARD BUTTON -->
              <!-- 
                The slot below allows `RealtimeBlackboard.vue` to override behavior of "Wipe board";
                Instead of wiping immediately, it wait until Firestore resolves the deletion request
                before setting `strokesArray = []` to wipe the UI. 
              -->
              <slot name="wipe-board-button-slot"> 
                <BasePopupButton actionName="Wipe board" @action-do="resetBoard()">
                  <template v-slot:activator-button="{ on }">
                    <BaseButton :on="on" icon="mdi-delete" data-qa="wipe-board">
                      Wipe board
                    </BaseButton>
                  </template>
                  <template v-slot:message-to-user>
                    Are you sure you want to wipe everything?
                  </template> 
                </BasePopupButton>
              </slot> 

              <!-- Record Button -->
              <!-- <BaseButton @click="startRecording()" icon="mdi-adjust" filled>
                Record Audio
              </BaseButton> -->
            </template>

            <!-- Finish Record Button -->
            <BaseButton v-if="currentState === RecordState.MID_RECORD" @click="stopRecording()" icon="mdi-stop" filled>
              Finish Recording
            </BaseButton>
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

 * Maintains the invariant that the UI <canvas/> displays exactly the strokes from `strokesArray`. 
 * Manages its own state i.e. currentTime, strokesArray, audioBlob and imageBlob.
*/
import BlackboardToolBar from "@/components/BlackboardToolBar.vue";
import BlackboardCoreDrawing from "@/components/BlackboardCoreDrawing.vue";
import BlackboardAudioRecorder from "@/components/BlackboardAudioRecorder.vue";
import BaseButton from "@/components/BaseButton.vue";
import BasePopupButton from "@/components/BasePopupButton.vue";
import { RecordState } from "@/CONSTANTS.js";
import { mapState } from "vuex";

export default {
  props: {
    strokesArray: {
      type: Array,
      required: true
    },
    backgroundImage: {
      type: Object
    },
    // TODO: rename this variable
    isRealtime: {
      type: Boolean,
      required: true
    },
    isActive: {
      type: Boolean,
      default () {
        return true
      }
    }
  },
  components: { 
    BlackboardToolBar,
    BlackboardAudioRecorder, 
    BlackboardCoreDrawing,
    BaseButton,
    BasePopupButton
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