<template>
  <CreateExplanation 
    titleRequired
    :willCreateNewPost="true"
    :postDbRef="newPostRef"
    :key="updateKeyToResetComponent"
    @upload-finish="updateKeyToResetComponent += 1"
    ref="CreateExplanation"
  />
</template>

<script>
import CreateExplanation from "@/components/CreateExplanation.vue";
import db from "@/database.js";
import { getRandomId } from "@/helpers.js";

export default {
  components: { 
    CreateExplanation,
  },
  data () {
    return {
      updateKeyToResetComponent: 0,
      newPostRef: null
    }
  },
  computed: {
    postsRef () {
      return db.collection(`classes/${this.$route.params.class_id}/posts`);
    }
  },
  watch: {
    updateKeyToResetComponent: {
      handler: "resetExplanationComponent",
      immediate: true
    }
  },
  beforeRouteLeave (to, from, next) {
    const Blackboard = this.$refs.CreateExplanation.getBlackboard();
    const TextEditor = this.$refs.CreateExplanation.getTextEditor();
    if (Blackboard.getStrokesArray().length > 0 || TextEditor.extractAllText().length > 0) {
      const wantToLeave = window.confirm("Do you really want to leave? You might have unsaved changes.");
      if (wantToLeave) next();
      else next(false); 
    } 
    else next(); 
  },
  methods: {
    resetExplanationComponent () {
      this.newPostRef = this.postsRef.doc(getRandomId());
    }
  }
}
</script>