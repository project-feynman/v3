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
            @click="submitExplanation()" 
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
    user () { 
      return this.$store.state.user; 
    },
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
    /**
     * Save the explanation data into the global Vuex store (so the data doesn't disappear
     * if this component is destroyed), then initiates the upload process.
     */
    async submitExplanation () {
      const { TextEditor, Blackboard } = this.$refs;
      if (this.postTitle.length === 0 && this.titleRequired) {
        this.postTitle = `Untitled (${new Date().toDateString()})`; 
      }
      const explRef = this.willCreateNewPost ? this.postDbRef : this.newExplanationDbRef.doc(getRandomId());
      this.$store.commit("ADD_EXPL_TO_CACHE", {
        ref: explRef, // to uniquely identify each explanation when there are simultaneous uploads
        strokesArray: this.strokesArray,
        backgroundImageBlob: Blackboard.getImageBlob(),
        thumbnailBlob: this.previewVideo.thumbnailBlob ? this.previewVideo.thumbnailBlob : await Blackboard.getThumbnail(),
        audioBlob: Blackboard.currentState === RecordState.POST_RECORD ? this.previewVideo.audio.blob : null,
        metadata: {
          title: this.postTitle,
          html: TextEditor.html,
          date: new Date().toISOString(),
          creator: this.isAnonymous ? this.anonymousUser : this.simplifiedUser,
          mitClass: this.mitClass,
          tags: [],
          duration: Blackboard.currentTime,
          hasStrokes: this.strokesArray.length > 0
        }
      });
      this.uploadExplanation(explRef);
      this.$root.$emit("show-snackbar", "Uploading your explanation...");
      this.$emit("upload-started"); // let the clients i.e. ClassPageSeePost and ClassPageNewPost re-render the <CreateExplanation/> component
    },
    /**
     * 
     * @param {*} context a reference to the Vuex store, and is automatically injected when the method is called using `$store.dispatch()`
     * @param {*} ref the location on Firestore to which the explanation document will be uploaded. 
     *                Moreover, ref.id maps to the specific explanation from the expl cache. 
     * @returns Uploads the explanation. If the upload fails for any reason,
     * this function will call itself after 5 seconds to re-attempt the upload
     */
    async uploadExplanation (ref) {
      try {
        const explData = this.$store.state.explCache[ref.id];
        const { strokesArray, audioBlob, thumbnailBlob, backgroundImageBlob } = explData; 
        const explDoc = { ...explData.metadata }; // we build up each property of `explDoc` then upload it Firestore
        const promises = []; // upload thumbnail, audio, images and strokes in parallel 
        if (strokesArray.length > 0 || backgroundImageBlob) { // if the blackboard was used
          promises.push(
            this.uploadStrokesToDatabase(strokesArray, ref.collection("strokes"))
          );
          promises.push(
            this.$_saveToStorage(getRandomId(), thumbnailBlob).then(URL => explDoc.thumbnail = URL)
          );
          if (audioBlob) {
            promises.push(
              this.$_saveToStorage(getRandomId(), audioBlob).then(URL => explDoc.audioUrl = URL)
            );
          } 
          if (backgroundImageBlob) {
            promises.push(
              this.$_saveToStorage(getRandomId(), backgroundImageBlob).then(URL => explDoc.imageUrl = URL)
            );
          }
        }
        await Promise.all(promises);
        // TODO: refactor the below logic to the client
        const promises2 = [];
        if (this.willCreateNewPost) {
          explDoc.participants = [this.simplifiedUser];
          explDoc.hasReplies = false;
        } else {
          promises2.push(
            this.postDbRef.update({
              participants: firebase.firestore.FieldValue.arrayUnion(this.simplifiedUser),
              hasReplies: true
            })
          );
        }
        promises2.push(ref.set(explDoc));
        await Promise.all(promises2);
        delete this.$store.state.explCache[ref.id];
        this.$root.$emit("show-snackbar", "Successfully uploaded your explanation.");   
      } catch (error) {
        // TODO: send an error email to ExplainMIT core team
        console.log("error =", error);
        this.$root.$emit("show-snackbar", "Upload failed, trying again...");
        // set a delay in case the upload failure is immediate and will overwhelm the call stack
        setTimeout(() => this.uploadExplanation(ref), 5000); 
      }
    },
    /**
     * @param strokesArray an array of stroke objects
     * @param databaseRef location on Firestore where the stroke documents will be uploaded
     * @effect uploads each stroke of the array to databaseRef 
     */
    uploadStrokesToDatabase (strokesArray, databaseRef) {
      return new Promise(async (resolve, reject) => {
        try {
          const promises = [];
          const n = strokesArray.length;
          let currentBatch = db.batch();
          let currentBatchSize = 0; 
          const maxBatchSize = 500; 

          for (const stroke of this.strokesArray) {
            if (currentBatchSize >= maxBatchSize) {
              promises.push(currentBatch.commit());
              currentBatch = db.batch(); 
              currentBatchSize = 0; 
            } 
            currentBatch.set(databaseRef.doc(getRandomId()), stroke);
            currentBatchSize += 1;
          }

          promises.push(currentBatch.commit()); 
          await Promise.all(promises);
          resolve();
        } catch (reason) {
          console.log("failed, reason =", reason);
          reject(reason);
        }
      });
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