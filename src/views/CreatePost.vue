<template>
  <div>
    <TheAppBar/>
    <v-content>
      <CreateExplanation 
        :willCreateNewPost="true"
        :postDbRef="newPostRef"
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
  components: { TheAppBar, CreateExplanation },
  data () {
    return {
      id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) 
    }
  },
  computed: {
    postsRef () {
      const { class_id } = this.$route.params;
      return db.collection(`classes/${class_id}/posts`);
    },
    // Both newPost and newExplanation share the same newDocId for easy reference
    newPostRef () { return this.postsRef.doc(this.id); },
    newExplanationRef () { 
      return this.newPostRef.collection("explanations").doc(this.id);
    }
  }
}
</script>