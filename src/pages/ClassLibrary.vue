<template>
  <v-row>
    <v-col cols="4">
      <TheSideDrawerGroupByDate @post-was-clicked="postID => $store.commit('SET_CURRENTLY_SELECTED_LIBRARY_POST_ID', postID)" type="posts"/>
    </v-col>
    
    <!-- TODO: inject the expl_prop into here  -->
    <v-col cols="8" class="d-flex flex-column mb-6">
      <ClassPageSeePost v-if="currentlySelectedLibraryPostID"
        :postID="currentlySelectedLibraryPostID"
        :key="currentlySelectedLibraryPostID"
      />
    </v-col>
  </v-row>
</template>

<script>
import TheSideDrawerFileExplorer from "@/components/TheSideDrawerFileExplorer.vue";
import TheSideDrawerGroupByDate from "@/components/TheSideDrawerGroupByDate.vue";
import ClassPageSeePost from "@/components/ClassPageSeePost.vue";
import { mapState } from "vuex"; 

export default {
  components: {
    TheSideDrawerFileExplorer,
    TheSideDrawerGroupByDate,
    ClassPageSeePost
  },
  computed: {
    ...mapState([
      "currentlySelectedLibraryPostID"
    ])
  }
}
</script>