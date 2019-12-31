<template>
  <v-card
    max-width="250"
    class="ml-0"
  >
    <h1>Answers</h1>
    <v-list two-line class="overflow-y-auto" :style="`max-height: ${getFullHeight()}px`">
      <v-list-item-group
        v-model="index"
        active-class="pink--text"
      >
        <div v-if="answers">
          <template v-for="(item, index) in answers">
            <v-list-item :key="item['.key']">
              <v-list-item-content>
                <v-list-item-subtitle class="text--primary" v-text="item.description"></v-list-item-subtitle>
                <v-list-item-subtitle v-text="'January 6th'"></v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
            <v-divider v-if="index + 1 < answers.length" :key="index"></v-divider>
          </template>
        </div>
      </v-list-item-group>
    </v-list>
  </v-card>
</template>

<script>
import db from "@/database.js"

export default {
  props: {
    answers: Array,
  },
  data: () => ({
    index: 0 // gets filled up with Numbers e.g. [1, 2]
  }),
  methods: {
    getFullHeight () {
      // 48 is the height of the  navbar
      return window.innerHeight - 48 
    }
  }
}
</script>