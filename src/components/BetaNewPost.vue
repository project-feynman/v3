<!-- Offer the user a text area + blackboard to create a Q or A -->
<template>
  <div>
    <v-textarea
      outlined
      name="input-7-4"
      :label="postType"
      :placeholder="`Type ${postType} here...`"
      v-model="newPost"
      class="mt-2"
    />
    <div :style="`height: ${getFullWidth() * 9/16}px; position: relative`" >
      <BlackboardMini 
        :allStrokes="boardStrokes" 
        :height="`${getFullWidth() * 9/16}`"
        @new-stroke="stroke => $emit('new-stroke', stroke)"
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
    postType: String // either "question" or "answer"
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
                     blackboardID }
      this.$emit('post-submit', post)
      this.newPost = ""
    },
    getFullWidth () {
      // sidenav's width = 200, BaseList's width = 300 
      return window.innerWidth - 500 
    }
  }
}
</script>