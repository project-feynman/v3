<template>
  <v-container fluid>
    <v-text-field
      label="Title" v-model="postTitle" outlined color="accent lighten-1"
    />
    <v-textarea
      label="Description" v-model="postDescription"
      filled color="accent lighten-2" background-color="#f5f5f5"
    />
    <v-btn 
      @click="submitPost()"
      :loading="isButtonDisabled" :disabled="isButtonDisabled"
      class="ma-0 white--text" color="accent lighten-1" block
    >
      SUBMIT POST <v-icon class="pl-2">send</v-icon>
    </v-btn>
    <Blackboard
      v-show="blackboardAttached" ref="Blackboard"
      :isRealtime="false" :visible="visible" :background="addedImage" :key="changeKeyToForceReset"
      @boardImage="boardImage"
      @record-start="isRecordingVideo = true"
      @audio-upload-start="isRecordingVideo = false; isUploadingAudio = true"
      @audio-upload-end="isUploadingAudio = false"
    />
  </v-container>
</template>

<script>
import Vue from "vue";
import db from "@/database.js";
import DoodleVideo from "@/components/DoodleVideo.vue";
import Blackboard from "@/components/Blackboard.vue";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";

export default {
  props: {
    newPostDbRef: Object,
    newExplanationDbRef: {
      type: Object,
      required: true
    },
    postsDbRef: Object,
    newDocId: String,
    visible: Boolean
  },
  mixins: [DatabaseHelpersMixin],
  components: { Blackboard },
  data: () => ({
    postTitle: "",
    postDescription: "",
    postTags: [],
    // TODO: some variables are unnecessary
    isUploadingAudio: false,
    isUploadingPost: false,
    isRecordingVideo: false,
    blackboardAttached: true,
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
    // Uploads the snapshot of the text, images, drawings and audio for the explanation
    async submitPost () {
      if (!this.postTitle) { 
        this.$root.$emit("show-snackbar", "Error: don't forget to write a title!")
        return; 
      }
      this.isUploadingPost = true // trigger the "submit" button to go into a loading state
      const creator = {
        uid: this.user.uid,
        firstName: this.user.firstName,
        lastName: this.user.lastName,
        email: this.user.email
      }
      const mitClass = {
        id: this.mitClass.id,
        name: this.mitClass.name
      }
      const metadata = {
        title: this.postTitle,
        description: this.postDescription,
        date: this.getDate(),
        creator,
        mitClass
      }
      const { Blackboard } = this.$refs;
      const explanation = {
        ...metadata,
        audioUrl: Blackboard.audioUrl || "", // TODO: make it explicit
        duration: Blackboard.currentTime || 0,
      }
      // Save image backgrounds if necessary
      if (Blackboard.imageBlob) {
        explanation.hasVisual = true;
        const path = `images/${this.newDocId}` // anything unique is fine here
        explanation.imageUrl = await this.$_dbMixin_saveToStorage(path, Blackboard.imageBlob);
      }
      // The first explanation will create a new post
      if (this.newPostDbRef) {
        this.newPostDbRef.set(metadata);
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
      this.changeKeyToForceReset += 1;
      this.isUploadingPost = false;
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
