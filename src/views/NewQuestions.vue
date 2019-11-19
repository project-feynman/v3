<template>
  <div>
    <BaseAppBar/>
    <v-content>
      <v-container>
        <v-row dense>

          <!-- ASK A NEW QUESTION -->
          <v-col cols="12">
            <v-card
              color="#385F73"
              dark
            >
              <v-card-title class="headline">New Question</v-card-title>

              <!-- <v-card-subtitle> I don't quite understand Savitch's Theorem</v-card-subtitle> -->
              <v-card-text>
                <v-col cols="12" md="12">
                  <v-textarea
                    name="input-7-1"
                    label="Description"
                    placeholder="e.g. I still don't understand Savitch's Theorem"
                    v-model="newQuestion"
                    hint="Ask about a concept or a problem"
                  ></v-textarea>
                </v-col>
              </v-card-text>

              <v-card-actions>
                <v-btn color="white" block text @click="saveQuestion()">SUBMIT QUESTION</v-btn>
              </v-card-actions>
            </v-card>
          </v-col>

          <!-- EXISTING QUESTIONS -->
          <v-col v-for="(q, i) in questions" :key="i" cols="12">
            <v-card color="purple" dark>
              <div class="d-flex flex-no-wrap justify-space-between">
                <v-card-title class="headline" v-text="q.title"/>
                <v-card-text>
                  <p>{{ q.description }}</p>
                </v-card-text>
                <v-card-actions>
                  <v-btn @click="upvoteQuestion(q)" :disabled="!allowedToUpvote(q)" text>ME TOO {{ q.usersWhoUpvoted.length }}</v-btn>
                  <v-btn @click="deleteQuestion(q)" text >DELETE QUESTION</v-btn>
                </v-card-actions>
              </div>
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
import firebase from "firebase/app"
import "firebase/firestore"

export default {
  components: {
    BaseAppBar
  },
  data: () => ({
    questions: [],
    newQuestion: "",
    items: [
      {
        color: '#1F7087',
        src: 'https://cdn.vuetifyjs.com/images/cards/foster.jpg',
        title: 'Supermodel',
        artist: 'Foster the People',
      },
      {
        color: '#952175',
        src: 'https://cdn.vuetifyjs.com/images/cards/halcyon.png',
        title: 'Halcyon Days',
        artist: 'Ellie Goulding',
      },
    ],
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
    async saveQuestion () {
      const newQuestion = this.newQuestion
      this.newQuestion = "" 
      await this.questionsRef.add({
        description: newQuestion,
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
      this.fetchQuestions ()
    }
  }
}
</script>