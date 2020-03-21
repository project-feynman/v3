<template>
  <div>
    <TheAppBar/>
    <v-content>
      <SeeExplanation v-if="originalPost" :expl="originalPost"/>
      <SeeExplanation v-for="expl in sortedExplanations" :key="expl.id"
        :expl="expl" 
      />
      <v-btn @click="isCreatingExpl = !isCreatingExpl" x-large block :outlined="isCreatingExpl" color="accent">
        {{ isCreatingExpl ? 'CANCEL' : 'ADD RESPONSE' }}
      </v-btn>
      <CreateExplanation v-if="isCreatingExpl" 
        :postDbRef="postRef"
        :newExplanationDbRef="explanationsRef.doc()" 
        :titleRequired="false"
        @upload-finish="isCreatingExpl = false"
      />
    </v-content>
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
    isCreatingExpl: false,
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
    this.unsubscribeListener(); 
    this.unsubscribeListener2();
  },
  methods: {
    confirmExit (next) {
      if (!this.isCreatingExpl) {
        next();
      } else {
        const wantToLeave = window.confirm("Do you really want to leave? You might have unsaved changes.");
        if (!wantToLeave) next(false);
        else next();
      }
    }
  }
}
</script>
