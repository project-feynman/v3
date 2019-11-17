<template>
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

        <v-col v-for="(item, i) in questions" :key="i" cols="12">
          <v-card color="purple" dark>
            <div class="d-flex flex-no-wrap justify-space-between">
              <div>
                <v-card-title class="headline" v-text="item.title"/>
                <!-- <v-card-subtitle v-text="item.artist"></v-card-subtitle> -->
              </div>
                
              <v-card-text>
                <h1>{{ item.description }}</h1>
              </v-card-text>
              

              <!-- <v-avatar class="ma-3" size="125" tile>
                <v-img :src="item.src"></v-img>
              </v-avatar> -->
            </div>
          </v-card>

        </v-col>
      </v-row>
    </v-container>
  </v-content>
</template>

<script>
import db from "@/database.js"

export default {
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
  async created () {
    this.fetchQuestions()
  },
  methods: {
    async fetchQuestions () {
      this.questions = [] 
      const classID = this.$route.params.class_id 
      const ref = db.collection("classes").doc(classID).collection("questions")
      let questionDocs = await ref.get() 
      questionDocs.forEach(doc => {
        this.questions.push({".key": doc.id, ...doc.data()})
      })
      console.log("this.questions =", this.questions)
    },
    async saveQuestion () {
      const classID = this.$route.params.class_id 
      const ref = db.collection("classes").doc(classID).collection("questions")
      const newQuestion = this.newQuestion
      this.newQuestion = "" 
      await ref.add({
        description: newQuestion
      })
      this.fetchQuestions()
    }
  }
}
</script>