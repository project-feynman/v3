<template>
  <div>
    <BaseAppBar/>
    <v-content>
      <div class="d-flex">
        <!-- THE BASELIST UPDATES THE CURRENT QUESTION BEING VIEWED (e.g. by emitting the questionID when a question is clicked) -->
        <BaseList v-if="questions" @question-click="questionID => this.currentQuestionID = questionID" :questions="questions"/>
        <h1>{{ currentQuestionID }}</h1>
        <PiazzaNewPost />
        

      </div>
    </v-content>
  </div>
</template>

<script>
import db from "@/database.js"
import BaseAppBar from "@/components/BaseAppBar.vue"
import BaseList from "@/components/BaseList.vue"
import DoodleVideo from "@/components/DoodleVideo.vue"
import RenderlessFetchStrokes from "@/components/RenderlessFetchStrokes.vue"
import PiazzaNewPost from "@/components/PiazzaNewPost.vue"
import firebase from "firebase/app"

import "firebase/firestore"

export default {
  components: {
    BaseAppBar,
    BaseList,
    DoodleVideo,
    RenderlessFetchStrokes,
    PiazzaNewPost
  },
  data: () => ({
    currentQuestionID: "",
    questions: [],
    newQuestion: "In the fundamental equation for quantum computation, it states that X = Y, yet I have reasons to think that X = Z (see below image and video). Where did I go wrong?"
  }),
  computed: {
    user () {
      return this.$store.state.user
    },
    questionsRef () {
      const classID = this.$route.params.class_id 
      return db.collection("classes").doc(classID).collection("questions")
    }
  },
  async created () {
    this.fetchQuestions()
  },
  methods: {
    async fetchQuestions () {
      this.questions = [] 
      let questionDocs = await this.questionsRef.get() 
      questionDocs.forEach(doc => {
        this.questions.push({".key": doc.id, ...doc.data()})
      })
      console.log(this.questions)
    },
    async submitQuestion () {
      const newQuestion = this.newQuestion
      this.newQuestion = "" 
      await this.questionsRef.add({
        text: newQuestion,
        image: "",
        videoID: "3u9102vnYb01zaOTYYbB",
        usersWhoUpvoted: []
      })
      this.fetchQuestions()
    },
    async deleteQuestion ({ ".key": questionID }) {
      const ref = this.questionsRef.doc(questionID) 
      await ref.delete()
      this.fetchQuestions()
    },
    allowedToUpvote ({ usersWhoUpvoted }) {
      return this.user && usersWhoUpvoted.includes(this.user.email) === false 
    },
    async upvoteQuestion ({ ".key": questionID, usersWhoUpvoted }) {
      if (!this.user) { 
        return 
      }
      const ref = this.questionsRef.doc(questionID)
      ref.update({
        usersWhoUpvoted: firebase.firestore.FieldValue.arrayUnion(this.user.email)
      })
      this.fetchQuestions()
    },
    getFullWidth () {
      // sidenav's width = 200, BaseList's width = 300 
      return window.innerWidth - 500 
    }
    
  }
}
</script>