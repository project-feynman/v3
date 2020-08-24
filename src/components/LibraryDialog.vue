<template>
  <v-card>
    <v-row>
      <v-col cols="3">
        <TheSideDrawerFileExplorer type="posts"></TheSideDrawerFileExplorer>
      </v-col>
      <v-col>
        <ClassPageSeePost></ClassPageSeePost>
      </v-col>
    </v-row>
  </v-card>
</template>

<script>

import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import db from "@/database.js";
import firebase from "firebase/app";
import "firebase/firestore";
import TheSideDrawerFileExplorer from "@/components/TheSideDrawerFileExplorer.vue";
import ClassPageSeePost from "@/components/ClassPageSeePost.vue";


export default {
  components: {
    TheSideDrawerFileExplorer,
    ClassPageSeePost
  },
  data: function () {
    return {
      classID: this.$route.params.class_id,
    }
  },
  methods: {

  }
}
</script>