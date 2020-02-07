<!-- Offer the user a text area + blackboard to create a Q or A -->
<template>
  <div id="new-post">
    <v-banner single-line sticky class="post-header container py-0" tag="header">
      <h3>New {{ postType }}</h3>
      <!-- <template v-slot:actions>
        <v-btn block @click="submitPost()" color="accent">
          Post
          <v-icon small class="pl-2">send</v-icon>
        </v-btn>
      </template> -->
    </v-banner>
    <v-container tag="section" class="py-5">
      <div class="question-main">
        <!-- <v-textarea
          class="input-title"
          filled
          outlined
          :height="postType=='Question'?'80':''"
          :label="postType"
          :placeholder="`Your ${postType} here...`"
          v-model="postTitle"
          color="accent lighten-1"
        /> -->
         <v-text-field
          v-if="postType === 'Question'"
          class="input-title"
          outlined
          label="Title"
          placeholder="Summarize your question in 1 sentence"
          v-model="postTitle"
          color="accent lighten-1"
        />
      
        <v-textarea
          class="input-description"
          filled
          label="Description"
          :placeholder="`Write your ${postType} here`"
          v-model="postDescription"
          color="accent lighten-2"
          background-color="#f5f5f5"
        />
      </div>

      <VLoadingButton @click="submitPost()" :isLoading="isButtonDisabled" color="secondary" block>
        Post {{ postType }}
        <v-icon class="pl-2">send</v-icon>
      </VLoadingButton>

      <v-row class="question-options" justify="end" justify-sm="space-between" align="center">
        <!-- <v-col cols="auto" order-sm="12">
          <v-switch v-model="anonymous" label="Post Anonymously" color="accent"></v-switch>
        </v-col> -->
        <v-col cols="12" sm="auto" class="d-flex justify-space-around" order-sm="1">
          <v-btn
            :outlined="!blackboardAttached"
            color="accent lighten-1"
            class="board-action-btn"
            @click="blackboardAttached = !blackboardAttached"
          >
            <span class="mr-2">{{ blackboardAttached ? 'Hide' : 'Use'}} blackboard</span>
            <v-icon>mdi-bulletin-board</v-icon>
          </v-btn>
          <v-btn
            @click="clickImage()"
            :outlined="!imageAdded || blackboardAttached"
            color="accent lighten-1"
            class="board-action-btn"
          >
            <span class="mr-2">{{ imageAdded ? 'Change' : 'Add'}} image</span>
            <v-icon>image</v-icon>
          </v-btn>
        </v-col>
      </v-row>
      <v-card outlined elevation="2" v-if="this.addedImage!=''" class="my-4 mx-2">
        <v-container>
          <v-row class="preview-image" align="center" justify="space-around">
            <v-col cols="6" sm="4" md="2">
              <img :src="addedImage" id="addedImage" />
            </v-col>
            <v-col cols="6" sm="4" md="8">
              <v-row class="px-0" align="center" justify="space-around">
                <v-col cols="auto">
                  <v-switch v-model="blackboardAttached" label="Annotate Image" color="accent"></v-switch>
                </v-col>
                <v-col cols="auto">
                  <v-btn @click="removeImage()" outlined color="accent lighten-1" class="board-action-btn">
                    Remove
                  </v-btn>
                </v-col>
              </v-row>
            </v-col>
          </v-row>
        </v-container>
      </v-card>
      <div class="blackboard-container" v-show="blackboardAttached">
        <Blackboard
          ref="Blackboard"
          :isRealtime="false"
          :visible="visible"
          :background="addedImage"
          @boardImage="boardImage"
          @record-start="isRecordingVideo = true"
          @audio-upload-start="isRecordingVideo = false; isUploadingAudio = true"
          @audio-upload-end="isUploadingAudio = false"
        />
      </div>
    </v-container>
  </div>
</template>

<script>
import Vue from "vue";
import db from "@/database.js";
import DoodleVideo from "@/components/DoodleVideo.vue";
import Blackboard from "@/components/Blackboard.vue";
import VLoadingButton from "@/components/VLoadingButton";

export default {
  props: {
    postType: String, // either "question" or "answer"
    visible: Boolean,
    tagsPool: Array,
    withTags: Boolean
  },
  components: {
    Blackboard,
    VLoadingButton
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
    reRenderTags: 0,
    anonymous: false,
  }),
  computed: {
    user () {
      return this.$store.state.user;
    },
    isButtonDisabled () {
      return this.isUploadingPost || this.isUploadingAudio || this.isRecordingVideo;
    }
  },
  methods: {
    // Uploads the snapshot of the text, images, drawings and audio for the post
    async submitPost () {
      if (!this.postTitle && this.postType === "Question") return; // a question must have a title
      this.isUploadingPost = true // trigger the "submit" button to go into a loading state 

      // Initialize variables
      const { Blackboard } = this.$refs;
      const { class_id, question_id } = this.$route.params
      const classRef = db.collection("classes").doc(class_id);
      const questionRef = classRef.collection("questions").doc(question_id);
      const answersRef = questionRef.collection("answers");  ;

      // Build the object for the Piazza post 
      const post = { 
        title: this.postTitle, 
        description: this.postDescription, 
        date: this.getDate(),
        creator: {
          uid: this.user.uid,
          firstName: this.user.firstName,
          lastName: this.user.lastName
        }
      }       
      
      // If the blackboard was used, save everything related to it 
      if (Blackboard.allStrokes.length > 0 || this.addedImage) {
        const blackboardId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
        const blackboardRef = classRef.collection("blackboards").doc(blackboardId);
        blackboardRef.set({ 
          audioUrl: Blackboard.audioUrl,
          duration: Blackboard.currentTime,
          image: this.addedImage,
          ...post // "spread" and integrate post into this object
        })
        // Save each stroke as a sub-document of blackboard
        for (let stroke of Blackboard.allStrokes) {
          blackboardRef.collection("strokes").add(stroke);
        }
        // The post will need a reference to the blackboard and audio file
        post.blackboardId = blackboardId;
        post.audioUrl = Blackboard.audioUrl;
      }

      // Now save the post itself
      if (this.postType === "Answer") {
        await answersRef.add({ isInSavedVideos: false, ...post });
      } else if (this.postType === "Question") {
        await classRef.collection("questions").add({ isInSavedVideos: false, ...post})
      } 
      this.isUploadingPost = false;
      this.$emit("post-create");
    },
    getDate () {
      var today = new Date();
      return today.toISOString();
    },
    boardImage (boardImage) {
      if (boardImage) {
        this.imageAdded = true;
        this.addedImage = boardImage;
        this.changeImage = false;
      }
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
    },
    //Start of Tags functions
    // addTag (tag) {
    //   for (let t of this.postTags) {
    //     if (t == tag) return;
    //   }
    //   this.postTags.push(tag)
    // },
    // deleteTag(tag) {
    //   this.postTags = this.postTags.filter(x => {
    //     return x != tag;
    //   });
    // }
    //End of Tags functions
  }
};
</script>