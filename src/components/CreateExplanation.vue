<template>
  <v-card>
    <v-container fluid>
      <v-textarea 
        label="Use text, image, drawings and/or voice for any purpose" 
        placeholder="Write text here (press ENTER to expand)"
        v-model="postTitle" auto-grow rows="1" hide-details filled color="accent lighten-2" background-color="#f5f5f5"
      />
      <v-btn v-if="newExplanationDbRef && postDbRef" @click="submitPost()" block class="ma-0 white--text" color="accent lighten-1" 
        :loading="isButtonDisabled" :disabled="isButtonDisabled"
      >
        SUBMIT <v-icon class="pl-2">send</v-icon>
        <template v-slot:loader>
          <span v-if="isRecordingVideo">Currently recording...</span> 
          <span v-else-if="isUploadingAudio">Processing video...</span>
        </template>
      </v-btn>
      <Blackboard v-show="blackboardAttached && !isPreviewing" ref="Blackboard"
        :isRealtime="false" :visible="visible" :background="addedImage" :key="changeKeyToForceReset"
        @boardImage="boardImage" @record-start="isRecordingVideo = true"
        @record-end="videoData => handleRecordEnd(videoData)"
        @retry-recording="handleRetry()"
      />
      <template v-if="isPreviewing">
        <v-btn @click="initRetry()" block class="white--text" outlined color="accent lighten-1">
          Retry
        </v-btn>
        <DoodleVideo :strokes="blackboardStrokes" :audio="audio" :audioUrl="audioUrl"/>
      </template>
    </v-container>
  </v-card>
</template>

<script>
import Vue from "vue";
import db from "@/database.js";
import DoodleVideo from "@/components/DoodleVideo.vue";
import Blackboard from "@/components/Blackboard.vue";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import firebase from "firebase/app";
import "firebase/firestore";
import CONSTANTS from "@/CONSTANTS.js";

export default {
  props: {
    willCreateNewPost: {
      type: Boolean,
      default () { return false; }
    },
    postDbRef: Object,
    newExplanationDbRef: Object,
    newDocId: String,
    visible: Boolean
  },
  mixins: [DatabaseHelpersMixin],
  components: { Blackboard, DoodleVideo },
  data: () => ({
    postTitle: "",
    postDescription: "",
    postTags: [],
    // TODO: some variables are unnecessary
    isUploadingAudio: false,
    isUploadingPost: false,
    isRecordingVideo: false,
    isPreviewing: false,
    blackboardAttached: true,
    blackboardStrokes: [],
    audio: null,
    audioUrl: "",
    imageAdded: false,
    addedImage: "",
    changeImage: false,
    changeKeyToForceReset: 0
  }),
  computed: {
    user () { return this.$store.state.user; },
    mitClass () { return this.$store.state.mitClass; },
    isButtonDisabled () {
      return this.isUploadingPost || this.isUploadingAudio || this.isRecordingVideo;
    },
    classId () { return this.$route.params.classId; }
  },
  methods: {
    initRetry () {
      this.isPreviewing = false;
      this.$nextTick(() => {
        const { Blackboard } = this.$refs;
        Blackboard.handleRecordStateChange(CONSTANTS.recordStateEnum.PRE_RECORD);
      })
    },
    handleRecordEnd ({ audio, strokes }) {
      this.isRecordingVideo = false;
      this.isPreviewing = true;
      this.audio = audio;
      this.blackboardStrokes = strokes;
    },
    // Uploads the snapshot of the text, images, drawings and audio for the explanation
    async submitPost () {
      if (!this.newExplanationDbRef || !this.postDbRef) { return; }
      if (!this.postTitle) { 
        this.$root.$emit("show-snackbar", "Error: don't forget to write a title!")
        return; 
      }
      this.isUploadingPost = true; // trigger the "submit" button to go into a loading state
      const explanationCreator = {
        uid: this.user.uid,
        firstName: this.user.firstName,
        lastName: this.user.lastName,
        email: this.user.email
      };
      const mitClass = { id: this.mitClass.id, name: this.mitClass.name };
      const metadata = {
        title: this.postTitle,
        description: this.postDescription,
        date: this.getDate(),
        creator: explanationCreator,
        mitClass
      };
      const { Blackboard } = this.$refs;
      if (Blackboard.currentState === CONSTANTS.recordStateEnum.POST_RECORD) {
        this.isUploadingAudio = true;
        await Blackboard.uploadAudio();
        this.isUploadingAudio = false;
      }
      const explanation = {
        audioUrl: Blackboard.audioUrl || "", // TODO: make it explicit
        duration: Blackboard.currentTime || 0,
        ...metadata,
      };
      // Save image backgrounds if necessary
      if (Blackboard.imageBlob) {
        explanation.hasVisual = true;
        const path = `images/${this.newDocId}` // anything unique is fine here
        explanation.imageUrl = await this.$_saveToStorage(path, Blackboard.imageBlob);
      }
      if (this.willCreateNewPost) {
        this.postDbRef.set({ ...metadata, participants: [explanationCreator]});
      } else {
        this.postDbRef.update({
          participants: firebase.firestore.FieldValue.arrayUnion(explanationCreator)
        });
      }
      // Save the explanation and its strokes
      if (Blackboard.allStrokes.length > 0) {
        explanation.hasVisual = true;
        for (let stroke of Blackboard.allStrokes) {
          this.newExplanationDbRef.collection("strokes").add(stroke);
        }
      }
      this.newExplanationDbRef.set(explanation);
      // Reset component
      this.postTitle = "";
      this.postDescription = "";
      this.changeKeyToForceReset += 1; // not sure if it works
      this.isUploadingPost = false;
      // Inform parent
      this.$emit("upload-finish");
    },
    getDate () {
      const today = new Date();
      return today.toISOString();
    },
    boardImage (boardImage) {
      if (!boardImage) { return; }
      this.imageAdded = true;
      this.addedImage = boardImage;
      this.changeImage = false;
    },
    // clickImage () {
    //   this.$refs.Blackboard.$refs.blackboardToolbar.$refs.background.$el.click();
    // },
    // addImage () {
    //   this.imageAdded = true;
    //   const file = document.getElementById("img-input").files[0];
    //   const reader = new FileReader();
    //   reader.addEventListener("load", () => this.addedImage = reader.result, false);
    //   if (file) { reader.readAsDataURL(file); }
    // },
    // removeImage () {
    //   this.imageAdded = false;
    //   Vue.set(this, "addedImage", "");
    // }
  }
}
</script>
