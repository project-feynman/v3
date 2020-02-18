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
          :postDbRef="postRef"
          :newExplanationDbRef="explanationsRef.doc()"
          @upload-finish="isCreatingExplanation = false"
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
  mixins: [DatabaseHelpersMixin],
  components: {
    TheAppBar,
    CreateExplanation,
    DisplayExplanation
  },
  data: () => ({
    explanations: [],
    explanationsRef: null,
    postRef: null,
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
    this.postRef = await this.$_getDocRef(`classes/${class_id}/posts/${post_id}`);
    this.explanationsRef = this.postRef.collection("explanations");
    this.unsubscribeListener = await this.$_dbMixin_listenToDocs(this.explanationsRef, this, "explanations");
  },
  destroyed () {
    this.unsubscribeListener();
  }
}
</script>
