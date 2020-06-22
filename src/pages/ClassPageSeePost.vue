<template>
  <div>
    <SeeExplanation v-if="originalPost" 
      :expl="originalPost"
      hasTitle
    />
    <SeeExplanation v-for="expl in sortedExplanations" :key="expl.id"
      :expl="expl" 
    />
    <!-- Need to be logged-in to reply to existing posts -->
    <CreateExplanation v-if="user" 
      :postDbRef="postRef" 
      :newExplanationDbRef="explanationsRef" 
      :key="changeKeyToForceReset"
      @upload-started="changeKeyToForceReset += 1"
      ref="CreateExplanation"
    />
  </div>
</template>

<script>
import TheAppBar from "@/components/TheAppBar.vue";
import CreateExplanation from "@/components/CreateExplanation.vue";
import SeeExplanation from "@/components/SeeExplanation.vue";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import db from "@/database.js";
import { mapState } from "vuex";

export default {
  mixins: [
    DatabaseHelpersMixin
  ],
  components: { 
    TheAppBar, 
    CreateExplanation, 
    SeeExplanation,
  },
  data: () => ({
    originalPost: null,
    explanations: [],
    explanationsRef: null,
    postRef: null,
    databaseListeners: [],
    changeKeyToForceReset: 0
  }),
  computed: {
    ...mapState([
      "user"
    ]),
    sortedExplanations () {
      return this.explanations.sort((a, b) => (a.date < b.date) ? -1 : ((a.date > b.date) ? 1 : 0));
    }
  },
  async created () {
    const { class_id, post_id } = this.$route.params;
    this.postRef = db.doc(`classes/${class_id}/posts/${post_id}`);
    this.explanationsRef = this.postRef.collection("explanations");

    this.$_listenToDoc(this.postRef, this, "originalPost").then(listener => {
      this.databaseListeners.push(listener);
    });
    this.$_listenToCollection(this.explanationsRef, this, "explanations").then(listener => {
      this.databaseListeners.push(listener);
    });
  },
  beforeRouteUpdate (to, from, next) {
    this.confirmExit(next);
  },
  beforeRouteLeave (to, from, next) {
    this.confirmExit(next);
  },
  destroyed () { 
    for (const unsubscribeListener of this.databaseListeners) {
      unsubscribeListener();
    }
  },
  methods: {
    confirmExit (next) {
      const { CreateExplanation } = this.$refs;
      if (!CreateExplanation) {
        next();
        return;
      }
      const Blackboard = CreateExplanation.getBlackboard(); 
      const TextEditor = CreateExplanation.getTextEditor();

      if (Blackboard.getStrokesArray().length > 0 || TextEditor.extractAllText().length > 0) {
        const wantToLeave = window.confirm("Do you really want to leave? You might have unsaved changes.");
        if (!wantToLeave) next(false);
        else next(); 
      } 
      else next(); 
    }
  }
}
</script>
