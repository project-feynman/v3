<template>
  <!-- TODO: 
    - Display question in red   
    - Show unanswered questions
    - Fix styling
   -->
  <v-row>
    <!-- By default, the sidedrawer and videos each take up 5 columns -->
    <!-- But if it's a medium / larger screen, we can afford fewer columns for the side-drawer -->
    <v-col cols="6" sm="3">
      <!-- Within the SideDrawer itself, it's a vertical flex -->
      <v-list style="max-height: 80vh" three-line class="overflow-y-auto">
        <!-- The best initial guess is usually to copy what the incumbents do -->
        <v-list-item @click="isCreatingNewQuestion = true"> 
          <v-icon>mdi-plus</v-icon>New question
        </v-list-item>
        
        <template v-if="questions">
          <v-list-item v-for="question in questions" :key="question.id"
            @click="$store.commit('SET_CURRENTLY_SELECTED_QUESTION_ID', question.id); isCreatingNewQuestion = false;"
            :class="question.hasReplies ? '' : ['red']"
          >
            <v-list-item-content :class="question.hasReplies ? '' : 'white--text'">
              <v-list-item-title>
                {{ question.title }}
              </v-list-item-title> 
              <v-list-item-subtitle v-html="question.html" :class="question.hasReplies ? '' : 'white--text'"/>
              <v-list-item-subtitle :class="question.hasReplies ? '' : 'white--text'">
                {{ getDate(question.date) }}
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </template>
      </v-list>
    </v-col>

    <v-col cols="6" sm="9">
      <template v-if="isCreatingNewQuestion">
        <!-- TODO: refactor this unintuitive prop -->
        <!-- misleadingly, post means it's not a reply, so it contains its own subcollection -->
        <!-- it's not to distinguish between a library post and a forum question, confusingly -->
        <ExplanationCreate 
          explType="post"
          @expl-upload-started="({ questionTitle, questionID }) => sendEmailNotificationsToClass(questionTitle, questionID, $route.params.class_id)"
        />
      </template>

      <template v-else-if="currentlySelectedQuestionID">
        <!-- Within the list of videos, it's also a vertical flex -->
        <!-- You need to use the ClassPageSeePost component -->
        <!-- Optimize for change and pivots -->
        <div class="d-flex flex-column mb-6">
          <ClassPageSeePost 
            :postID="currentlySelectedQuestionID"
            :key="currentlySelectedQuestionID"
          /> 
          <!-- Won't work yet because this component is coupled with the $route variables -->
          <!-- <ClassPageSeeQuestion
            :postID="currentlySelectedQuestionID"
            :key="currentlySelectedQuestionID"
          /> -->
        </div>
      </template>
    </v-col>
  </v-row>
</template>

<script>
import db from "@/database.js"; 
import firebase from "firebase/app";
import "firebase/functions"; 
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js"; 
import ExplanationCreate from "@/components/ExplanationCreate.vue"; 
import ExplanationDisplay from "@/components/ExplanationDisplay.vue"; 
import ClassPageSeePost from "@/components/ClassPageSeePost.vue"; 
import ClassPageSeeQuestion from "@/pages/ClassPageSeeQuestion.vue"; 
import moment from "moment"

export default {
  mixins: [
    DatabaseHelpersMixin
  ],
  components: {
    ClassPageSeePost,
    ClassPageSeeQuestion,
    ExplanationCreate,
    ExplanationDisplay
  },
  computed: {
    currentlySelectedQuestionID () {
      return this.$store.state.currentlySelectedQuestionID; 
    }
  },
  data () {
    return {
      isCreatingNewQuestion: false,
      // TODO: make this global
      // currentlySelectedQuestionID: "", // AF("") means no question selected as it cannot be an empty string
      questions: null, // AF(questions) -> null means questions is not initialized, [] means no questions actually exist on the database
      unsubscribeQuestionsListener: null
    };
  },
  async created () {
    // it's better if the forum is semi-realtime, but ensure that you do destroy the listener 
    const classRef = db.doc(`classes/${this.$route.params.class_id}`); 
    const questionsRef = classRef.collection("questions").orderBy("date", "desc"); 

    this.unsubscribeQuestionsListener = this.$_bindVarToDB({
      varName: "questions",
      dbRef: questionsRef,
      component: this
    });
    // eventually incorporate the previous code for only fetching questions by week, but there are only two weeks remaining...
  },
  destroyed () {
    this.isCreatingNewQuestion = false;
    this.unsubscribeQuestionsListener(); 
    console.log("succesfully unsubscribed the questions listener");
  },
  methods: {
    sendEmailNotificationsToClass (questionTitle, questionID, classID) {
      console.log("questionTitle =", questionTitle);
      console.log("questionID =", questionID); 
      console.log("classID =", classID); 
      const sendEmailToPerson = firebase.functions().httpsCallable("sendEmailToPerson");
      sendEmailToPerson({ 
        title: questionTitle, 
        contentHTML: `To view question, click <a href="https://explain.mit.edu/forum/${classID}/${questionID}">here</a>`,
        emailOfPerson: "eltonlin@mit.edu" // will change to be dynamic from a for loop
      });
    },
    getDate (date) {
      const theDate = moment(date);
      return theDate.format('MMM D, YYYY');
    }
  }
};
</script>