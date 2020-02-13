<template>
  <div>
    <TheAppBar/>
    <v-content>
      <v-card>
        <DisplayExplanation
          v-for="explanation in explanations"
          :explanation="explanation" :explanationsRef="explanationsRef" :key="explanation.id"
          @video-save="post => saveVideo(post)"
        />
        <v-btn
          @click="isCreatingExplanation = !isCreatingExplanation"
          block color="accent lighten-1" :outlined="isCreatingExplanation" x-large
        >
          {{ isCreatingExplanation? 'CANCEL' : 'ADD RESPONSE' }}
        </v-btn>
        <CreateExplanation
          v-if="isCreatingExplanation"
          :newExplanationDbRef="explanationsRef.doc()"
        />
      </v-card>
    </v-content>
  </div>
</template>

<script>
import db from "@/database.js";
import TheAppBar from "@/components/TheAppBar.vue";
import CreateExplanation from "@/components/CreateExplanation.vue";
import DisplayExplanation from "@/components/DisplayExplanation.vue";
import firebase from "firebase/app";
import "firebase/firestore";
import helpers from "@/helpers.js";

export default {
  components: {
    TheAppBar,
    CreateExplanation,
    DisplayExplanation
  },
  data: () => ({
    explanations: [],
    isCreatingExplanation: false
  }),
  computed: {
    user () { return this.$store.state.user; },
    classId () { return this.$route.params.class_id; },
    postId () { return this.$route.params.post_id; },
    classRef () { return db.collection("classes").doc(this.classId); },
    postRef () { return this.classRef.collection("posts").doc(this.postId); },
    explanationsRef () { 
      return this.postRef.collection("explanations"); 
    }
  },
  watch: {
    postId: {
      handler: "syncExplanationsWithDb",
      immediate: true
    }
  },
  methods: {
    syncExplanationsWithDb () {
      this.explanationsRef.onSnapshot(querySnapshot => { // onSnapshot does NOT return a promise
        const explanations = []; // want to update this.replies at once to not confuse Vue with multiple updates
        querySnapshot.forEach(doc => explanations.push({...doc.data(), "id": doc.id }));
        this.explanations = explanations;
      });
    }
  }
}
</script>
