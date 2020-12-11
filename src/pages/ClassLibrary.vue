<template>
  <v-row>
    <v-col cols="4">
      <TheSideDrawerGroupByDate @post-was-clicked="postID => currentPostID = postID" type="posts"/>
    </v-col>
    
    <!-- TODO: inject the expl_prop into here  -->
    <v-col cols="8" class="d-flex flex-column mb-6">
      <ClassPageSeePost v-if="currentPostID"
        :postID="currentPostID"
        :key="currentPostID"
      />
      <ClassTutorial v-else/>
    </v-col>
  </v-row>
</template>

<script>
import TheSideDrawerFileExplorer from "@/components/TheSideDrawerFileExplorer.vue";
import TheSideDrawerGroupByDate from "@/components/TheSideDrawerGroupByDate.vue";
import ClassPageSeePost from "@/components/ClassPageSeePost.vue";

export default {
  components: {
    TheSideDrawerFileExplorer,
    TheSideDrawerGroupByDate,
    ClassPageSeePost
  },
  data () {
    return {
      currentPostID: ""
    }
  }
}
</script>