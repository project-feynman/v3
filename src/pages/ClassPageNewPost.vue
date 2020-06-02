<template>
  <CreateExplanation 
    titleRequired
    :strokesArray="strokesArray"
    :willCreateNewPost="true"
    :postDbRef="newPostRef"
    :key="changeKeyToForceReset"
    @upload-started="changeKeyToForceReset += 1"
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
      strokesArray: [],
      changeKeyToForceReset: 0,
      newPostRef: null
    }
  },
  computed: {
    postsRef () {
      return db.collection(`classes/${this.$route.params.class_id}/posts`);
    }
  },
  watch: {
    changeKeyToForceReset: {
      handler: "resetExplanationComponent",
      immediate: true
    }
  },
  /**
   * Shows a confirmation popup if the user is leaving with unfinished work. 
   * 
   * @see https://router.vuejs.org/guide/advanced/navigation-guards.html#global-before-guards
   * 
   */
  beforeRouteLeave (to, from, next) {
    const TextEditor = this.$refs.CreateExplanation.getTextEditor();
    if (this.strokesArray.length > 0 || TextEditor.extractAllText().length > 0) {
      const wantToLeave = window.confirm("Do you really want to leave? You might have unsaved changes.");
      if (wantToLeave) next();
      else next(false); // Calling `next(false)` aborts the current navigation 
    } 
    else next(); 
  },
  methods: {
    // TODO: refactor the logic so that this method is unnecessary
    resetExplanationComponent () {
      this.strokesArray = []; // it's aliased to CreateExplanation's strokesArray so must be reset 
      this.newPostRef = this.postsRef.doc(getRandomId());
    }
  }
}
</script>