<template>
  <div>
    <BlackboardCoreDrawing
      :sizeAndOrientationMode="sizeAndOrientationMode"
      :strokesArray="strokesArray" @stroke-drawn="stroke => $emit('stroke-drawn', stroke)"
      :backgroundImage="backgroundImage" @update:background-image="image => $emit('update:background-image', image)"
      :currentTime="currentTime"
      @mounted="blackboardMethods => $emit('mounted', blackboardMethods)"
      @update:thumbnailBlob="blob => $emit('update:thumbnailBlob', blob)"
      @board-reset="$emit('board-reset')"
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
            <BaseButton @click="setTouchDisabled(!touchDisabled)" :icon=" touchDisabled ? 'mdi-pencil-lock' : 'mdi-gesture-tap'" color="black" small>

            </BaseButton>
          </template>
    
          <template v-slot:record-audio-slot>
            <template v-if="currentState === RecordState.PRE_RECORD">
              <slot name="blackboard-toolbar">
            
              </slot> 

              <BaseButton @click="startRecording()" icon="mdi-record" color="secondary">
                Record 
              </BaseButton>
            </template>

            <BaseButton v-if="currentState === RecordState.MID_RECORD" 
              @click="stopRecording()" 
              color="secondary" icon="mdi-stop"
            >
              Finish
            </BaseButton>
          </template>

          <!-- More actions slot -->
          <template v-slot:more-actions-slot>
            <v-menu v-model="isMenuOpen" bottom nudge-left offset-y>
              <template v-slot:activator="{ on }">
                 <!-- Cannot let user wipe board / reupload background image while recording -->
                <v-btn v-if="currentState !== RecordState.MID_RECORD" 
                  @click="isMenuOpen = true" 
                  icon
                >
                  <v-icon>mdi-dots-vertical</v-icon>
                </v-btn>
              </template>
              
              <v-list>
                <!-- SET BACKGROUND IMAGE -->
                <slot name="set-background-button-slot">
                  <v-list-item @click="$refs.fileInput.click()">
                    <input 
                      @change="e => handleImageFile(e)" 
                      style="display: none" 
                      type="file" 
                      ref="fileInput"
                    >
                    <v-icon left>mdi-image</v-icon> Set background
                  </v-list-item>
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
                      <BaseButton :on="on" icon="mdi-delete" small>
                        Wipe board
                      </BaseButton>
                    </template>
                    <template v-slot:message-to-user>
                      Are you sure you want to wipe everything?
                    </template> 
                  </BasePopupButton>
                </slot> 
              </v-list>
            </v-menu>
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
import { mapState, mapGetters } from "vuex";

export default {
  props: {
    strokesArray: {
      type: Array,
      required: true
    },
    backgroundImage: {
      type: Object
    },
    sizeAndOrientationMode: {
      type: String,
      default () {
        return "landscape";
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
      RecordState,
      isMenuOpen: false
    };
  },
  computed: {
    ...mapState([
      "user"
    ]),
    ...mapGetters([
      "isAdmin"
    ]),
    isRecording () {
      return this.currentState === RecordState.MID_RECORD; 
    }
  },
  watch: {
    currentTime () {
      this.$emit("update:currentTime", this.currentTime);
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
        () => this.currentTime += 0.1,
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