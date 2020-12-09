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
            @click="currentlySelectedQuestionID = question.id"
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
        <ExplanationCreate explType="post"/>
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
          I will be a component where, upon "created ()", will fetch the original question
          and all the replies. 

          However, while the database fetch is separate, I'll err on the side of keeping whatever structure we use to have. 
          We used to have a working product, so we can just keep that. 

          This component will refresh depending on the local state, so the currentQuestionID prop. Again, not ideal, but we're shipping 
          the minimum viable visual forum. Remember that. 
        </div>
      </template>
    </v-col>
  </v-row>
</template>

<script>
import db from "@/database.js"; 
import firebase from "firebase/app";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js"; 
import ExplanationCreate from "@/components/ExplanationCreate.vue"; 
import ExplanationDisplay from "@/components/ExplanationDisplay.vue"; 
import ClassPageSeePost from "@/components/ClassPageSeePost.vue"; 
import moment from "moment"

export default {
  mixins: [
    DatabaseHelpersMixin
  ],
  components: {
    ClassPageSeePost,
    ExplanationCreate,
    ExplanationDisplay
  },
  data () {
    return {
      isCreatingNewQuestion: false,
      currentlySelectedQuestionID: "", // AF("") means no question selected as it cannot be an empty string
      questions: null // AF(questions) -> null means questions is not initialized, [] means no questions actually exist on the database
    };
  },
  async created () {
    // fetch all the questions, sorted by time
    const classRef = db.doc(`classes/${this.$route.params.class_id}`); 
    const questionsRef = classRef.collection("questions").orderBy("date", "desc"); 
    this.questions = await this.$_getCollection(questionsRef); 
    console.log("questions =", this.questions);
  },
  destroyed () {
    this.isCreatingNewQuestion = false;
  },
  methods: {
    getDate (date) {
      const theDate = moment(date);
      return theDate.format('MMM D, YYYY');
    }
  }
};
</script>