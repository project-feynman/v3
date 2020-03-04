<template>
  <div>
    <TheAppBar/>
    <v-content>
      <v-card>
        <DisplayExplanation v-for="expl in sortedExplanations" 
          :expl="expl" :key="expl.id"
        />
        <v-btn @click="isCreatingExpl = !isCreatingExpl" x-large block :outlined="isCreatingExpl" color="accent lighten-1">
          {{ isCreatingExpl? 'CANCEL' : 'ADD RESPONSE' }}
        </v-btn>
        <CreateExplanation v-if="isCreatingExpl" 
          @upload-finish="isCreatingExpl = false"
          :postDbRef="postRef"
          :newExplanationDbRef="explanationsRef.doc()" 
        />
      </v-card>
    </v-content>
  </div>
</template>

<script>
import TheAppBar from "@/components/TheAppBar.vue";
import CreateExplanation from "@/components/CreateExplanation.vue";
import DisplayExplanation from "@/components/DisplayExplanation.vue";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import db from "@/database.js";

export default {
  mixins: [DatabaseHelpersMixin],
  components: { TheAppBar, CreateExplanation, DisplayExplanation },
  data: () => ({
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
    this.unsubscribeListener = await this.$_listenToCollection(this.explanationsRef, this, "explanations");
  },
  destroyed () { this.unsubscribeListener(); }
}
</script>
