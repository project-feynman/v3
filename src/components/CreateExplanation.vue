<template>
  <v-card>
    <v-container fluid>
      <!-- Text editor -->
      <TextEditor ref="TextEditor" :key="`editor-${changeKeyToForceReset}`"/>
      <p class="red--text">{{ messageToUser }}</p>
      <div v-if="(newExplanationDbRef || postDbRef)" class="d-flex align-center">
        <v-btn v-if="user && !isUploadingPost"
          @click="submitPost()" 
          :loading="isButtonDisabled" 
          :disabled="isButtonDisabled"
          color="secondary" 
          class="ma-0 white--text" 
        >
          SUBMIT {{ isAnonymous ? "anonymously" : `as ${user.firstName}` }}
          <v-icon class="pl-2">mdi-send</v-icon>
          <template v-slot:loader>
            <span v-if="isRecordingVideo">Recording...</span> 
            <span v-else-if="isUploadingPost">Uploading...</span>
          </template>
        </v-btn>
        <v-spacer></v-spacer>
        <v-switch v-model="isAnonymous" class="mt-5"/>
        <p class="pt-4">toggle anonymous</p>
      </div>
      <v-progress-linear
        :value="uploadProgress"
        :active="isUploadingPost"
        height="30"
        color="green"
        class="white--text text-small"
      >
        Uploading...
      </v-progress-linear>
      <!-- I made modifications to your changes, here's your old code -->
        <!-- height="20"
        color="accent"
        striped
        rounded
        class="font-italic text-small"
        style="font-size: 0.8em;" -->
      <!-- Blackboard (use `v-show` to preserve the data even when Blackboard is hidden) -->
      <Blackboard v-show="!isPreviewing"
        @record-start="isRecordingVideo = true"
        @record-end="(getBlackboardData) => showPreview(getBlackboardData)"
        :key="changeKeyToForceReset"
        :isRealtime="false"
        ref="Blackboard"
      />

      <!-- Preview the video after recording -->
      <template v-if="isPreviewing">
        <v-row>
          <v-spacer></v-spacer>
          <BasePopupButton v-if="!isUploadingPost"
            actionName="Retry new recording" 
            @action-do="initRetry()"
          >
            <template v-slot:activator-button="{ on }">
              <ButtonNew :on="on" filled icon="mdi-keyboard-return">
                Retry Recording
              </ButtonNew>
            </template>
            <template v-slot:message-to-user>
              Everything will be deleted so you can start fresh again.
              <!-- Your audio recording will be deleted, but you can re-use
              your drawings as the initial setup for the new video. -->
            </template>
          </BasePopupButton>
        </v-row>
        <div id="doodle-wrapper" :class="isFullScreenDoodle ? 'fullscreen-video' : 'video-wrapper'" @click="e=>this.clickOutsideDoodle(e)">
          <DoodleVideo
            :strokesArray="previewVideo.strokesArray"
            :audioUrl="previewVideo.audio.blobUrl"
            :imageBlob="previewVideo.imageBlob"
            @toggle-fullscreen="toggleFullscreenDoodle"
            ref="Doodle"
          />
        </div>
      </template>
    </v-container>
  </v-card>
</template>

<script>
import Blackboard from "@/components/Blackboard.vue";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import DoodleVideo from "@/components/DoodleVideo.vue";
import TextEditor from "@/components/TextEditor.vue";
import BasePopupButton from "@/components/BasePopupButton.vue";
import firebase from "firebase/app";
import "firebase/firestore";
import db from "@/database.js";
import { RecordState } from "@/CONSTANTS.js";
import { getRandomId } from "@/helpers.js";
import ButtonNew from "@/components/ButtonNew.vue";

export default {
  props: {
    willCreateNewPost: {
      type: Boolean,
      default: () => false
    },
    titleRequired: {
      type: Boolean,
      default: () => false
    },
    postDbRef: Object,
    newExplanationDbRef: Object
  },
  mixins: [
    DatabaseHelpersMixin
  ],
  components: { 
    Blackboard, 
    DoodleVideo,
    TextEditor,
    BasePopupButton,
    ButtonNew
  },
  data: () => ({
    messageToUser: "",
    uploadProgress: 0,
    isRecordingVideo: false,
    isPreviewing: false,
    previewVideo: {
      strokesArray: [],
      audioBlob: null,
      imageBlob: ""
    },
    isAnonymous: false,
    isUploadingPost: false,
    changeKeyToForceReset: 0,
    isFullScreenDoodle: false
  }),
  computed: {
    user () { 
      return this.$store.state.user; 
    },
    simplifiedUser () {
      const { isOnline, enrolledClasses, color, ...immutableInfo } = this.user;
      return immutableInfo;
    },
    mitClass () { 
      return this.$store.state.mitClass; 
    },
    isButtonDisabled () {
      return this.isUploadingPost || this.isRecordingVideo;
    }
  },
  methods: {
    /* Always call `resizeBlackboard` if `isPreviewing` is set to false.
      If the window is resized while Blackboard.vue is hidden with `v-show`, the blackboard's display size will become 0 
      therefore, when the user press presses "retry", the Blackboard will reappear with 0 width. A similar case happens 
      with submiting a post. */
    resizeBlackboard () {
      const { Blackboard } = this.$refs;
      const { BlackboardDrawingCanvas } = Blackboard.$refs; 
      BlackboardDrawingCanvas.resizeBlackboard();
    },
    getBlackboard () {
      return this.$refs.Blackboard;
    },
    getTextEditor () {
      return this.$refs.TextEditor;
    },
    async initRetry () {
      this.isPreviewing = false;
      this.changeKeyToForceReset += 1;
      // QUICKFIX: Dourmashkin

      // await this.$nextTick(); // wait for v-if to mount Blackboard 
      // this.$refs.Blackboard.tryRecordAgain();
      // this.resizeBlackboard(); // see edge case explanation above
    },
    async showPreview (getBlackboardData) {
      this.previewVideo = await getBlackboardData();
      this.isRecordingVideo = false;
      this.isPreviewing = true;
    },
    // uploads the snapshot of the text, images, drawings and audio for the explanation
    async submitPost () {
      const { TextEditor, Blackboard } = this.$refs;
      if (TextEditor.html.length === 0 && this.titleRequired) {
        this.$root.$emit("show-snackbar", "Error: don't forget to write some text!")
        return; 
      }

      this.isUploadingPost = true; // trigger the "submit" button to go into a loading state
      const secondInMilliseconds = 1000;
      // Check if the firestore upload API has any way to detect an error or something because longer videos will obviously take much more time.
      const uploadTimeout = setTimeout(() => { 
        this.messageToUser = "Still uploading...hang in there."
      }, 
      10 * secondInMilliseconds);

      const anonymousUser = {
        uid: this.user.uid,
        email: "anonymous@mit.edu",
        firstName: "anonymous",
        lastName: "anonymous"
      };
      const metadata = {
        title: TextEditor.extractAllText(),
        html: TextEditor.html,
        date: new Date().toISOString(),
        creator: this.isAnonymous ? anonymousUser : this.simplifiedUser,
        mitClass: this.mitClass
      };
      const explanation = { ...metadata };
      const strokesArray = Blackboard.getStrokesArray();
      const imageBlob = Blackboard.getImageBlob();

      // Check if the user used the Blackboard
      if (strokesArray.length > 0 || imageBlob) { 
        // accumulate promises for strokes, audio, images to process them in parallel
        const uploadTasks = [];
        if (Blackboard.currentState === RecordState.POST_RECORD) {
          const { imageBlob, thumbnailBlob, audio } = this.previewVideo; 
          explanation.duration = Blackboard.currentTime;

          const audioUpload = new Promise(async (resolve, reject) => {
            try {
              const downloadUrl = await this.$_saveToStorage(`audio/${getRandomId()}`, audio.blob, true); 
              explanation.audioUrl = downloadUrl;
              resolve();
            } catch (reason) {
              reject("Audio failed to upload.");
            }
          });

          const thumbnailUpload = new Promise(async (resolve, reject) => {
            try {
              const downloadUrl = await this.$_saveToStorage(`images/${getRandomId()}`, thumbnailBlob);
              explanation.thumbnail = downloadUrl; 
              resolve();
            } catch (reason) {
              reject("Thumbnail failed to upload.");
            }
          });

          uploadTasks.push(audioUpload);
          uploadTasks.push(thumbnailUpload);

        } else {
          const thumbnailUpload = new Promise(async (resolve, reject) => {
            try {
              const thumbnailBlob = await Blackboard.getThumbnail();
              const downloadUrl = await this.$_saveToStorage(`images/${getRandomId()}`, thumbnailBlob);
              explanation.thumbnail = downloadUrl; 
              resolve();
            } catch (reason) {
              reject("Thumbnail failed to upload.");
            }
          });

          uploadTasks.push(thumbnailUpload);
        }

        // If there is a background image
        if (imageBlob) {
          const backgroundUpload = new Promise(async (resolve, reject) => {
            try {
              const downloadUrl = await this.$_saveToStorage(`images/${getRandomId()}`, imageBlob);
              explanation.imageUrl = downloadUrl; 
              resolve();
            } catch (reason) {
              reject("Background image failed to upload.");
            }
          });
          uploadTasks.push(backgroundUpload);
        }
        
        // RESOLVE PROMISES
        try {
          await Promise.all(uploadTasks);
        } catch (reason) {
          this.$root.$emit("show-snackbar", `Failed to upload explanation, reason: ${reason}`);
          this.isUploadingPost = false;
          return; 
        }
        // save strokes
        if (strokesArray.length > 0) {
          explanation.hasStrokes = true;
          for (let stroke of strokesArray) {
            if (this.willCreateNewPost) {
              this.postDbRef.collection("strokes").add(stroke);
            } else {
              this.newExplanationDbRef.collection("strokes").add(stroke);
            }
          }
        }
      }
      if (this.willCreateNewPost) {
        explanation.participants = [this.simplifiedUser];
        explanation.hasReplies = false;
        this.postDbRef.set(explanation);
      } else {
        this.newExplanationDbRef.set(explanation);
        this.postDbRef.update({
          participants: firebase.firestore.FieldValue.arrayUnion(this.simplifiedUser),
          hasReplies: true
        });
      }

      // reset variables
      clearInterval(uploadTimeout);
      this.messageToUser = "";
      this.changeKeyToForceReset += 1;
      this.isUploadingPost = false;
      this.isPreviewing = false;

      // emit events
      this.$emit("upload-finish"); 
      this.$root.$emit("show-snackbar", "Successfully uploaded.");
    },
    toggleFullscreenDoodle () {
      this.isFullScreenDoodle = !this.isFullScreenDoodle;
      const { Doodle } = this.$refs;
      Doodle.handleResize();
      if (this.isFullScreenDoodle) {
        document.documentElement.style.overflowY = "hidden";
      } else {
        document.documentElement.style.overflowY = "auto";
        window.scrollTo(0, document.body.scrollHeight) // to prevent being scrolled to the middle of page when Exiting the fullscreen
      }
    },
    clickOutsideDoodle (e) {
      if (e.target.id==='doodle-wrapper' && this.isFullScreenDoodle) {
        this.toggleFullscreenDoodle()
      }
    }
  }
}
</script>
<style scoped>
.video-wrapper {
  height: 100%; 
  width: 100%; 
  position: relative; 
  z-index: 5; 
  margin: auto;
}
.fullscreen-video {
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  z-index: 10;
  background-color: rgba(0,0,0,0.5);
}
</style>