<template>
  <div>
    <BaseAppBar :icon="viewingPost && isMobile ? 'back' : undefined" @icon-click="backToList()" />
    <v-content>
      <v-container fluid class="py-0" ref="main">
        <v-row>
          <v-col
            id="piazza-question-list"
            cols="12"
            sm="auto"
            ref="questions"
            :class="(viewingPost?'d-none':'d-block')+' d-sm-block'"
          >
            <PiazzaQuestionList
              :question="currentQuestion"
              :questions="questions"
              @question-create="handleQuestionCreate()"
              @question-click="clickedQuestion => handleQuestionClick(clickedQuestion)"
            />
          </v-col>
          <v-col
            id="question-canvas"
            class="px-0 px-sm-5"
            cols="12"
            sm
            :class="(viewingPost?'d-block':'d-none')+' d-sm-block'"
          >
            <v-card class="py-3 px-3 mx-auto" style="max-width:1000px;">
              <PiazzaNewPost
                v-if="isAddingNewQuestion"
                :question="currentQuestion"
                :boardStrokes="boardStrokes"
                @question-submit="questionObj => submitQuestion(questionObj)"
                @new-stroke="stroke => handleNewStroke(stroke)"
              />
              <PiazzaViewPost v-else :question="currentQuestion" />
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-content>
  </div>
</template>

<script>
import db from "@/database.js";
import BaseAppBar from "@/components/BaseAppBar.vue";
import PiazzaQuestionList from "@/components/PiazzaQuestionList.vue";
import DoodleVideo from "@/components/DoodleVideo.vue";
import RenderlessFetchStrokes from "@/components/RenderlessFetchStrokes.vue";
import PiazzaNewPost from "@/components/PiazzaNewPost.vue";
import PiazzaViewPost from "@/components/PiazzaViewPost.vue";
import firebase from "firebase/app";
import "firebase/firestore";

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
    boardStrokes: [],
    viewingPost: false,
    isMobile: window.innerWidth < 600
  }),
  computed: {
    user() {
      return this.$store.state.user;
    },
    questionsRef() {
      const classID = this.$route.params.class_id;
      return db
        .collection("classes")
        .doc(classID)
        .collection("questions");
    }
  },
  async created() {
    this.fetchQuestions();
  },
  mounted() {
    this.setQuestionsHeight();
    window.addEventListener("resize", this.setQuestionsHeight);
    window.addEventListener("orientationchange", this.setQuestionsHeight);
  },
  methods: {
    async fetchQuestions() {
      this.questions = [];
      let questionDocs = await this.questionsRef.get();
      questionDocs.forEach(doc => {
        this.questions.push({ ".key": doc.id, ...doc.data() });
      });
    },
    handleQuestionClick(clickedQuestion) {
      this.currentQuestion = clickedQuestion;
      this.isAddingNewQuestion = false;
      this.viewingPost = true;
    },
    handleQuestionCreate() {
      this.isAddingNewQuestion = true;
      this.currentQuestion = {};
      this.viewingPost = true;
    },
    handleNewStroke(stroke) {
      this.boardStrokes.push(stroke);
    },
    async submitQuestion({ title, description, blackboardID }) {
      // save the drawing/video as a new whiteboard doc
      await db
        .collection("whiteboards")
        .doc(blackboardID)
        .set({
          strokes: this.boardStrokes
        });
      // create a Question doc that points to the blackboard
      await this.questionsRef.add({
        title,
        description,
        blackboardID,
        usersWhoUpvoted: []
      });
      this.fetchQuestions();
    },
    async deleteQuestion({ ".key": questionID }) {
      const ref = this.questionsRef.doc(questionID);
      await ref.delete();
      this.fetchQuestions();
    },
    allowedToUpvote({ usersWhoUpvoted }) {
      return this.user && usersWhoUpvoted.includes(this.user.email) === false;
    },
    async upvoteQuestion({ ".key": questionID, usersWhoUpvoted }) {
      if (!this.user) {
        return;
      }
      const ref = this.questionsRef.doc(questionID);
      ref.update({
        usersWhoUpvoted: firebase.firestore.FieldValue.arrayUnion(
          this.user.email
        )
      });
      this.fetchQuestions();
    },
    getFullWidth() {
      return window.innerWidth;
    },
    setQuestionsHeight() {
      var topOffset = this.$refs.main.getBoundingClientRect();
      this.$refs.questions.style.height =
        window.innerHeight - topOffset.top + "px";

      this.isMobile = window.innerWidth < 600;
    },
    backToList() {
      console.log("back to list");
      this.viewingPost = false;
    }
  }
};
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