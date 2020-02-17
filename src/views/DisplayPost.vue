<template>
  <div>
    <TheAppBar/>
    <v-content>
      <v-card>
        <DisplayExplanation
          v-for="explanation in sortedExplanations"
          :explanation="explanation" :explanationsRef="explanationsRef" :key="explanation.id"
          @video-save="post => saveVideo(post)"
        />
        <v-btn
          @click="isCreatingExplanation = !isCreatingExplanation"
          block color="accent lighten-1" :outlined="isCreatingExplanation" x-large
        >
          {{ isCreatingExplanation? 'CANCEL' : 'ADD RESPONSE' }}
        </v-btn>
        <CreateExplanation
          v-if="isCreatingExplanation"
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

export default {
  components: {
    TheAppBar,
    CreateExplanation,
    DisplayExplanation
  },
  mixins: [DatabaseHelpersMixin],
  data: () => ({
    explanations: [],
    explanationsRef: null,
    isCreatingExplanation: false,
    unsubscribeListener: null
  }),
  computed: {
    sortedExplanations () {
      return this.explanations.sort((a, b) => (a.date < b.date) ? -1 : ((a.date > b.date) ? 1 : 0));
    }
  },
  async created () {
    const { class_id, post_id } = this.$route.params;
    this.explanationsRef = await this.$_getCollectionRef(`classes/${class_id}/posts/${post_id}/explanations`);
    this.unsubscribeListener = await this.$_dbMixin_listenToDocs(this.explanationsRef, this, "explanations");
  },
  destroyed () {
    this.unsubscribeListener();
  }
}
</script>
