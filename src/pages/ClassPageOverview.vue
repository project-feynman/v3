<template>
  <div>
    <TheAppBar/>
    <v-content>
      <v-card>
        <v-card-title>Classmates</v-card-title>
        <v-card-text>
          <p v-for="classmate in classmates" :key="classmate.id">
            {{ `${classmate.firstName} ${classmate.lastName}` }}: {{ classmate.lastName === "Strang" ? "professor" : "student" }}
          </p>
        </v-card-text>
      </v-card>
      <DisplayExplanation v-for="expl in sortedExplanations" :key="expl.id"
        :expl="expl"
      />
    </v-content>
  </div>
</template>

<script>
import TheAppBar from "@/components/TheAppBar.vue";
import DisplayExplanation from "@/components/DisplayExplanation.vue";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import { tutorial, NotifFrequency } from "@/CONSTANTS.js";
import db from "@/database.js";

export default {
  mixins: [DatabaseHelpersMixin],
  components: { TheAppBar, DisplayExplanation },
  data: () => ({
    explanations: [],
    explanationsRef: null,
    unsubscribeListener: null,
    classmates: []
  }),
  computed: {
    sortedExplanations () {
      return this.explanations.sort((a, b) => (a.date < b.date) ? -1 : ((a.date > b.date) ? 1 : 0));
    },
    mitClass () {
      return this.$store.state.mitClass;
    }
  },
  async created () {
    this.postRef = db.doc(`classes/${tutorial.classId}/posts/${tutorial.postId}`);
    this.explanationsRef = this.postRef.collection("explanations");
    this.unsubscribeListener = await this.$_listenToCollection(this.explanationsRef, this, "explanations");
    const classmatesQuery = db.collection("users").where("enrolledClasses", "array-contains", {
      id: this.mitClass.id,
      name: this.mitClass.name,
      notifFrequency: NotifFrequency.ALWAYS
    });
    this.classmates = await this.$_getCollection(classmatesQuery);
  },
  destroyed () { 
    this.unsubscribeListener(); 
  }
}
</script>
