<template>
  <div>
    <BaseAppBar/>
    <v-content>
      <div class="d-flex">
        <PiazzaQuestionList
          :questions="questions"
          @question-create="handleQuestionCreate()"
          @question-click="clickedQuestion => handleQuestionClick(clickedQuestion)" 
        />
        <v-card :width="getFullWidth()">
          <template v-if="isAddingNewQuestion">
            <BetaNewPost 
              postType="question" 
              :boardStrokes="boardStrokes"
              @new-stroke="stroke => addNewStroke(stroke)"
              @board-wipe="boardStrokes = []"
              @post-submit="question => submitQuestion(question)"
            />
          </template>
          <template v-else>
            <BetaViewPost :post="currentQuestion"/>
            <BetaViewPost 
              v-for="(answer, i) in answers" 
              :key="answer['.key']"
              :post="answer" 
              :postNumber="i"
            />
            <BetaNewPost
              postType="answer"
              :boardStrokes="boardStrokes"
              @board-wipe="boardStrokes = []"
              @post-submit="answer => submitAnswer(answer)"
              @new-stroke="stroke => addNewStroke(stroke)"
            />
          </template>
        </v-card>
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
import BetaNewPost from "@/components/BetaNewPost.vue"
import BetaViewPost from "@/components/BetaViewPost.vue"
import AsyncRenderless from "@/components/AsyncRenderless.vue"
import firebase from "firebase/app"
import "firebase/firestore"
import { mapState } from 'vuex'

export default {
  components: {
    BaseAppBar,
    PiazzaQuestionList,
    DoodleVideo,
    RenderlessFetchStrokes,
    PiazzaNewPost,
    PiazzaViewPost,
    BetaNewPost,
    BetaViewPost,
    AsyncRenderless
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
      let questionDocs = await this.questionsRef.get() 
      questionDocs.forEach(doc => {
        this.questions.push({".key": doc.id, ...doc.data()})
      })
    },
    async fetchAnswers () {
      this.answers = [] 
      let answersDocs = await this.answersRef.get() 
      answersDocs.forEach(doc => {
        this.answers.push({".key": doc.id, ...doc.data()})
      })
    },
    handleQuestionCreate () {
      this.isAddingNewQuestion = true  
      this.currentQuestion = {}
    },
    handleQuestionClick (clickedQuestion) {
      this.currentQuestion = clickedQuestion
      this.isAddingNewQuestion = false 
      this.fetchAnswers()
      this.boardStrokes = [] 
    },
    addNewStroke (stroke) {
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
      this.boardStrokes = [] 
      // TODO: clear canvas 
      this.fetchQuestions()
    },
    async submitAnswer ({ description, blackboardID }) {
      // save the drawing/video as a new whiteboard doc
      await db.collection("whiteboards").doc(blackboardID).set({
        strokes: this.boardStrokes
      })
      // create an answer doc that points to the blackboard
      await this.answersRef.add({
        description,
        blackboardID,
        usersWhoUpvoted: []
      })
      this.boardStrokes = [] 
      // TODO: clear canvas
      this.fetchAnswers()
    },
    async deleteQuestion ({ ".key": questionID }) {
      const ref = this.questionsRef.doc(questionID) 
      await ref.delete()
      this.fetchQuestions()
    },
    getFullWidth () {
      // sidenav's width = 200, BaseList's width = 300 
      return window.innerWidth - 500 
    }
    // allowedToUpvote ({ usersWhoUpvoted }) {
    //   return this.user && usersWhoUpvoted.includes(this.user.email) === false 
    // },
    // async upvoteQuestion ({ ".key": questionID, usersWhoUpvoted }) {
    //   if (!this.user) { 
    //     return 
    //   }
    //   const ref = this.questionsRef.doc(questionID)
    //   ref.update({
    //     usersWhoUpvoted: firebase.firestore.FieldValue.arrayUnion(this.user.email)
    //   })
    //   this.fetchQuestions()
    // },
  }
}
</script>