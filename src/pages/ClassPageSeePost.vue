<template>
  <div>
    <SeeExplanation v-if="originalPost" 
      :expl="originalPost"
      :hasTitle="true"/>
    <SeeExplanation v-for="expl in sortedExplanations" :key="expl.id"
      :expl="expl" 
    />
    <CreateExplanation 
      :postDbRef="postRef"
      :newExplanationDbRef="explanationsRef.doc()"
      :titleRequired="!originalPost" 
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
    unsubscribeListener: null
  }),
  computed: {
    sortedExplanations () {
      return this.explanations.sort((a, b) => (a.date < b.date) ? -1 : ((a.date > b.date) ? 1 : 0));
    }
  },
  async created () {
    const { class_id, post_id } = this.$route.params;
    this.postRef = db.doc(`classes/${class_id}/posts/${post_id}`);
    this.explanationsRef = this.postRef.collection("explanations");
    this.unsubscribeListener2 = await this.$_listenToDoc(this.postRef, this, "originalPost");
    this.unsubscribeListener = await this.$_listenToCollection(this.explanationsRef, this, "explanations");
  },
  beforeRouteUpdate (to, from, next) {
    this.confirmExit(next);
  },
  beforeRouteLeave (to, from, next) {
    this.confirmExit(next);
  },
  destroyed () { 
    if (this.unsubscribeListener) {
      this.unsubscribeListener(); 
    }
    if (this.unsubscribeListener2) {
      this.unsubscribeListener2();
    }
  },
  methods: {
    // TODO: check if there is text or strokes
    confirmExit (next) {
      const { CreateExplanation } = this.$refs;
      const Blackboard = CreateExplanation.getBlackboard();
      const TextEditor = CreateExplanation.getTextEditor();

      if (Blackboard.getStrokesArray().length > 0 || TextEditor.extractAllText().length > 0) {
        const wantToLeave = window.confirm("Do you really want to leave? You might have unsaved changes.");
        if (!wantToLeave) { next(false); }
        else { next(); }
      } else {
        next();
      }
    }
  }
}
</script>
