<template>
  <v-content>
    <v-toolbar flat style="border-bottom: 1px solid var(--v-accent-lighten2);">
      <v-avatar @click.stop="$emit('toggle-drawer')" color="white" style="box-shadow: 0 0 1px 2px rgba(0,0,0,0.05); cursor: pointer;" size="38">
        <v-icon color="accent">{{ drawer ? 'mdi-backburger' : 'mdi-menu' }}</v-icon>
      </v-avatar>
    </v-toolbar>
    <ExplanationDisplay v-if="tutorialExpl" :expl="tutorialExpl"/>
    <!-- <v-card-title>Class</v-card-title>
    <v-card-text>
      <p v-for="classmate in classmates" :key="classmate.id">
        {{ `${classmate.firstName} ${classmate.lastName}` }}
      </p>
    </v-card-text> -->
  </v-content>
</template>

<script>
import ExplanationDisplay from "@/components/ExplanationDisplay.vue";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import { tutorial } from "@/CONSTANTS.js";
import db from "@/database.js";

export default {
  props: {
    drawer: Boolean,
  },
  mixins: [DatabaseHelpersMixin],
  components: { 
    ExplanationDisplay 
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
    // const tutorialExplRef = db.doc(`classes/${tutorial.classId}/posts/${tutorial.postId}`);
    const tutorialExplRef = db.doc(`classes/FVdgjuywaFgxvyylISt2/posts/0aWcPnU5vOPck9qc48YG`);
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
