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
              <template v-if="!isViewingPost">
                <PiazzaNewPost 
                  :key="keyToForceReload"
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
                  v-for="(answer, i) in sortedAnswers" 
                  @video-save="post => saveVideo(post)"
                  :key="answer['.key']"
                  :post="answer" 
                  :postNumber="i"
                  postType="Answer"
                />
                <PiazzaNewPost
                  :key="keyToForceReload"
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
import db from "@/database.js";
import TheAppBar from "@/components/TheAppBar.vue";
import DoodleVideo from "@/components/DoodleVideo.vue";
import PiazzaQuestionsList from "@/components/PiazzaQuestionsList.vue";
import PiazzaNewPost from "@/components/PiazzaNewPost.vue";
import PiazzaViewPost from "@/components/PiazzaViewPost.vue";
import firebase from "firebase/app";
import "firebase/firestore";
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
    keyToForceReload: 0,
    isViewingPost: false,
    currentQuestion: {},
    questions: [],
    answers: [],
    isMobile: window.innerWidth < 600,
    // tagsPool: [],
    activeElem: 0,
  }),
  computed: {
    user () { 
      return this.$store.state.user;
    },
    classId () {
      return this.$route.params.class_id;
    },
    classRef () {
      return db.collection("classes").doc(this.classId);
    },
    questionsRef () { 
      return this.classRef.collection("questions") 
    },
    answersRef () { 
      if (!this.currentQuestion[".key"]) return; 
      return this.questionsRef.doc(this.currentQuestion['.key']).collection("answers");
    },
    sortedAnswers () {
      return this.answers.sort((a, b) => (a.date < b.date) ? 1 : ((a.date > b.date) ? -1 : 0))
    }
  },
  async created () {
    // first fetch questions
    await this.fetchQuestions();
    const { question_id } = this.$route.params;
    if (!question_id) return; // early exit user visited from home page 
    // search for the question
    this.questions.forEach((question, index)=> {
      if (question[".key"] === question_id) {
        this.currentQuestion = question;
        this.isViewingPost = true;
        this.activeElem = index + 1
      }
    })
  },
  watch: {
    currentQuestion: {
      handler: "fetchAnswers",
      immediate: true
    }
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
        resolve();
      }) 
      return promise;
    },
    async fetchAnswers () {
      if (!this.currentQuestion[".key"]) return;  // edge case: user is creating a new question
      this.answers = await helpers.getCollectionFromDB(this.answersRef);
    },
    handleQuestionCreate () {
      this.currentQuestion = {};
      this.isViewingPost = false;
      this.answers = [];
    },
    handleQuestionClick (clickedQuestion) {
      this.$router.push(`/${this.classId}/questions/${clickedQuestion[".key"]}`)
      this.currentQuestion = clickedQuestion
      this.isViewingPost = true
    },
    async submitPost ({ post, boardStrokes }, ref) {
      // should be stored as subcollections so it can be lazy fetched
      if (post.blackboardId) {
        const boardRef = this.classRef.collection("blackboards").doc(post.blackboardId);
        boardRef.set({
          audioUrl: post.audioUrl,
          description: post.description,
          duration: post.duration
        })
        // Save the strokes as a subcollection
        for (let stroke of boardStrokes) {
          boardRef.collection("strokes").add(stroke);
        }
      }
      // Get the class name (TODO: refactor to Vuex)
      const classDoc = await this.classRef.get();
      post.fromClass = {
        id: this.classId,
        name: classDoc.data().name
      }
      post.author = {
        uid: this.user.uid,
        firstName: this.user.firstName || "no first name",
        lastName: this.user.lastName || "no last name"
      }
      await ref.add(post);
      // either a question or an answ er is added 
      if (!this.isViewingPost) this.fetchQuestions(); // was a new question 
      else this.fetchAnswers(); // was a new answer, currentQuestion doesn't change so watch hook won't invoke fetchAnswers()
      this.keyToForceReload += 1; // Incrementing the key to force NewPost to re-render
    },
    async saveVideo ({ ".key": postId, blackboardId, description }) {
      this.answersRef.doc(postId).update({
        isSaved: true
      });
      const blackboardRef = this.classRef.collection("blackboards").doc(blackboardId);
      await blackboardRef.update({
        description,
        tabNumber: 0
      });
    },
    async deleteQuestion ({ ".key": questionId }) {
      const ref = this.questionsRef.doc(questionId);
      await ref.delete();
      this.fetchQuestions();
    },
    getFullWidth () { 
      return window.innerWidth; 
    },
    backToList () { 
      this.isViewingPost = false; 
    },
    setQuestionsHeight () {
      if (this.$refs.main) {
        var topOffset = this.$refs.main.getBoundingClientRect();
        this.$refs.questions.style.height = window.innerHeight - topOffset.top + "px";
      }
      this.isMobile = window.innerWidth < 600;
    }
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