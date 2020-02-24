<template>
  <!-- Identical to DisplayPost except it's immutable -->
  <div>
    <TheAppBar/>
    <v-content>
      <v-card>
        <DisplayExplanation v-for="expl in sortedExplanations" :expl="expl" :key="expl.id"/>
      </v-card>
    </v-content>
  </div>
</template>

<script>
import TheAppBar from "@/components/TheAppBar.vue";
import DisplayExplanation from "@/components/DisplayExplanation.vue";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import { tutorial } from "@/CONSTANTS.js";
import db from "@/database.js";

export default {
  mixins: [DatabaseHelpersMixin],
  components: { TheAppBar, DisplayExplanation },
  data: () => ({
    explanations: [],
    explanationsRef: null,
    unsubscribeListener: null
  }),
  computed: {
    sortedExplanations () {
      return this.explanations.sort((a, b) => (a.date < b.date) ? -1 : ((a.date > b.date) ? 1 : 0));
    }
  },
  async created () {
    this.postRef = db.doc(`classes/${tutorial.classId}/posts/${tutorial.postId}`);
    this.explanationsRef = this.postRef.collection("explanations");
    this.unsubscribeListener = await this.$_listenToCollection(this.explanationsRef, this, "explanations");
  },
  destroyed () { this.unsubscribeListener(); }
}
</script>
