<template>
  <v-card max-width="250" class="ml-0">
    <v-list two-line class="overflow-y-auto" :style="`max-height: ${getFullHeight()}px`">
      <v-list-item-group v-model="index" active-class="pink--text">
        <!-- NEW QUESTION -->
        <v-list-item @click="$emit('question-create')">
          <v-list-item-content>
            <v-list-item-title v-text="'New question'" color="secondary" class="purple--text"/>
            <v-list-item-subtitle class="purple--text" v-text="'Click here to add a new question'"></v-list-item-subtitle>
            <!-- <v-list-item-subtitle v-text="'Use text, image and drawings'"></v-list-item-subtitle> -->
          </v-list-item-content>
        </v-list-item>
        <v-divider/>

        <!-- EXISTING QUESTIONS -->
        <div v-if="questions">
          <template v-for="(question, index) in questions">
            <v-list-item @click="$emit('question-click', question)" :key="question['.key']">
              <v-list-item-content>
                <!-- <v-list-item-title v-if="question.title" v-text="question.title"/> -->
                <v-list-item-subtitle class="text--primary" v-text="question.description"/>
                <v-list-item-subtitle v-text="question.date"/>
              </v-list-item-content>
            </v-list-item>
            <v-divider v-if="index + 1 < questions.length" :key="index"></v-divider>
          </template>
        </div>
      </v-list-item-group>
    </v-list>
  </v-card>
</template>

<script>
import db from "@/database.js";

export default {
  props: {
    questions: Array
  },
  data: () => ({
    index: 0 // gets filled up with Numbers e.g. [1, 2]
  }),
  methods: {
    getFullHeight() {
      // 48 is the height of the  navbar
      return window.innerHeight - 48;
    }
  }
};
</script>