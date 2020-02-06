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
          <template v-for="(question, index) in questions">
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

export default {
  props: {
    questions: Array,
    value: Number
  },
  computed: {
    user () { return this.$store.state.user; },
    questionsLen () { return this.questions.length; }
  },
  watch: {
    questionsLen: {
      handler: "sortQuestions",
      immediate: true
    }
  },
  methods: {
    getFullHeight () {
      // 48 is the height of the  navbar
      return window.innerHeight - 48 
    },
    handleClick () {
      if (this.user) this.$emit('question-create');
      // TODO: else show login popup
    },
    displayDate (date) {
      var d = new Date(date);
      return (d.getUTCMonth() + 1)  + '/' + d.getUTCDate() + '/' + d.getUTCFullYear()
    },
    sortQuestions () {
      this.questions.sort(function(a, b) {
      return (a.date < b.date) ? 1 : ((a.date > b.date) ? -1 : 0);
      });
    }
  }
}
</script>