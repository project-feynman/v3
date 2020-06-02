<template>
  <v-card>
    <v-container fluid>
      <!-- Text editor -->
      <v-col cols="12" md="6" class="pa-0">
        <v-text-field v-if="titleRequired" 
          placeholder="Type the title here."
          v-model="postTitle"
          color="accent"
          hide-details
          class="mb-5"
        />
      </v-col>
      <TextEditor ref="TextEditor" :key="`editor-${changeKeyToForceReset}`"/>

      <p class="red--text">{{ messageToUser }}</p>
      <div v-if="(newExplanationDbRef || postDbRef)" class="d-flex align-center">
        <template v-if="user">
          <v-btn v-if="!isUploadingPost"
            @click="uploadExplanation()" 
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
        </template>
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
      <!-- Blackboard (use `v-show` to preserve the data even when Blackboard is hidden) -->
      <Blackboard v-show="!isPreviewing"
        :strokesArray="strokesArray"
        @stroke-drawn="stroke => strokesArray.push(stroke)"
        :key="changeKeyToForceReset"
        :isRealtime="false"
        @record-start="isRecordingVideo = true"
        @record-end="getBlackboardData => showPreview(getBlackboardData)"
        ref="Blackboard"
      />
      <!-- Preview the video after recording -->
      <template v-if="isPreviewing">
        <v-row>
          <v-spacer/>
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
        <div id="doodle-wrapper" :class="isFullScreenDoodle ? 'fullscreen-video' : 'video-wrapper'" @click="e => this.clickOutsideDoodle(e)">
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
import ExplUploadHelpers from "@/mixins/ExplUploadHelpers.js";
import DoodleVideo from "@/components/DoodleVideo.vue";
import TextEditor from "@/components/TextEditor.vue";
import BasePopupButton from "@/components/BasePopupButton.vue";
import firebase from "firebase/app";
import "firebase/firestore";
import db from "@/database.js";
import { RecordState } from "@/CONSTANTS.js";
import { getRandomId } from "@/helpers.js";
import ButtonNew from "@/components/ButtonNew.vue";
import { mapState } from "vuex";

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
    DatabaseHelpersMixin,
    ExplUploadHelpers
  ],
  components: { 
    Blackboard, 
    DoodleVideo,
    TextEditor,
    BasePopupButton,
    ButtonNew
  },
  data: () => ({
    strokesArray: [],
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
    postTitle: "",
    isFullScreenDoodle: false
  }),
  computed: {
    ...mapState([
      "user",
      "mitClass"
    ]),
    simplifiedUser () {
      return {
        uid: this.user.uid,
        email: this.user.email,
        firstName: this.user.firstName,
        lastName: this.user.lastName,
      };
    },
    anonymousUser () {
      return {
        uid: this.user.uid,
        email: "anonymous@mit.edu",
        firstName: "anonymous",
        lastName: "anonymous"
      };
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
    // The 2 methods below are used by `NewPost` and `SeePost`
    getBlackboard () {
      return this.$refs.Blackboard;
    },
    getTextEditor () {
      return this.$refs.TextEditor;
    },
    async initRetry () {
      this.isPreviewing = false;
      this.changeKeyToForceReset += 1;
      // QUICKFIX: Dourmashkin just wants it to reset everything and not leave any remnants behind 
      // await this.$nextTick(); // wait for v-if to mount Blackboard 
      // this.$refs.Blackboard.tryRecordAgain();
      // this.resizeBlackboard(); // see edge case explanation above
    },
    async showPreview (getBlackboardData) {
      this.previewVideo = await getBlackboardData();
      this.isRecordingVideo = false;
      this.isPreviewing = true;
    },
    async uploadExplanation() {
      const { TextEditor, Blackboard } = this.$refs;
      if (this.postTitle.length === 0 && this.titleRequired) {
        this.postTitle = `Untitled (${new Date().toLocaleTimeString()})`;
      }
      const thumbnailBlob = this.previewVideo.thumbnailBlob ? this.previewVideo.thumbnailBlob : await Blackboard.getThumbnail();
      this.$_saveExplToCacheThenUpload(
        thumbnailBlob,
        Blackboard.currentState === RecordState.POST_RECORD ? this.previewVideo.audio.blob : null,
        TextEditor.html,
        this.postTitle,
        this.willCreateNewPost ? this.postDbRef : this.newExplanationDbRef.doc(getRandomId())
      )
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
      if (e.target.id === "doodle-wrapper" && this.isFullScreenDoodle) {
        this.toggleFullscreenDoodle()
      }
    }
  }
}
</script>

<style scoped>
.v-text-field {
  font-size: 1.6em;
}
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