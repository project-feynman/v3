<template>
  <v-card>
    <SeeExplanation v-if="tutorialExpl" :expl="tutorialExpl"/>
    <v-card-title>Class</v-card-title>
    <v-card-text>
      <p v-for="classmate in classmates" :key="classmate.id">
        {{ `${classmate.firstName} ${classmate.lastName}` }}
      </p>
    </v-card-text>
  </v-card>
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
  watch: {
    mitClass: {
      handler: "fetchClassmates",
      immediate: true
    }
  },
  computed: {
    mitClass () {
      return this.$store.state.mitClass;
    }
  },
  async created () {
    const tutorialExplRef = db.doc(`classes/${tutorial.classId}/posts/${tutorial.postId}`);
    this.unsubscribe = await this.$_listenToDoc(tutorialExplRef, this, "tutorialExpl");
  },
  beforeDestroy () {
    this.unsubscribe();
  },
  methods: {
    fetchClassmates () {}
    // async fetchClassmates () {
    //   if (!this.mitClass) { return; } 
    //   const classmatesQuery = db.collection("users").where("enrolledClasses", "array-contains", {
    //     id: this.mitClass.id,
    //     name: this.mitClass.name,
    //     notifFrequency: NotifFrequency.ALWAYS
    //   });
    //   this.classmates = await this.$_getCollection(classmatesQuery);
    // }
  }
}
</script>
