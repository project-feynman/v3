<template>
  <v-card>
    <v-container fluid>
      <TextEditor ref="TextEditor" :key="`editor-${changeKeyToForceReset}`"></TextEditor>
      <v-btn v-if="newExplanationDbRef && postDbRef" 
        @click="submitPost()" block class="ma-0 white--text" color="accent" 
        :loading="isButtonDisabled" :disabled="isButtonDisabled"
      >
        SUBMIT <v-icon class="pl-2">mdi-send</v-icon>
        <template v-slot:loader>
          <span v-if="isRecordingVideo">Currently recording...</span> 
          <span v-else-if="isUploadingAudio">Processing video...</span>
        </template>
      </v-btn>
      <Blackboard v-show="blackboardAttached && !isPreviewing" ref="Blackboard"
        :isRealtime="false" 
        :visible="visible" 
        :background="addedImage" 
        :key="changeKeyToForceReset"
        @boardImage="boardImage" 
        @record-start="isRecordingVideo = true"
        @record-end="videoData => handleRecordEnd(videoData)"
        @retry-recording="handleRetry()"
      />
      <template v-if="isPreviewing">
        <v-btn @click="initRetry()" block class="white--text" outlined color="accent">
          Retry
        </v-btn>
        <DoodleVideo 
          :injectedStrokes="blackboardStrokes" 
          :audio="audio" 
          :audioUrl="audioUrl" 
          :image="image"
        />
      </template>
    </v-container>
  </v-card>
</template>

<script>
import db from "@/database.js";
import DoodleVideo from "@/components/DoodleVideo.vue";
import Blackboard from "@/components/Blackboard.vue";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import TextEditor from "@/components/TextEditor.vue";
import firebase from "firebase/app";
import "firebase/firestore";
import { RecordState } from "@/CONSTANTS.js";

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
  components: { Blackboard, DoodleVideo, TextEditor },
  data: () => ({
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
    image: { file: null },
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
    handleRecordEnd ({ audio, strokes, image }) {
      this.isRecordingVideo = false;
      this.isPreviewing = true;
      this.audio = audio;
      this.blackboardStrokes = strokes;
      this.image = { file: image };
    },
    // uploads the snapshot of the text, images, drawings and audio for the explanation
    async submitPost () {
      if (!this.newExplanationDbRef || !this.postDbRef) { return; }
      const { TextEditor } = this.$refs;
      if (TextEditor.html.length == 0) {
        this.$root.$emit("show-snackbar", "Error: don't forget to use text in your explanation!")
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
        title: TextEditor.extractAllText(),
        html: TextEditor.html,
        description: this.postDescription,
        date: this.getDate(),
        creator: explanationCreator,
        mitClass
      };
      const { Blackboard } = this.$refs;
      if (Blackboard.currentState === RecordState.POST_RECORD) {
        this.isUploadingAudio = true;
        await Blackboard.uploadAudio();
        this.isUploadingAudio = false;
      }
      
      function uuidv4() {
        return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
          (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
      }
      const thumbnail = await Blackboard.createThumbnail();
      const thumbnailUrl = await this.$_saveToStorage(`images/${uuidv4()}`, thumbnail);
      const explanation = {
        audioUrl: Blackboard.audioUrl || "", // TODO: make it explicit
        duration: Blackboard.currentTime || 0,
        thumbnail: thumbnailUrl,
        ...metadata
      };
      // save image backgrounds if necessary
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
      // save the explanation and its strokes
      if (Blackboard.allStrokes.length > 0) {
        explanation.hasVisual = true;
        for (let stroke of Blackboard.allStrokes) {
          this.newExplanationDbRef.collection("strokes").add(stroke);
        }
      }
      this.newExplanationDbRef.set(explanation);
      // reset
      this.postDescription = "";
      this.changeKeyToForceReset += 1; // not sure if it works
      this.isUploadingPost = false;
      this.$emit("upload-finish"); // tell parent to not hide loading status
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
    }
  }
}
</script>
