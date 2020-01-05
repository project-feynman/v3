<template>
  <v-card class="ml-0">
    <v-list two-line>
      <v-list-item-group v-model="index" active-class="pink--text">
        <!-- NEW QUESTION -->
        <v-list-item @click="$emit('question-create')">
          <v-list-item-content>
            <v-list-item-title v-text="'New question'" />
            <v-list-item-subtitle class="text--primary" v-text="'Click here to add a new question'"></v-list-item-subtitle>
            <v-list-item-subtitle v-text="'Use text, image and drawings'"></v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <!-- EXISTING QUESTIONS -->
        <div v-if="questions && question != {}">
          <template v-for="(item, index) in questions">
            <v-list-item @click="$emit('question-click', item)" :key="item['.key']">
              <v-list-item-content>
                <v-list-item-title v-if="item.title" v-text="item.title"></v-list-item-title>
                <v-list-item-subtitle class="text--primary" v-text="item.description"></v-list-item-subtitle>
                <v-list-item-subtitle v-text="'January 6th'"></v-list-item-subtitle>
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
    questions: Array,
    question: Object
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