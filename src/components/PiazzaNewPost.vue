<!-- Offer the user a text area + blackboard to create a Q or A -->
<template>
  <div>
    <v-textarea
      outlined
      :label="postType"
      :placeholder="`Type ${postType} here...`"
      v-model="newPost"
      class="mt-2"
    />
    <div :style="`height: ${getFullWidth() * 9/16}px; position: relative`" >
      <BlackboardMini 
        :allStrokes="boardStrokes" 
        :height="`${getFullWidth() * 9/16}`"
        @board-image="addBoardImage"
        @new-stroke="stroke => $emit('new-stroke', stroke)"
        @board-wipe="$emit('board-wipe')"
      />
      <!-- FUTURE FEATURE: allow user to preview the video he/she made -->
    </div>
    <v-btn @click="submitPost()" block color="secondary" dark>Submit {{ postType }}</v-btn>
  </div>
</template>

<script>
import DoodleVideo from "@/components/DoodleVideo.vue"
import BlackboardMini from "@/components/BlackboardMini.vue"

export default {
  props: {
    boardStrokes: Array,
    postType: String, // either "question" or "answer"
  },
  components: {
    BlackboardMini
  },
  data: () => ({
    newPost: ""
  }),
  methods: {
    submitPost () {
      event.preventDefault()
      const blackboardID = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      const post = { title: "No title yet", 
                     description: this.newPost, 
                     blackboardID,
                     date: this.getDate() }
      this.$emit('post-submit', post)
      this.newPost = ""
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