<template>
  <div>
    <BaseAppBar/>
    <v-content>
      <div class="d-flex">
        <!-- THE BASELIST UPDATES THE CURRENT QUESTION BEING VIEWED (e.g. by emitting the questionID when a question is clicked) -->
        <BaseList @question-click="questionID => this.currentQuestionID = questionID"/>
        <h1>{{ currentQuestionID }}</h1>
        <v-card :width="getFullWidth()">
          <v-col cols="12" class="pb-0">
            <v-textarea
              outlined
              name="input-7-4"
              label="Question"
              v-model="newQuestion"
            ></v-textarea>
          </v-col>
          <v-row>
            <v-col cols="6" class="pt-0">
              <v-img
                src="https://picsum.photos/id/11/500/300"
                lazy-src="https://picsum.photos/id/11/10/6"
                aspect-ratio="1"
                class="grey lighten-2"
                max-width="500"
                max-height="300"
              ></v-img>
            </v-col>
            <v-col cols="6" class="pt-0">
              <RenderlessFetchStrokes whiteboardID="3u9102vnYb01zaOTYYbB">
                <template slot-scope="{ strokes }">
                  <DoodleVideo 
                    v-if="strokes"
                    :strokes="strokes"
                    canvasID="2"
                    @animation-loaded="hasFetchedVideos = true"
                  />
                </template>
              </RenderlessFetchStrokes>
            </v-col>
          </v-row>
          <v-btn @click="submitQuestion()" block color="secondary" dark>Submit question</v-btn>
        </v-card>
      </div>
    </v-content>
  </div>
</template>

<script>
import db from "@/database.js"
import BaseAppBar from "@/components/BaseAppBar.vue"
import BaseList from "@/components/BaseList.vue"
import DoodleVideo from "@/components/DoodleVideo.vue"
import RenderlessFetchStrokes from "@/components/RenderlessFetchStrokes.vue"
import firebase from "firebase/app"

import "firebase/firestore"

export default {
  components: {
    BaseAppBar,
    BaseList,
    DoodleVideo,
    RenderlessFetchStrokes
  },
  data: () => ({
    currentQuestionID: "",
    questions: [],
    newQuestion: "In the fundamental equation for quantum computation, it states that X = Y, yet I have reasons to think that X = Z (see below image and video). Where did I go wrong?"
  }),
  computed: {
    user () {
      return this.$store.state.user
    },
    questionsRef () {
      const classID = this.$route.params.class_id 
      return db.collection("classes").doc(classID).collection("questions")
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
    async submitQuestion () {
      const newQuestion = this.newQuestion
      this.newQuestion = "" 
      await this.questionsRef.add({
        text: newQuestion,
        image: "",
        videoID: "3u9102vnYb01zaOTYYbB",
        usersWhoUpvoted: []
      })
      this.fetchQuestions()
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