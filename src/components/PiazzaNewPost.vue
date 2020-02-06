<!-- Offer the user a text area + blackboard to create a Q or A -->
<template>
  <div id="new-post">
    <v-banner single-line sticky class="post-header container py-0" tag="header">
      <h3>New {{ postType }}</h3>
      <template v-slot:actions>
        <v-btn @click="submitPost()" color="accent">Post <v-icon small class="pl-2">send</v-icon></v-btn>
      </template>
    </v-banner>
    <v-container tag="section" class="py-5">
      <div class="question-main">
        <v-textarea
          class="input-title"
          filled
          outlined
          :height="postType=='Question'?'80':''"
          :label="postType"
          :placeholder="`Your ${postType} here...`"
          v-model="postTitle"
          color="accent lighten-1"
        />
        <v-textarea
          class="input-description"
          v-if="postType=='Question'"
          filled
          label="Description"
          placeholder="Your description here..."
          v-model="postDescription"
          color="accent lighten-2"
          background-color="#f5f5f5"
        />
      </div>
      <!--
      <v-container v-if="withTags">
        <div id="Tags">
          <SearchBar
          label="Enter a Tag"
          :items="tagsPool"
          @submit="addTag"
          />
          
          <Tags
          :items="postTags"
          :removable="true"
          @delete="deleteTag"
          />
        </div>
      </v-container> -->
      <v-row class="question-options" justify="end" justify-sm="space-between" align="center">
        <v-col cols="auto" order-sm="12">
          <v-switch v-model="anonymous" label="Post Anonymously" color="accent"></v-switch>
        </v-col>
        <v-col cols='12' sm="auto" class="d-flex justify-space-around" order-sm="1">
          <v-btn
            :outlined="!blackboardAttached"
            color="accent lighten-1"
            class="board-action-btn"
            @click="blackboardAttached=!blackboardAttached"
          >
            <span class="mr-2">{{this.blackboardAttached?'Detach':'Attach'}} Blackboard</span>
            <v-icon>mdi-bulletin-board</v-icon>
          </v-btn>
          <v-btn
            @click="clickImage()"
            :outlined="!imageAdded || blackboardAttached"
            color="accent lighten-1"
            class="board-action-btn"
          >
            <span class="mr-2">{{this.imageAdded?'Change':'Add'}} image</span>
            <v-icon>image</v-icon>
          </v-btn>
        </v-col>
      </v-row>
      <v-card outlined elevation="2" v-if="this.addedImage!=''" class="my-4 mx-2">
        <v-container>
          <v-row class="preview-image" align="center" justify="space-around">
            <v-col cols="6" sm="4" md="2">
              <img :src="addedImage" id="addedImage"/>
            </v-col>
            <v-col cols="6" sm="4" md="8">
              <v-row class="px-0" align="center" justify="space-around">
                <v-col cols="auto">
                  <v-switch v-model="blackboardAttached" label="Annotate Image" color="accent"></v-switch>
                </v-col>
                <v-col cols="auto">
                  
                  <v-btn
                    @click="removeImage()"
                    outlined
                    color="accent lighten-1"
                    class="board-action-btn"
                  >Remove</v-btn>
                </v-col>
              </v-row>
            </v-col>
          </v-row>
        </v-container>
      </v-card>
      <div class="blackboard-container" v-show="this.blackboardAttached">
        <BlackboardMini 
          ref="blackboard-mini"
          :visible="visible"
          :background="addedImage"
          @boardImage="boardImage"
        />
      </div>
    </v-container>
  </div>
</template>

<script>
import Vue from 'vue';
import DoodleVideo from "@/components/DoodleVideo.vue"
import BlackboardMini from "@/components/BlackboardMini.vue"
// import SearchBar from '@/components/SearchBar.vue'
// import Tags from "@/components/Tags.vue"

export default {
  props: {
    postType: String, // either "question" or "answer"
    visible: Boolean,
    tagsPool: Array,
    withTags: Boolean
  },
  components: {
    BlackboardMini,
    // Tags,
    // SearchBar
  },
  data: () => ({
    postTitle: "",
    postDescription: "",
    blackboardAttached: true,
    imageAdded: false,
    addedImage: '',
    changeImage: false,
    postTags: [],
    reRenderTags: 0,
    anonymous: false
  }),
  methods: {
    submitPost () {
      if (!this.postTitle) { return; }
      // take a snapshot of the text, images, drawings and audio that the user has created
      const BlackboardMini = this.$refs["blackboard-mini"]
      const blackboardID = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      const post = { title: this.postTitle, 
                     description: this.postDescription, 
                     blackboardID,
                     // postTags: this.postTags,
                     audioURL: BlackboardMini.audioURL,
                     date: this.getDate(),
                     image: this.addedImage,
                     isAnonymous: this.anonymous
                   }
      const payloads = { post, boardStrokes: BlackboardMini.allStrokes}
      this.$emit('post-submit', payloads)
      /// TODO possibly delete the current answer because it persists?
    },
    getDate () {
      var today = new Date();
      return today.toISOString();
    },
    boardImage (boardImage) {
      if (boardImage) {
        this.imageAdded=true
        this.addedImage=boardImage
        this.changeImage=false
      }
    },
    getFullWidth () {
      // sidenav's width = 200, BaseList's width = 300 
      return window.innerWidth - 500 
    },
    clickImage () {
      this.$refs['blackboard-mini'].$refs.background.$el.click()
    },
    addImage () {
      this.imageAdded=true;
      var file = document.getElementById('img-input').files[0];
      var reader = new FileReader();

      reader.addEventListener("load", ()=> {
        this.addedImage = reader.result;
      }, false);

      if (file) {
        reader.readAsDataURL(file);
      }
    },
    removeImage() {
      this.imageAdded=false;
      //this.addedImage=''
      Vue.set(this,'addedImage','')
    },
    //Start of Tags functions
    addTag (tag) {
      for (let t of this.postTags) {
        if (t == tag) return;
      }
      this.postTags.push(tag)
    },
    deleteTag(tag) {
        this.postTags = this.postTags.filter(x => {return x != tag})
    }
    //End of Tags functions
  }
}
</script>