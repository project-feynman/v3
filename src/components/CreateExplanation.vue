<template>
  <v-card data-qa="create-expl">
    <v-container fluid>
      <!-- Title -->
      <v-col cols="12" md="6" class="pa-0">
        <v-text-field v-if="explType === 'post'" 
          placeholder="Title"
          v-model="postTitle"
          color="accent"
          hide-details
          class="mb-5"
          data-qa="title-field"
          id="title"
        />
      </v-col>

      <!-- Text Editor -->
      <TextEditor @update:html="html => this.html = html"/>
      <p class="red--text">{{ messageToUser }}</p>
      
      <div v-if="user" class="d-flex align-center">
        <v-row align="center" justify="space-between">
          <v-col cols="auto">
            <v-switch v-model="isAnonymous" label="Toggle Anonymous" color="accent"/>
            <v-select v-if="explType === 'post'" :items="tagSelect" v-model="folder" dense outlined label="Add to Folder" color="accent"></v-select>
          </v-col>

          <v-col cols="auto">
            <v-btn v-if="!isUploadingPost"
              @click="uploadExplanation()" 
              :loading="isButtonDisabled" 
              :disabled="isButtonDisabled"
              color="accent" 
              class="ma-0 white--text" 
              data-qa="submit-post-btn"
            >
              SUBMIT {{ isAnonymous ? "anonymously" : `as ${user.firstName}` }}
              <v-icon class="pl-2">mdi-send</v-icon>
              <template v-slot:loader>
                <span v-if="isRecordingVideo">Recording...</span> 
                <span v-else-if="isUploadingPost">Uploading...</span>
              </template>
            </v-btn>
          </v-col>
        </v-row>
      </div>

      <!-- Upload Progress Bar -->
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
        :key="changeKeyToForceReset"
        :isRealtime="false"
        :strokesArray="strokesArray" 
        @stroke-drawn="stroke => strokesArray.push(stroke)"
        @board-reset="strokesArray = []"
        @mounted="blackboardMethods => bindBlackboardMethods(blackboardMethods)"
        @update:audioBlob="audioBlob => blackboard.audioBlob = audioBlob"
        @update:bgImageBlob="bgImageBlob => blackboard.bgImageBlob = bgImageBlob"
        @update:currentTime="currentTime => blackboard.currentTime = currentTime"
        @record-start="isRecordingVideo = true"
        @record-end="showPreview()"
      />

      <!-- Preview the video after recording -->
      <template v-if="isPreviewing">
        <v-row>
          <v-spacer/>
          <BasePopupButton v-if="!isUploadingPost"
            actionName="Retry new recording" 
            @action-do="clearPreviewAndResetBlackboard()"
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

        <DoodleVideo
          :strokesArray="previewVideo.strokesArray"
          :audioUrl="convertToURL(previewVideo.audioBlob)"
          :imageBlob="previewVideo.imageBlob"
        />
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
    explType: {
      typ: String,
      required: true
    }
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
    postTitle: "",
    html: "", // from the text editor
    blackboard: {
      getThumbnailBlob: null,
      audioBlob: null,
      bgImageBlob: null,
      currentTime: 0
    },
    strokesArray: [],
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
    messageToUser: "",
    changeKeyToForceReset: 0,
    folder: '',
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
    },
    tagSelect () {
      if (!this.mitClass) return [];
      let tags = []
      for (let tag of this.mitClass.tags) {
        tags.push({ text: tag.name, value: tag.id })
      }
      return tags;
    }
  },
  watch: {
    mitClass: {
      immediate: true,
      handler () {
        this.decideWhereExplsAreSaved()
      }
    }
  },
  methods: {
    decideWhereExplsAreSaved () {
      if (!this.mitClass) return; 
      const classRef = db.doc(`classes/${this.mitClass.id}`);
      const classPath = `classes/${this.mitClass.id}`;
      if (this.explType === "post") {
        this.newPostRef = db.doc(`${classPath}/posts/${getRandomId()}`);
      } else if (this.explType === "reply") {
        this.newPostRef = db.doc(`${classPath}/posts/${this.$route.params.post_id}`);
        this.newReplyRef = this.newPostRef.collection("explanations").doc(getRandomId());
      }
    },
    /**
     *  Show a confirmation popup if the user exits the current URL (to prevent accidental loss of work)
     *  `beforeRouteUpdate` is called when the route change but this `ClassPageSeePost` is still used
     *  @see https://router.vuejs.org/guide/advanced/navigation-guards.html#global-before-guards
     */
    beforeRouteUpdate (to, from, next) {
      this.confirmExit(next);
    },
    beforeRouteLeave (to, from, next) {
      this.confirmExit(next);
    },
    confirmExit (next) {
      if (this.strokesArray.length > 0 || this.html.length > 0) {
        const wantToLeave = window.confirm("Do you really want to leave? You might have unsaved changes.");
        if (!wantToLeave) next(false);
        else next();
      } 
      else next(); 
    },
    bindBlackboardMethods ({ getThumbnailBlob }) {
      this.blackboard.getThumbnailBlob = getThumbnailBlob; 
    },
    convertToURL (blob) {
      return URL.createObjectURL(blob);
    },
    clearPreviewAndResetBlackboard () {
      this.isPreviewing = false;
      // reset the blackboard component 
      this.strokesArray.length = 0; // must not use `strokesArray = []`
      this.changeKeyToForceReset += 1; // must be called after strokesArray is reset otherwise the blackboard will be rerendered with the previous strokes
    },
    async showPreview () {      
      this.previewVideo = {
        strokesArray: this.strokesArray,
        audioBlob: this.blackboard.audioBlob,
        imageBlob: this.blackboard.bgImageBlob
      };
      this.isRecordingVideo = false;
      this.isPreviewing = true;
    },
    async uploadExplanation () {
      if (this.postTitle === "" && this.explType === "post") {
        this.postTitle = `Untitled (${new Date().toLocaleTimeString()})`;
      }
      const thumbnailBlob = this.previewVideo.thumbnailBlob ? 
        this.previewVideo.thumbnailBlob : await this.blackboard.getThumbnailBlob();
      
      this.$_saveExplToCacheThenUpload({
        thumbnailBlob,
        audioBlob: this.blackboard.audioBlob,
        html: this.html,
        title: this.postTitle,
        tags: this.folder === "" ? [] : [this.folder],
        explRef: this.explType === "post" ? this.newPostRef : this.newReplyRef
      });
  
      this.hardResetChildrenComponents(); 
    },
    /**
     * Note, always properly reset the states i.e. variables/model 
     * before re-rendering the UI (incrementing changeKeyToForceReset)
     */
    hardResetChildrenComponents () {
      this.postTitle = ""; 
      this.html = "";
      this.blackboard = {
        getThumbnailBlob: null,
        audioBlob: null,
        bgImageBlob: null,
        currentTime: 0
      };
      this.strokesArray = [];

      // preview-related variables (to be refactored and eliminated in the future)
      this.previewVideo = {
        strokesArray: [],
        audioBlob: null,
        imageBlob: ""
      };
      this.isPreviewing = false; 

      // always reset state before re-rendering 
      this.changeKeyToForceReset += 1; 
      this.decideWhereExplsAreSaved();
    }
  }
};
</script>

<style>
.v-text-field #title {
  font-size: 1.6em;
}
</style>