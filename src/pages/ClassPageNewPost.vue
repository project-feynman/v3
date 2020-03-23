<template>
  <div>
    <TheAppBar/>
    <v-content>
      <BetaCreateExplanation 
        :willCreateNewPost="true"
        :postDbRef="newPostRef"
        ref="CreateExplanation"
      />
    </v-content>
  </div>
</template>

<script>
import TheAppBar from "@/components/TheAppBar.vue";
import BetaCreateExplanation from "@/components/BetaCreateExplanation.vue";
import db from "@/database.js";
import { getRandomId } from "@/helpers.js";

export default {
  components: { 
    TheAppBar, 
    BetaCreateExplanation,
  },
  computed: {
    postsRef () {
      return db.collection(`classes/${this.$route.params.class_id}/posts`);
    },
    newPostRef () { 
      return this.postsRef.doc(getRandomId()); 
    }
  },
  beforeRouteLeave (to, from, next) {
    const Blackboard = this.$refs.CreateExplanation.getBlackboard();
    const TextEditor = this.$refs.CreateExplanation.getTextEditor();
    if (Blackboard.getStrokesArray().length > 0 || TextEditor.extractAllText().length > 0) {
      const wantToLeave = window.confirm("Do you really want to leave? You might have unsaved changes.");
      if (wantToLeave) next();
      else next(false);
    } else {
      next();
    }
  }
}
</script>