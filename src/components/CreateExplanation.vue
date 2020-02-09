<!-- Offer the user a text area + blackboard to create a Q or A -->
<template>
  <v-container fluid>
    <v-text-field 
      v-model="postTitle"
      outlined label="Title" color="accent lighten-1"
    />
    <v-textarea
      label="Description"
      v-model="postDescription"
      filled color="accent lighten-2" background-color="#f5f5f5"
    />
    <BaseLoadingButton 
      @click="submitPost()" 
      :isLoading="isButtonDisabled" 
      class="ma-0" color="accent lighten-1" block
    >
      Submit post
      <v-icon class="pl-2">
        send
      </v-icon>
    </BaseLoadingButton>
      <!-- Try being different from Piazza
      <v-row class="question-options" justify="end" justify-sm="space-between" align="center"> -->
        <!-- <v-col cols="auto" order-sm="12">
          <v-switch v-model="anonymous" label="Post Anonymously" color="accent"></v-switch>
        </v-col> -->
    <Blackboard
      v-show="blackboardAttached"
      ref="Blackboard"
      :isRealtime="false"
      :visible="visible"
      :background="addedImage"
      @boardImage="boardImage"
      @record-start="isRecordingVideo = true"
      @audio-upload-start="isRecordingVideo = false; isUploadingAudio = true"
      @audio-upload-end="isUploadingAudio = false"
      :key="changeKeyToForceReset"
    />
  </v-container>
</template>

<script>
import Vue from "vue";
import db from "@/database.js";
import DoodleVideo from "@/components/DoodleVideo.vue";
import Blackboard from "@/components/Blackboard.vue";
import BaseLoadingButton from "@/components/BaseLoadingButton";

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
  components: {
    Blackboard,
    BaseLoadingButton
  },
  data: () => ({
    postTitle: "",
    postDescription: "",
    postTags: [],
    isUploadingAudio: false,
    isUploadingPost: false,
    isRecordingVideo: false,
    blackboardAttached: true,
    imageAdded: false,
    addedImage: "",
    changeImage: false,
    anonymous: false,
    changeKeyToForceReset: 0
  }),
  computed: {
    user () { return this.$store.state.user; },
    mitClass () { return this.$store.state.mitClass; },
    isButtonDisabled () {
      return this.isUploadingPost || this.isUploadingAudio || this.isRecordingVideo;
    },
    classId () {
      return this.$route.params.classId;
    }
  },
  methods: {
    // Uploads the snapshot of the text, images, drawings and audio for the explanation
    async submitPost () {
      this.isUploadingPost = true // trigger the "submit" button to go into a loading state 

      const creator = {
        uid: this.user.uid,
        firstName: this.user.firstName,
        lastName: this.user.lastName
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
        audioUrl: Blackboard.audioUrl || "",
        duration: Blackboard.currentTime || 0,
        image: this.addedImage || 0,
      }      
      
      // Means the user is creating a new post with his/her explanation
      if (this.newPostDbRef) this.newPostDbRef.set(metadata);

      // Save the explanation and its strokes as a subcollection
      this.newExplanationDbRef.set(explanation);
      if (Blackboard.allStrokes.length > 0) {
        for (let stroke of Blackboard.allStrokes) {
          this.newExplanationDbRef.collection("strokes").add(stroke);
        }
      }
      // Reset component
      this.postTitle = "";
      this.postDescription = "";
      this.changeKeyToForceReset += 1;
      this.isUploadingPost = false;
    },
    getDate () {
      var today = new Date();
      return today.toISOString();
    },
    boardImage (boardImage) {
      if (!boardImage) return;
      this.imageAdded = true;
      this.addedImage = boardImage;
      this.changeImage = false;
    },
    clickImage () {
      this.$refs.Blackboard.$refs.blackboardToolbar.$refs.background.$el.click();
    },
    addImage () {
      this.imageAdded = true;
      const file = document.getElementById("img-input").files[0];
      const reader = new FileReader();
      reader.addEventListener("load", () => this.addedImage = reader.result, false);
      if (file) reader.readAsDataURL(file);
    },
    removeImage () {
      this.imageAdded = false;
      Vue.set(this, "addedImage", "");
    }
  }
}
</script>