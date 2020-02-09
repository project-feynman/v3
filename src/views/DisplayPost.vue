<template>
  <div>
    <TheAppBar/>
    <v-content>
      <v-card>      
        <template v-for="(explanation, i) in explanations">
          <DisplayExplanation 
            @video-save="post => saveVideo(post)"
            :key="explanation['.key']"
            :explanation="explanation" 
            :explanationsRef="explanationsRef"
          />
        </template>
        <CreateExplanation
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
    explanations: []
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