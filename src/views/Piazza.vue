<template>
  <div>
    <BaseAppBar/>
    <v-content>
      <div class="d-flex">
        <PiazzaQuestionList
          :question="currentQuestion"
          :questions="questions"
          @question-create="handleQuestionCreate()"
          @question-click="clickedQuestion => handleQuestionClick(clickedQuestion)" 
        />
        <PiazzaNewPost 
          v-if="isAddingNewQuestion" 
          :question="currentQuestion"
          :boardStrokes="boardStrokes"
          @question-submit="questionObj => submitQuestion(questionObj)"
          @new-stroke="stroke => handleNewStroke(stroke)"
        />
        <PiazzaViewPost 
          v-else
          :question="currentQuestion"
          :answers="answers"
          @answer-submit="answerObj => submitAnswer(answerObj)"
        />
      </div>
    </v-content>
  </div>
</template>

<script>
import db from "@/database.js"
import BaseAppBar from "@/components/BaseAppBar.vue"
import PiazzaQuestionList from "@/components/PiazzaQuestionList.vue"
import DoodleVideo from "@/components/DoodleVideo.vue"
import RenderlessFetchStrokes from "@/components/RenderlessFetchStrokes.vue"
import PiazzaNewPost from "@/components/PiazzaNewPost.vue"
import PiazzaViewPost from "@/components/PiazzaViewPost.vue"
import firebase from "firebase/app"
import "firebase/firestore"

export default {
  components: {
    BaseAppBar,
    PiazzaQuestionList,
    DoodleVideo,
    RenderlessFetchStrokes,
    PiazzaNewPost,
    PiazzaViewPost
  },
  data: () => ({
    isAddingNewQuestion: true,
    currentQuestion: {},
    questions: [],
    answers: [],
    boardStrokes: []
  }),
  computed: {
    user () {
      return this.$store.state.user
    },
    questionsRef () {
      const classID = this.$route.params.class_id 
      return db.collection("classes").doc(classID).collection("questions")
    },
    answersRef () {
      const classID = this.$route.params.class_id
      const questionID = this.currentQuestion['.key']
      return db.collection("classes").doc(classID).collection("questions").doc(questionID).collection("answers")
    }
  },
  async created () {
    this.fetchQuestions()
  },
  methods: {
    async fetchQuestions () {
      this.questions = [] 
      console.log(this.questions)
      let questionDocs = await this.questionsRef.get() 
      questionDocs.forEach(doc => {
        this.questions.push({".key": doc.id, ...doc.data()})
      })
    },
    async fetchAnswers () {
      this.answers = [] 
      console.log(this.answers)
      let answersDocs = await this.answersRef.get() 
      answersDocs.forEach(doc => {
        this.answers.push({".key": doc.id, ...doc.data()})
      })
    },
    handleQuestionClick (clickedQuestion) {
      this.currentQuestion = clickedQuestion
      this.isAddingNewQuestion = false 
      this.fetchAnswers()
    },
    handleQuestionCreate () {
      this.isAddingNewQuestion = true  
      this.currentQuestion = {}
    },
    handleNewStroke (stroke) {
      this.boardStrokes.push(stroke)
    },
    async submitQuestion ({ title, description, blackboardID }) {
      // save the drawing/video as a new whiteboard doc
      await db.collection("whiteboards").doc(blackboardID).set({
        strokes: this.boardStrokes
      })
      // create a Question doc that points to the blackboard
      await this.questionsRef.add({
        title,
        description,
        blackboardID,
        usersWhoUpvoted: []
      })
      this.fetchQuestions()
    },
    async submitAnswer ({ description, blackboardID }) {
      // save the drawing/video as a new whiteboard doc
      await db.collection("whiteboards").doc(blackboardID).set({
        strokes: this.boardStrokes
      })
      // create a Question doc that points to the blackboard
      await this.answersRef.add({
        description,
        blackboardID,
        usersWhoUpvoted: []
      })
      this.fetchAnswers()
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