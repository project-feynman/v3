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
      <v-row class="question-options" justify-content="space-between" align-items="center">
        <v-col cols="auto">
          <v-btn
            :outlined="!blackboardAttached"
            color="accent lighten-1"
            class="board-action-btn"
            @click="blackboardAttached=!blackboardAttached"
          >
            <span class="d-none d-sm-block mr-2">{{this.blackboardAttached?'Detach':'Attach'}} Blackboard</span>
            <v-icon>mdi-bulletin-board</v-icon>
          </v-btn>
          <v-btn
            @click="clickImage()"
            :outlined="!imageAdded || blackboardAttached"
            color="accent lighten-1"
            class="board-action-btn"
          >
            <span class="d-none d-sm-block mr-2">{{this.imageAdded?'Change':'Add'}} image</span>
            <v-icon>image</v-icon>
          </v-btn>
        </v-col>
        <v-col></v-col>
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
          :changeBackground="changeImage"
          :background="addedImage"
          @boardImage="boardImage"
        />
      </div>
    </v-container>
  </div>
</template>

<script>
import DoodleVideo from "@/components/DoodleVideo.vue"
import BlackboardMini from "@/components/BlackboardMini.vue"

export default {
  props: {
    postType: String, // either "question" or "answer"
    visible: Boolean
  },
  components: {
    BlackboardMini
  },
  data: () => ({
    postTitle: "",
    postDescription: "",
    blackboardAttached: true,
    imageAdded: false,
    //annotateImage: false,
    addedImage: '',
    changeImage: false
  }),
  methods: {
    submitPost () {
      const BlackboardMini = this.$refs["blackboard-mini"]
      event.preventDefault()
      const blackboardID = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      console.log("audio =", BlackboardMini.audioObj)

      // blackboard object 
      const post = { title: this.postTitle, 
                     description: this.postDescription, 
                     blackboardID,
                     boardStrokes: BlackboardMini.allStrokes,
                     audioURL: BlackboardMini.audioURL,
                     date: this.getDate(),
                     background: this.addedImage
                      }
      this.$emit('post-submit', post)
      // reset 
      this.postDescription = ""
      BlackboardMini.wipeBoard()
    },
    getDate () {
      var today = new Date();
      var dd = String(today.getDate()).padStart(2, '0');
      var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
      var yyyy = today.getFullYear()
      return today = mm + '/' + dd + '/' + yyyy
    },
    boardImage (boardImage) {
      this.imageAdded=true
      this.addedImage=boardImage
      this.changeImage=false
    },
    getFullWidth () {
      // sidenav's width = 200, BaseList's width = 300 
      return window.innerWidth - 500 
    },
    clickImage () {
      this.changeImage=true
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
      this.addedImage=''
    }
  }
}
</script>
<style>
  .post-header {
    background: linear-gradient(#eee,#fff);
    box-shadow: 0 5px 5px rgba(0,0,0,0.15);
  }
  .question-options .v-btn {
    text-transform: unset;
    letter-spacing: unset;
    margin: 0 5px;
  }
  #addedImage {
    max-width:100%;
    max-height: 200px;
  }
  .input-title textarea {
    max-height:100%;
  }
  .input-description textarea {
    color: #555 !important;
    font-size: 0.9em;
  }
</style>