<template>
  <div>
    <TheAppBar/>
    <v-content>
      <CreateExplanation 
        :newPostDbRef="newPostRef"
        :newExplanationDbRef="newExplanationRef"
        :newDocId="id"
      />
    </v-content>
  </div>
</template>

<script>
import TheAppBar from "@/components/TheAppBar.vue";
import CreateExplanation from "@/components/CreateExplanation.vue";
import db from "@/database.js";

export default {
  components: {
    TheAppBar,
    CreateExplanation
  },
  data () {
    return {
      id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) 
    }
  },
  computed: {
    classId () { return this.$route.params.class_id; },
    classRef () { return db.collection("classes").doc(this.classId); },
    postsRef () { return this.classRef.collection("posts"); },
    newPostRef () { return this.postsRef.doc(this.id); },
    newExplanationRef () {
      // Both newPost and newExplanation share the same newDocId for easy reference
      return this.newPostRef.collection("explanations").doc(this.id);
    }
  }
}
</script>