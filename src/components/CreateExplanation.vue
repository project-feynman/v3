<template>
  <v-card>
    <v-container fluid>
      <TextEditor ref="TextEditor" :key="`editor-${changeKeyToForceReset}`"/>
      <v-btn v-if="newExplanationDbRef || postDbRef" 
        @click="submitPost()" 
        :loading="isButtonDisabled" 
        :disabled="isButtonDisabled"
        color="secondary" 
        class="ma-0 white--text" 
      >
        SUBMIT AS {{ `${user.firstName}  ${user.lastName}` }}
        <v-icon class="pl-2">mdi-send</v-icon>
        <template v-slot:loader>
          <span v-if="isRecordingVideo">Currently recording...</span> 
          <span v-else-if="isUploadingPost">Uploading post...</span>
        </template>
      </v-btn>

       <v-btn v-if="newExplanationDbRef || postDbRef" 
        @click="submitPost(true)" 
        :loading="isButtonDisabled" 
        :disabled="isButtonDisabled"
        color="secondary" 
        class="ma-0 white--text" 
      >
        SUBMIT ANONYMOUSLY
        <v-icon class="pl-2">mdi-send</v-icon>
        <template v-slot:loader>
          <span v-if="isRecordingVideo">Currently recording...</span> 
          <span v-else-if="isUploadingPost">Uploading post...</span>
        </template>
      </v-btn>

      <Blackboard v-show="blackboardAttached && !isPreviewing" 
        :isRealtime="false" 
        :visible="visible" 
        :key="changeKeyToForceReset"
        @record-start="isRecordingVideo = true"
        @record-end="(videoData) => handleRecordEnd(videoData)"
        @retry-recording="handleRetry()"
        ref="Blackboard"
      />
      <template v-if="isPreviewing">
        <BasePopupButton actionName="Retry new recording" @action-do="initRetry()">
          <template v-slot:activator-button="{ on }">
            <v-btn v-if="!isUploadingPost" v-on="on" class="white--text" outlined color="accent">
              Retry recording
            </v-btn>
          </template>
          <template v-slot:message-to-user>
            Your audio recording will be deleted, but you can re-use
            your drawings as the initial setup for the new video.
          </template>
        </BasePopupButton>
        <DoodleVideo
          :strokesArray="blackboardStrokes"
          :audioUrl="audio.blobURL"
          :backgroundUrl="imageUrl"
        />
      </template>
    </v-container>
  </v-card>
</template>

<script>
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import DoodleVideo from "@/components/DoodleVideo.vue";
import Blackboard from "@/components/Blackboard.vue";
import TextEditor from "@/components/TextEditor.vue";
import BasePopupButton from "@/components/BasePopupButton.vue";
import firebase from "firebase/app";
import "firebase/firestore";
import db from "@/database.js";
import { RecordState } from "@/CONSTANTS.js";
import { getRandomId } from "@/helpers.js";

export default {
  props: {
    willCreateNewPost: {
      type: Boolean,
      default: () => false
    },
    titleRequired: {
      type: Boolean,
      default: () => true
    },
    postDbRef: Object,
    newExplanationDbRef: Object,
    newDocId: String,
    visible: Boolean
  },
  mixins: [DatabaseHelpersMixin],
  components: { 
    Blackboard, 
    DoodleVideo,
    TextEditor,
    BasePopupButton
  },
  data: () => ({
    isUploadingPost: false,
    isRecordingVideo: false,
    isPreviewing: false,
    blackboardAttached: true,
    // TODO: refactor the variables below 
    blackboardStrokes: [],
    audio: null,
    audioUrl: "",
    imageUrl: "",
    changeKeyToForceReset: 0
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
    initRetry () {
      this.isPreviewing = false;
      this.$nextTick(() => {
        const { Blackboard } = this.$refs;
        Blackboard.handleRecordStateChange(RecordState.PRE_RECORD);
      })
    },
    handleRecordEnd ({ audio, strokes, imageUrl }) {
      this.isRecordingVideo = false;
      this.isPreviewing = true;
      this.audio = audio;
      this.blackboardStrokes = strokes;
      this.imageUrl = imageUrl;
    },
    // uploads the snapshot of the text, images, drawings and audio for the explanation
    async submitPost (anonymous = false) {
      const { TextEditor, Blackboard } = this.$refs;
      if (TextEditor.html.length === 0 && this.titleRequired) {
        this.$root.$emit("show-snackbar", "Error: don't forget to write some text!")
        return; 
      }
      this.isPreviewing = false; // important: for canvas to generate a thumbnail requires it to be visible
      this.isUploadingPost = true; // trigger the "submit" button to go into a loading state
      const anonymousUser = {
        uid: this.user.uid,
        email: "anonymous@mit.edu",
        firstName: "anonymous",
        lastName: "anonymous"
      };
      const metadata = {
        title: TextEditor.extractAllText(),
        html: TextEditor.html,
        date: this.getDate(),
        creator: anonymous ? anonymousUser : this.simplifiedUser,
        mitClass: this.mitClass
      };
      const explanation = { ...metadata };
      // TODO: optimize by resolving promises all at once
      const { strokesArray, imageBlob, currentState, currentTime } = Blackboard;
      if (strokesArray.length > 0 || imageBlob) {
        await this.$nextTick();
        const thumbnailUrl = await this.$_saveToStorage(
          `images/${getRandomId()}`, 
          Blackboard.thumbnailBlob
        );
        explanation.thumbnail = thumbnailUrl;
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
        if (imageBlob) {
          explanation.imageUrl = await this.$_saveToStorage(`images/${getRandomId()}`, imageBlob);
        }
        if (currentState === RecordState.POST_RECORD) {
          await Blackboard.uploadAudio();
          explanation.audioUrl = Blackboard.audioUrl;
          explanation.duration = Blackboard.currentTime;
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
      this.resetComponent();
      this.$emit("upload-finish"); // tell parent to not hide loading status
    },
    resetComponent () {
      this.changeKeyToForceReset += 1; // not sure if it works
      this.isUploadingPost = false;
    },
    getDate () {
      const today = new Date();
      return today.toISOString();
    }
  }
}
</script>
