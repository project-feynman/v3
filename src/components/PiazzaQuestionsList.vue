<template>
  <v-card style="height:100%;">
    <v-list two-line>
      <v-list-item-group :value="value" @input="newVal => $emit('input', newVal)" active-class="pink--text">
        <!-- NEW QUESTION -->
        <v-list-item @click="handleClick()">
          <v-list-item-content>
            <v-list-item-title v-text="'New question'" color="secondary" class="purple--text"/>
            <v-list-item-subtitle v-if="user" class="purple--text" v-text="'Click here to add a new question'"></v-list-item-subtitle>
            <v-list-item-subtitle v-else class="purple--text" v-text="'Log in to ask a new question'"></v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
        <v-divider/>

        <!-- EXISTING QUESTIONS -->
        <div v-if="questions">
          <template v-for="(question, index) in sortedQuestions">
            <!-- QUICKFIX FOR INCOMPATIBLE API to not display duplicate questions -->
            <template v-if="question.title"> 
              <v-list-item @click="$emit('question-click', question)" :key="question['.key']">
                <v-list-item-content>
                  <v-list-item-subtitle class="text--primary" v-text="question.title"/>
                  <v-list-item-subtitle v-text="displayDate(question.date)"/>
                </v-list-item-content>
              </v-list-item>
              <v-divider v-if="index + 1 < questions.length" :key="index"></v-divider>
            </template>
          </template>
        </div>
      </v-list-item-group>
    </v-list>
  </v-card>
</template>

<script>
import moment from "moment";

export default {
  props: {
    questions: Array,
    value: Number
  },
  computed: {
    user () { return this.$store.state.user; },
    sortedQuestions () {
      return this.questions.sort((a, b) => (a.date < b.date) ? 1 : ((a.date > b.date) ? -1 : 0))
    }
  },
  methods: {
    handleClick () {
      if (this.user) this.$emit('question-create');
      // TODO: else show login popup
    },
    displayDate (date) {
      return moment(date).format('MMM Do, h:mm a');
    }
  }
}
</script>