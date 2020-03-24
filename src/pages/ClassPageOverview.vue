<template>
  <div>
    <TheAppBar/>
    <v-content>
      <v-card>
        <SeeExplanation v-if="tutorialExpl" :expl="tutorialExpl"/>
        <v-card-title>Classmates</v-card-title>
        <v-card-text>
          <p v-for="classmate in classmates" :key="classmate.id">
            {{ `${classmate.firstName} ${classmate.lastName}` }}: {{ classmate.lastName === "Strang" ? "professor" : "student" }}
          </p>
        </v-card-text>
      </v-card>
    </v-content>
  </div>
</template>

<script>
import TheAppBar from "@/components/TheAppBar.vue";
import SeeExplanation from "@/components/SeeExplanation.vue";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import { tutorial, NotifFrequency } from "@/CONSTANTS.js";
import db from "@/database.js";

export default {
  mixins: [DatabaseHelpersMixin],
  components: { 
    TheAppBar, 
    SeeExplanation 
  },
  data: () => ({
    tutorialExpl: null,
    classmates: [],
    unsubscribe: null
  }),
  computed: {
    mitClass () {
      return this.$store.state.mitClass;
    }
  },
  async created () {
    const tutorialExplRef = db.doc(`classes/${tutorial.classId}/posts/${tutorial.postId}`);
    this.unsubscribe = await this.$_listenToDoc(tutorialExplRef, this, "tutorialExpl");
    const classmatesQuery = db.collection("users").where("enrolledClasses", "array-contains", {
      id: this.mitClass.id,
      name: this.mitClass.name,
      notifFrequency: NotifFrequency.ALWAYS
    });
    this.classmates = await this.$_getCollection(classmatesQuery);
  },
  beforeDestroy () {
    this.unsubscribe();
  }
}
</script>
