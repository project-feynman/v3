<template>
  <div>
    <TheAppBar/>
    <v-content>
      <v-card>      
        <template v-for="explanation in explanations">
          <DisplayExplanation 
            :key="explanation['.key']"
            :explanation="explanation" 
            :explanationsRef="explanationsRef"
            @video-save="post => saveVideo(post)"
          />
        </template>
        <v-btn 
          v-if="!isCreatingExplanation"
          @click="isCreatingExplanation = true" block color="accent lighten-1" x-large
        >
          Add response
        </v-btn>
        <v-btn 
          v-else
          @click="isCreatingExplanation = false" block color="accent lighten-1" outlined x-large
        >
          Cancel
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
    user () { 
      return this.$store.state.user;
    },
    classId () {
      return this.$route.params.class_id;
    },
    postId () {
      return this.$route.params.post_id;
    },
    classRef () {
      return db.collection("classes").doc(this.classId);
    },
    postRef () {
      return this.classRef.collection("posts").doc(this.postId);
    },
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
      // onSnapshot does NOT return a promise
      this.explanationsRef.onSnapshot(querySnapshot => {
        const explanations = []; // want to update this.replies at once to not confuse Vue with multiple updates
        querySnapshot.forEach(doc => explanations.push({...doc.data(), ".key": doc.id }));
        // console.log("Current replies ", explanations.join(", "));
        this.explanations = explanations; 
      });
    }
  }
}
</script>