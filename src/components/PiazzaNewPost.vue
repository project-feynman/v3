<!-- Offer the user a text area + blackboard to create a Q or A -->
<template>
  <div class="new-post">
    <v-textarea
      outlined
      :label="postType"
      :placeholder="`Type ${postType} here...`"
      v-model="postDescription"
      class="mt-2"
    />
    <!-- for some reason the below div is necessary to deal with resizing edge cases -->
    <div :style="`height: ${getFullWidth() * 9/16}px; position: relative`" >
      <BlackboardMini ref="blackboard-mini"/>
      <!-- FUTURE FEATURE: allow user to preview the video he/she made -->
    </div>
    <v-btn @click.prevent="submitPost()" block color="secondary" dark class="mt-5">
      Submit {{ postType }}
    </v-btn>
  </div>
</template>

<script>
import DoodleVideo from "@/components/DoodleVideo.vue"
import BlackboardMini from "@/components/BlackboardMini.vue"

export default {
  props: {
    postType: String, // either "question" or "answer"
    audioObj: Object
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
      // blackboard object 
      const post = { title: "No title yet", 
                     description: this.postDescription, 
                     blackboardID,
                     boardStrokes: BlackboardMini.allStrokes,
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