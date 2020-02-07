<template>
  <div style="height: 100%">
    <slot :videos="videos">
      {{ videos }}
    </slot>
  </div>
</template>

<script>
import db from "@/database.js";
import helpers from "@/helpers.js";

export default {
  props: {
    tabNumber: Number
  },
  data () {
    return {
      videos: []
    }
  },
  async created () {
    const classId = this.$route.params.class_id;
    if (!classId || this.tabNumber === null) return;// tabNumber can be 0, therefore explicitly check for null
    const ref = db.collection("classes").doc(classId).collection("blackboards").where("tabNumber", "==", this.tabNumber);
    this.videos = await helpers.getCollectionFromDB(ref);
    this.$emit("videos-fetched");
  }
}
</script>