<template>
  <div>
    <ExplanationDisplay v-if="originalPost" 
      :expl="originalPost"
      hasTitle
    />
    <ExplanationDisplay v-for="expl in sortedExplanations" 
      :expl="expl" 
      :key="expl.id"
    />
    <!-- TODO: rename, question, reply, posts -->
    <!-- Note the props are specifically for :questionID -->
    <ExplanationCreate v-if="isViewingForum" 
      :questionID="postID"
      explType="reply"
      class="mt-5"
    />
  </div>
</template>

<script>
import ExplanationCreate from "@/components/ExplanationCreate.vue";
import ExplanationDisplay from "@/components/ExplanationDisplay.vue";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import db from "@/database.js";
import { mapState } from "vuex";

export default {
  props: {
    postID: {
      type: String,
      required: true
    }
  },
  mixins: [
    DatabaseHelpersMixin
  ],
  components: { 
    ExplanationCreate, 
    ExplanationDisplay,
  },
  data: () => ({
    originalPost: null,
    explanations: [],
    explanationsRef: null,
    postRef: null,
    databaseListeners: [],
  }),
  computed: {
    ...mapState([
      "user",
      "isViewingForum",
      "isViewingLibrary"
    ]),
    sortedExplanations () {
      return this.explanations.sort((a, b) => (a.date < b.date) ? -1 : ((a.date > b.date) ? 1 : 0));
    }
  },
  async created () {
    // Decouple the component from the route: const type = this.$route.query.type === 'question' ? 'questions' : 'posts';
    // TODO: unify, the naming is super inconsistent "replies" for posts vs "explanations" for questions
    const { class_id } = this.$route.params;
    if (this.isViewingForum) {
      this.postRef = db.doc(`classes/${class_id}/questions/${this.postID}`);
      this.explanationsRef = this.postRef.collection("explanations");
    } 
    else if (this.isViewingLibrary) {
      this.postRef = db.doc(`classes/${class_id}/posts/${this.postID}`);
      this.explanationsRef = this.postRef.collection("replies");
    }
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
  }
}
</script>
