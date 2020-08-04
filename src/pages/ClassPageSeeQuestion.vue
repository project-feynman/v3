<template>
  <div>
    <ExplanationDisplay v-if="originalPost" 
      :expl="originalPost"
      hasTitle
    />
    <ExplanationDisplay v-for="expl in sortedExplanations" :key="expl.id"
      :expl="expl" 
    />
    <!-- Need to be logged-in to reply to existing posts -->
    <ExplanationCreate v-if="user" explType="reply"/>
  </div>
</template>

<script>
import ExplanationCreate from "@/components/ExplanationCreate.vue";
import ExplanationDisplay from "@/components/ExplanationDisplay.vue";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import db from "@/database.js";
import { mapState } from "vuex";

export default {
  mixins: [
    DatabaseHelpersMixin
  ],
  components: { 
    ExplanationCreate, 
    ExplanationDisplay,
  },
  data: () => ({
    strokesArray: [],
    html: "",
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
    const { class_id, question_id } = this.$route.params;
    this.postRef = db.doc(`classes/${class_id}/questions/${question_id}`);
    this.explanationsRef = this.postRef.collection("explanations");

    this.$_listenToDoc(this.postRef, this, "originalPost").then(listener => {
      this.databaseListeners.push(listener);
    });
    this.$_listenToCollection(this.explanationsRef, this, "explanations").then(listener => {
      this.databaseListeners.push(listener);
    });
  },
  destroyed () { 
    for (const unsubscribeListener of this.databaseListeners) {
      unsubscribeListener();
    }
  },
  methods: {
    confirmExit (next) {
      if (this.strokesArray.length > 0 || this.html.length > 0) {
        const wantToLeave = window.confirm("Do you really want to leave? You might have unsaved changes.");
        if (!wantToLeave) next(false);
        else next();
      } 
      else next(); 
    }
  }
}
</script>
