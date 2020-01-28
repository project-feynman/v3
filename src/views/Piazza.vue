<template>
  <div>
    <BaseAppBar 
      :icon="isViewingPost && isMobile ? 'back' : undefined" 
      @icon-click="backToList()"
    />
    <v-content>
      <v-container fluid class="py-0" ref="main">
        <v-row>
          <v-col id="piazza-question-list" cols="12" sm="auto" ref="questions" :class="(isViewingPost?'d-none':'d-block')+' d-sm-block'">
            <PiazzaQuestionsList
              :questions="questions"
              v-model="activeElem"
              @question-create="handleQuestionCreate()"
              @question-click="clickedQuestion => handleQuestionClick(clickedQuestion)"
            />
          </v-col>
          <v-col v-if="(isViewingPost && isMobile) || (!isMobile)" id="question-canvas" class="px-0 px-sm-5" cols="12" sm :class="(isViewingPost?'d-block':'d-none')+' d-sm-block'">
            <v-card class="mx-auto elevation-6" style="max-width:1000px;">
              <template v-if="isAddingNewQuestion">
                <PiazzaNewPost 
                  :key="newQuestionKey"
                  postType="Question"
                  :visible="this.isViewingPost"
                  :tagsPool="tagsPool"
                  :withTags="true"
                  @post-submit="question => submitPost(question, questionsRef)"
                />
              </template>
              <template v-else>
                <!-- <PiazzaViewPost :post="currentQuestion" postType="Question"/> -->
                <PiazzaViewPost 
                  :post="currentQuestion"
                  :key="currentQuestion['.key']"
                  />
                <PiazzaViewPost 
                  v-for="(answer, i) in answers" 
                  :key="answer['.key']"
                  :post="answer" 
                  :postNumber="i"
                  postType="Answers"
                />
                <PiazzaNewPost
                  postType="Answer"
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
    newQuestionKey: 0,
    questionService: initQuestionService(),
    isAddingNewQuestion: true,
    currentQuestion: {},
    questions: [],
    answers: [],
    boardStrokes: [],
    whiteBoardImage: "",
    isViewingPost: false,
    isMobile: window.innerWidth < 600,
    tagsPool: [],
    activeElem: 0
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
    // first fetch questions
    await this.fetchQuestions()
    const questionID = this.$route.params.question_id
    if (!questionID) return; // early exit user visited from home page 
    // search for the question
    this.questions.forEach((question, index )=> {
      if (question[".key"] === questionID) {
        this.currentQuestion = question;
        this.isAddingNewQuestion = false;
        this.isViewingPost = true;
        this.activeElem = index + 1
      }
    })
    // case 2: user wants to visit a specific question using a link
    this.fetchTagsPool()
  },
  mounted() {
    this.setQuestionsHeight();
    window.addEventListener("resize", this.setQuestionsHeight);
    window.addEventListener("orientationchange", this.setQuestionsHeight);
  },
  methods: {
    fetchQuestions () {
      // has to return a promise 
      const P = new Promise(async (resolve) => {
        this.questions = []
        let questionDocs = await this.questionsRef.get()
        questionDocs.forEach(doc => {
          this.questions.push({".key": doc.id, ...doc.data()})
        })
        resolve()
      }) 
      return P
    },
    async fetchAnswers () {
      this.answers = [] 
      let answersDocs = await this.answersRef.get() 
      answersDocs.forEach(doc => {
        this.answers.push({".key": doc.id, ...doc.data()})
      })
    },
    async fetchTagsPool() {
        /*this.tagsPool = []
        const classID = this.$route.params.class_id
        db.collection('classes').doc(classID).get().then(doc => {
            this.tagsPool = doc.data().tagsPool
        })*/
    },
    handleQuestionCreate () {
      // destroy and create a new one
      this.isAddingNewQuestion = false
      this.isAddingNewQuestion = true
      this.currentQuestion = {}
      this.isViewingPost = true
    },
    handleQuestionClick (clickedQuestion) {
      this.$router.push(`${clickedQuestion[".key"]}`)
      this.currentQuestion = clickedQuestion
      this.fetchAnswers()
      this.isAddingNewQuestion = false 
      this.isViewingPost = true
    },
    async submitPost ({ post, boardStrokes }, ref) {
      db.collection("whiteboards").doc(post.blackboardID).set({
            strokes: boardStrokes,
            // image: this.whiteBoardImage
      })
      // const postObj = post 
      post.author = this.user
      // below is graphQL 
      post.videoID = post.blackboardID;
      post.questionDescription = post.description;
      post.classID = this.$route.params.class_id;
      post.inquisitorID = this.user ? this.user.uid : "";
      await ref.add(post)
      this.fetchQuestions()
      // Incrementing the key causes the new question component to re-render to reset its state
      this.newQuestionKey += 1
      console.log("this.newQuestionKey =", this.newQuestionKey)
      //this.fetchAnswers()
      // trigger email notification
      // let inquisitorID = this.user ? this.user.uid : "";
      // let classID = this.$route.params.class_id;

      // trigger email notification
      let question;
      try {
        // question = await this.questionService.askQuestion(post)
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
      this.isViewingPost = false;
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