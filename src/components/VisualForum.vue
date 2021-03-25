<template>
  <div style="display: flex;">
    <div style="width: 260px;">
      <v-list style="max-height: 80vh" class="overflow-y-auto">
        <v-list-item 
          @click="$store.commit('SET_CURRENTLY_SELECTED_QUESTION_ID', 'EMAIL_SETTINGS')"
          :input-value="currentlySelectedQuestionID === 'EMAIL_SETTINGS'"
          active-class="orange"
        >
          <v-icon class="mr-2">mdi-settings</v-icon>Email settings
        </v-list-item>

        <v-list-item 
          @click="$store.commit('SET_CURRENTLY_SELECTED_QUESTION_ID', 'NEW_QUESTION')"
          :input-value="currentlySelectedQuestionID === 'NEW_QUESTION'"
          active-class="orange"
        > 
          <v-icon class="mr-2">mdi-plus</v-icon>New question
        </v-list-item>
        
        <template v-if="questions">
          <template v-for="question in questions">
            <v-list-item :key="question.id"
              @click="$store.commit('SET_CURRENTLY_SELECTED_QUESTION_ID', question.id);"
              :class="!question.hasReplies && question.id !== currentlySelectedQuestionID ? ['info'] : ''" three-line active-class="orange"
              :input-value="question.id === currentlySelectedQuestionID" 
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

            <v-divider :key="question.id + 'divider'"/>
          </template>
        </template>
      </v-list>
    </div>

    <div style="flex-grow: 1;">
      <template v-if="currentlySelectedQuestionID === 'EMAIL_SETTINGS'">
        <v-card>
          <v-card-title>Email Settings</v-card-title>
          <v-card-text>
            Get emailed whenever someone asks a question
            <v-switch 
              :input-value="user.emailOnNewQuestion.includes($route.params.class_id)" 
              @change="isEnabled => toggleEmailOnNewQuestion(isEnabled)"
            />
            Get emailed whenever someone replies to a question that you asked or replied to
            <v-switch 
              :input-value="user.emailOnNewReply.includes($route.params.class_id)" 
              @change="isEnabled => toggleEmailOnNewReply(isEnabled)"
            />
          </v-card-text>
        </v-card>
      </template>

      <template v-else-if="currentlySelectedQuestionID === 'NEW_QUESTION'">
        <!-- TODO: refactor this unintuitive prop -->
        <!-- misleadingly, post means it's not a reply, so it contains its own subcollection -->
        <!-- it's not to distinguish between a library post and a forum question, confusingly -->
        <ExplanationCreate 
          explType="post"
          @expl-upload-started="({ questionTitle, questionDescriptionHTML, questionID }) => sendEmailNotificationsToClass(questionTitle, questionDescriptionHTML, questionID, $route.params.class_id)"
        />
      </template>

      <template v-else>
        <!-- <div class="d-flex flex-column mb-6"> -->
        <!-- Won't work withClassPageSeeQuestion because it is coupled with the $route variables -->
        <!-- overflow-x hidden is a fix because blackboard is too large for the forum, and we don't want sidescrolling -->
        <div style="max-height: 80vh; overflow-x: hidden" class="overflow-y-auto">
          <ClassPageSeePost 
            :postID="currentlySelectedQuestionID"
            :key="currentlySelectedQuestionID"
          /> 
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import db from "@/database.js"; 
import firebase from "firebase/app";
import "firebase/firestore"; 
import "firebase/functions"; 
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js"; 
import ExplanationCreate from "@/components/ExplanationCreate.vue"; 
import ExplanationDisplay from "@/components/ExplanationDisplay.vue"; 
import ClassPageSeePost from "@/components/ClassPageSeePost.vue"; 
import ClassPageSeeQuestion from "@/pages/ClassPageSeeQuestion.vue"; 
import { mapState } from "vuex"; 
import { displayDate } from "@/helpers.js";

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
    ...mapState([
      "currentlySelectedQuestionID", // AF("") means no question selected as it cannot be an empty string
      "mitClass",
      "user"
    ])
  },
  data () {
    return {
      questions: null, // AF(questions) -> null means questions is not initialized, [] means no questions actually exist on the database
      unsubscribeQuestionsListener: null
    };
  },
  watch: {
    // simple way to ensure the increment count number never diverges
    async questions () {
      // count the number of unanswered questionsRef
      let numOfUnansweredQuestions = 0; 
      for (const q of this.questions) {
        if (! q.hasReplies) numOfUnansweredQuestions += 1; 
      }
      
      // sync them if they differ from the database
      // current behavior is that the number syncs for the client if he/she opens the popup
      // so divergence can only briefly appear if the forum is never opened
      if (numOfUnansweredQuestions !== this.mitClass.numOfUnansweredQuestions) {
        await db.doc(`classes/${this.$route.params.class_id}`).update({
          numOfUnansweredQuestions
        });
        // note mitClass is out of date because we want to minimize the use of listeners
        const mitClassCopy = { ...this.mitClass }; 
        mitClassCopy.numOfUnansweredQuestions = numOfUnansweredQuestions; 
        this.$store.commit("SET_CLASS", mitClassCopy); 
      }
    }
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
    this.unsubscribeQuestionsListener(); 
  },
  methods: {
    toggleEmailOnNewReply (isEnabled) { 
      const { class_id } = this.$route.params; 
      const ref = db.doc(`users/${this.user.uid}`); 
      if (isEnabled) {
        console.log("unioning");
        ref.update({
          emailOnNewReply: firebase.firestore.FieldValue.arrayUnion(class_id)
        }); 
      } 
      else {
        console.log("removing"); 
        ref.update({
          emailOnNewReply: firebase.firestore.FieldValue.arrayRemove(class_id)
        }); 
      }
    },
    toggleEmailOnNewQuestion (isEnabled) {
      const { class_id } = this.$route.params; 
      const ref = db.doc(`users/${this.user.uid}`);
      if (isEnabled) {
        ref.update({
          emailOnNewQuestion: firebase.firestore.FieldValue.arrayUnion(class_id)
        });
      } 
      else {
        ref.update({
          emailOnNewQuestion: firebase.firestore.FieldValue.arrayRemove(class_id)
        }); 
      }
    },
    async sendEmailNotificationsToClass (questionTitle, questionDescriptionHTML, questionID, classID) {
      const usersToEmail = await this.$_getCollection(db.collection("users").where("emailOnNewQuestion", "array-contains", classID));
      for (const user of usersToEmail) {
        console.log("emailing ", user.email);
        const sendEmailToPerson = firebase.functions().httpsCallable("sendEmailToPerson");
        sendEmailToPerson({ 
          emailOfPerson: user.email, 
          title: questionTitle, 
          contentHTML: `
            <p>${questionDescriptionHTML}</p>
            <br>
            <br>
            To view drawings, click <a href="https://explain.mit.edu/forum/${classID}/${questionID}">here</a>
          `,
        });
      }
    },
    getDate (date) {
      return displayDate(date); 
    }
  }
};
</script>