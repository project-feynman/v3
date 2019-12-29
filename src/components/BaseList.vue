<template>
  <v-card
    max-width="300"
    class="ml-0"
  >
    <v-list two-line class="overflow-y-auto" :style="`max-height: ${getFullHeight()}px`">
      <v-list-item-group
        v-model="selected"
        multiple
        active-class="pink--text"
      >
        <v-list-item>
            <v-list-item-content>
                <v-list-item-title v-text="'New question'"/>
                <v-list-item-subtitle class="text--primary" v-text="'Click here to add a new question'"></v-list-item-subtitle>
                <v-list-item-subtitle v-text="'Use text, image and drawings'"></v-list-item-subtitle>
            </v-list-item-content>
        </v-list-item>

        <div v-if="questions">
            <template v-for="(item, index) in questions">
            <v-list-item @click="$emit('question-click', index)" :key="item.title">
                <template v-slot:default="{ active, toggle }">
                <v-list-item-content>
                    <v-list-item-title v-if="item.title" v-text="item.title"></v-list-item-title>
                    <v-list-item-subtitle class="text--primary" v-text="item.text || item.description"></v-list-item-subtitle>
                    <v-list-item-subtitle v-text="'January 6th'"></v-list-item-subtitle>
                </v-list-item-content>
                </template>
            </v-list-item>
            <v-divider
                v-if="index + 1 < questions.length"
                :key="index"
            ></v-divider>
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
        questions: Array
    },
    methods: {
        getFullHeight () {
            // 48 is the height of the  navbar
            console.log("final result =", window.innerHeight - 48)
            return window.innerHeight - 48 
        }
    },
    async created () {
        console.log(this.questions)
    },
    /*async created () {
        const classID = this.$route.params.class_id 
        const ref = db.collection("classes").doc(classID).collection("questions")
        const questionDocs = await ref.get()
        questionDocs.forEach(doc => {
            this.questions.push({".key": doc.id, ...doc.data()})
        })
    },*/
    data: () => ({
        selected: [2]
    }),
}
</script>