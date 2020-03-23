<template>
  <v-card>
    <v-container fluid>
      <!-- Text editor -->
      <TextEditor ref="TextEditor" :key="`editor-${changeKeyToForceReset}`"/>
      <div v-if="newExplanationDbRef || postDbRef" class="d-flex align-center">
        <v-btn  
          @click="submitPost()" 
          :loading="isButtonDisabled" 
          :disabled="isButtonDisabled"
          color="secondary" 
          class="ma-0 white--text" 
        >
          SUBMIT {{ isAnonymous ? "anonymously" : `as ${user.firstName}`}}
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

      <!-- Blackboard -->
      <BetaBlackboard v-show="!isPreviewing"
        @record-start="isRecordingVideo = true"
        @record-end="(getBlackboardData) => showPreview(getBlackboardData)"
        ref="Blackboard"
        :key="changeKeyToForceReset"
      />

      <!-- Preview the video after recording -->
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
          :strokesArray="previewVideo.strokesArray"
          :audioUrl="previewVideo.audio.blobURL"
          :imageBlob="previewVideo.imageBlob"
        />
      </template>
    </v-container>
  </v-card>
</template>

<script>
import BetaBlackboard from "@/components/BetaBlackboard.vue";
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
      default: () => false
    },
    postDbRef: Object,
    newExplanationDbRef: Object,
    newDocId: String,
  },
  mixins: [
    DatabaseHelpersMixin
  ],
  components: { 
    BetaBlackboard,
    Blackboard, 
    DoodleVideo,
    TextEditor,
    BasePopupButton
  },
  data: () => ({
    isRecordingVideo: false,
    isPreviewing: false,
    previewVideo: {
      strokesArray: [],
      audioBlob: null,
      imageBlob: ""
    },
    isAnonymous: false,
    isUploadingPost: false,
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
    getBlackboard () {
      return this.$refs.Blackboard;
    },
    getTextEditor () {
      return this.$refs.TextEditor;
    },
    async initRetry () {
      this.isPreviewing = false;
      await this.$nextTick();
      this.$refs.Blackboard.tryRecordAgain();
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
        creator: this.isAnonymous ? anonymousUser : this.simplifiedUser,
        mitClass: this.mitClass
      };
      const explanation = { ...metadata };
      const strokesArray = Blackboard.getStrokesArray();
      const imageBlob = Blackboard.getImageBlob();
      if (strokesArray.length > 0 || imageBlob) { // means the Blackboard was used
        // accumulate promises for strokes, audio, images to process them in parallel
        const promises = [];
        if (Blackboard.currentState === RecordState.POST_RECORD) {
          const { imageBlob, thumbnailBlob, audio } = this.previewVideo; 
          explanation.duration = Blackboard.currentTime;
    
          const audioBlob = audio.blob;
          const audioPromise = this.$_saveToStorage(`audio/${getRandomId()}`, audioBlob)
          .then((downloadUrl) => explanation.audioUrl = downloadUrl);

          const thumbnailPromise = this.$_saveToStorage(`images/${getRandomId()}`, thumbnailBlob)
          .then((thumbnailUrl) => explanation.thumbnail = thumbnailUrl);

          promises.push(audioPromise);
          promises.push(thumbnailPromise);
        } else {
          const thumbnailPromise = Blackboard.getThumbnail().then(async (thumbnailBlob) => {
            const thumbnailUrl = await this.$_saveToStorage(`images/${getRandomId()}`, thumbnailBlob);
            explanation.thumbnail = thumbnailUrl;
          });
          promises.push(thumbnailPromise);
        }
        if (imageBlob) {
          const backgroundImagePromise = this.$_saveToStorage(`images/${getRandomId()}`, imageBlob)
          .then((imageUrl) => explanation.imageUrl = imageUrl);
          promises.push(backgroundImagePromise);
        }
        // RESOLVE PROMISES
        await Promise.all(promises);

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
      this.changeKeyToForceReset += 1; // not sure if it works
      this.isUploadingPost = false;
      this.$emit("upload-finish"); 
      this.$root.$emit("show-snackbar", "Successfully uploaded.");
    },
    getDate () {
      const today = new Date();
      return today.toISOString();
    }
  }
}
</script>
