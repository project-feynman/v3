<template>
  <div>
    <BaseAppBar 
      :icon="viewingPost && isMobile ? 'back' : undefined" 
      @icon-click="backToList()"
    />
    <v-content>
      <v-container fluid class="py-0" ref="main">
        <v-row>
          <v-col id="piazza-question-list" cols="12" sm="auto" ref="questions" :class="(viewingPost?'d-none':'d-block')+' d-sm-block'">
            <PiazzaQuestionsList
              :questions="questions"
              @question-create="handleQuestionCreate()"
              @question-click="clickedQuestion => handleQuestionClick(clickedQuestion)"
            />
          </v-col>
          <v-col v-if="(viewingPost && isMobile) || (!isMobile)" id="question-canvas" class="px-0 px-sm-5" cols="12" sm :class="(viewingPost?'d-block':'d-none')+' d-sm-block'">
            <v-card class="mx-auto elevation-6" style="max-width:1000px;">
              <template v-if="isAddingNewQuestion">
                <PiazzaNewPost 
                  postType="Question"
                  :visible="this.viewingPost"
                  :tagsPool="tagsPool"
                  :withTags="true"
                  @post-submit="question => submitPost(question, questionsRef)"
                />
              </template>
              <template v-else>
                <PiazzaViewPost :post="currentQuestion"/>
                <PiazzaViewPost 
                  v-for="(answer, i) in answers" :key="answer['.key']"
                  :post="answer" 
                  :postNumber="i"
                />
                <PiazzaNewPost
                  postType="answer"
                  :withTags="false"
                  @post-submit="answer => submitPost(answer, answersRef)"
                />
              </template>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-content>
  </div>
</template>

<script>
import db from "@/database.js"
import BaseAppBar from "@/components/BaseAppBar.vue"
import PiazzaQuestionsList from "@/components/PiazzaQuestionsList.vue"
import DoodleVideo from "@/components/DoodleVideo.vue"
import RenderlessFetchStrokes from "@/components/RenderlessFetchStrokes.vue"
import PiazzaNewPost from "@/components/PiazzaNewPost.vue"
import PiazzaViewPost from "@/components/PiazzaViewPost.vue"
import AsyncRenderless from "@/components/AsyncRenderless.vue"
import firebase from "firebase/app"
import "firebase/firestore"
import {initQuestionService} from "../dep";
import { mapState } from 'vuex'

export default {
  components: {
    BaseAppBar,
    PiazzaQuestionsList,
    DoodleVideo,
    RenderlessFetchStrokes,
    PiazzaNewPost,
    PiazzaViewPost,
    AsyncRenderless
  },
  data: () => ({
    questionService: initQuestionService(),
    isAddingNewQuestion: true,
    currentQuestion: {},
    questions: [],
    answers: [],
    boardStrokes: [],
    whiteBoardImage: "",
    viewingPost: false,
    isMobile: window.innerWidth < 600,
    tagsPool: []
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
    this.fetchTagsPool()
  },
  mounted() {
    this.setQuestionsHeight();
    window.addEventListener("resize", this.setQuestionsHeight);
    window.addEventListener("orientationchange", this.setQuestionsHeight);
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
    async fetchTagsPool() {
        this.tagsPool = []
        const classID = this.$route.params.class_id
        db.collection('classes').doc(classID).get().then(doc => {
            this.tagsPool = doc.data().tagsPool
        })
    },
    handleQuestionCreate () {
      // destroy and create a new one
      this.isAddingNewQuestion = false
      this.isAddingNewQuestion = true
      this.currentQuestion = {}
      this.viewingPost = true
    },
    handleQuestionClick (clickedQuestion) {
      this.currentQuestion = clickedQuestion
      this.fetchAnswers()
      this.isAddingNewQuestion = false 
      this.viewingPost = true
    },
    async submitPost ({ title, description, blackboardID, boardStrokes, date, audioURL, postTags }, ref) {
      db.collection("whiteboards").doc(blackboardID).set({
            strokes: boardStrokes,
            // image: this.whiteBoardImage
      })
      const postObj = {
        title,
        description,
        // to get graphQL to not complain
        questionDescription: description,
        blackboardID,
        videoID: blackboardID,
        postTags,
        date,
        audioURL,
        usersWhoUpvoted: [],
        inquisitorID: this.user ? this.user.uid : "",
        classID: this.$route.params.class_id,
      }
      await ref.add(postObj)

      this.fetchQuestions()
      //this.fetchAnswers()
      // trigger email notification
      // let inquisitorID = this.user ? this.user.uid : "";
      // let classID = this.$route.params.class_id;

      // trigger email notification
      let question;
      try {
        question = await this.questionService.askQuestion(postObj)
        //   {
        //   title,
        //   questionDescription: description,
        //   videoID: blackboardID,
        //   date,
        //   usersWhoUpvoted: [],
        //   inquisitorID: inquisitorID,
        //   classID,
        // }
      } catch (error) {
        console.log(error)
      }
      // TODO: reset/update variables
    },
    async deleteQuestion ({ ".key": questionID }) {
      const ref = this.questionsRef.doc(questionID)
      await ref.delete()
      this.fetchQuestions()
    },
    getFullWidth () {
      return window.innerWidth
    },
    backToList() {
      this.viewingPost = false;
    },
    setQuestionsHeight() {
      if (this.$refs.main) {
        var topOffset = this.$refs.main.getBoundingClientRect();
        this.$refs.questions.style.height = window.innerHeight - topOffset.top + "px";
      }
      this.isMobile = window.innerWidth < 600;
    },
    // async joinClass () {
    //   const classID = this.$route.params.class_id
    //   const ref = db.collection("users").doc(this.user.uid) 
    //   await ref.update({
    //     enrolledClasses: firebase.firestore.FieldValue.arrayUnion({classID: "notify_always"})
    //   })
    //   settimeout(() => console.log("this.user =", this.user), 2000)
    // },
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

<style>
#piazza-question-list {
  padding: 0;
}
@media (min-width: 600px) {
  #piazza-question-list {
    position: sticky;
    top: 48px;
    left: 0;
    height: 100%;
    overflow: auto;
    width: 30%;
    max-width: 300px;
  }
}
</style> 