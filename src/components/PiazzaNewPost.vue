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
      <v-textarea
        filled
        :label="postType"
        :placeholder="`Type ${postType} here...`"
        v-model="postDescription"
      />
      <div class="blackboard-container">
        <BlackboardMini 
          ref="blackboard-mini"
          :visible="visible"
        />
        <!-- FUTURE FEATURE: allow user to preview the video he/she made -->
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
    postDescription: ""
  }),
  methods: {
    submitPost () {
      const BlackboardMini = this.$refs["blackboard-mini"]
      event.preventDefault()
      const blackboardID = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      console.log("audio =", BlackboardMini.audioObj)

      // blackboard object 
      const post = { title: "No title yet", 
                     description: this.postDescription, 
                     blackboardID,
                     boardStrokes: BlackboardMini.allStrokes,
                     audioURL: BlackboardMini.audioURL,
                     date: this.getDate() }
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
    addBoardImage (boardImage) {
      this.$emit('board-image', boardImage)
    },
    getFullWidth () {
      // sidenav's width = 200, BaseList's width = 300 
      return window.innerWidth - 500 
    }
  }
}
</script>
<style scoped>
  .post-header {
    background: linear-gradient(#eee,#fff);
    box-shadow: 0 5px 5px rgba(0,0,0,0.15);
  }
</style>