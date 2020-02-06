<template>
  <div>
    <TheAppBar
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
                  @post-submit="question => submitPost(question, questionsRef)"
                />
              </template>
              <template v-else>
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
import TheAppBar from "@/components/TheAppBar.vue"
import PiazzaQuestionsList from "@/components/PiazzaQuestionsList.vue"
import DoodleVideo from "@/components/DoodleVideo.vue"
import PiazzaNewPost from "@/components/PiazzaNewPost.vue"
import PiazzaViewPost from "@/components/PiazzaViewPost.vue"
import firebase from "firebase/app"
import "firebase/firestore"
import { mapState } from 'vuex';
import helpers from "@/helpers.js";

export default {
  components: {
    TheAppBar,
    PiazzaQuestionsList,
    DoodleVideo,
    PiazzaNewPost,
    PiazzaViewPost,
  },
  data: () => ({
    newQuestionKey: 0,
    isAddingNewQuestion: true,
    currentQuestion: {},
    questions: [],
    answers: [],
    boardStrokes: [],
    whiteBoardImage: "",
    isViewingPost: false,
    isMobile: window.innerWidth < 600,
    tagsPool: [],
    activeElem: 0,
  }),
  computed: {
    user () { return this.$store.state.user },
    questionsRef () { return db.collection("classes").doc(this.$route.params.class_id).collection("questions") },
    answersRef () { return db.collection("classes").doc(this.$route.params.class_id).collection("questions").doc(this.currentQuestion['.key']).collection("answers") }
  },
  async created () {
    this.classID = this.$route.params.class_id;
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
    // this.fetchTagsPool()
  },
  mounted () {
    this.setQuestionsHeight();
    window.addEventListener("resize", this.setQuestionsHeight);
    window.addEventListener("orientationchange", this.setQuestionsHeight);
  },
  methods: {
    fetchQuestions () {
      const promise = new Promise(async resolve => {
        this.questions = await helpers.getCollectionFromDB(this.questionsRef);
        resolve()
      }) 
      return promise
    },
    async fetchAnswers () {
      this.answers = helpers.getCollectionFromDB(this.answersRef);
    },
    handleQuestionCreate () {
      // destroy and create a new one
      this.isAddingNewQuestion = false
      this.isAddingNewQuestion = true
      this.currentQuestion = {}
      this.isViewingPost = true
    },
    handleQuestionClick (clickedQuestion) {
      const classID = this.$route.params.class_id;
      this.$router.push(`/${classID}/questions/${clickedQuestion[".key"]}`)
      this.currentQuestion = clickedQuestion
      this.fetchAnswers()
      this.isAddingNewQuestion = false 
      this.isViewingPost = true
    },
    async submitPost ({ post, boardStrokes }, ref) {
      // should be stored as subcollections so it can be lazy fetched
      db.collection("whiteboards").doc(post.blackboardID).set({
        strokes: boardStrokes,
        // image: this.whiteBoardImage
      })
      
      // get the class name 
      const classID = this.$route.params.class_id
      const classRef = db.collection("classes").doc(classID);
      const classDoc = await classRef.get();
      post.class = {
        ID: classID,
        name: classDoc.data().name
      }
      post.author = {
        UID: this.user.uid,
        firstName: this.user.firstName || "no first name",
        lastName: this.user.lastName || "no last name"
      }
      await ref.add(post);
      this.fetchQuestions();
      // Incrementing the key to force NewPost to re-render
      this.newQuestionKey += 1;
      // TODO: update UI correctly after submitting an answer
      // this.fetchAnswers()
    },
    async deleteQuestion ({ ".key": questionID }) {
      const ref = this.questionsRef.doc(questionID);
      await ref.delete();
      this.fetchQuestions();
    },
    getFullWidth () { return window.innerWidth; },
    backToList () { this.isViewingPost = false; },
    setQuestionsHeight () {
      if (this.$refs.main) {
        var topOffset = this.$refs.main.getBoundingClientRect();
        this.$refs.questions.style.height = window.innerHeight - topOffset.top + "px";
      }
      this.isMobile = window.innerWidth < 600;
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