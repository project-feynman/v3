<template>
  <div v-if="mitClass" style="display: flex">
    <!-- 
      For some reason `width: 400px` will be violated if the <v-tree-view/> expands its subfolders 
      so we use `min-width` and `max-width` instead 
    -->
    <div style="min-width: 300px; max-width: 300px; max-height: 80vh" class="overflow-y-auto">
     <TheSideDrawerGroupByFolders
        @post-was-clicked="postID => $store.commit('SET_CURRENTLY_SELECTED_LIBRARY_POST_ID', postID)"
      /> 
    </div>
    <!-- `flex-grow` lets the video take the remaining available space, see https://stackoverflow.com/questions/37745051/make-div-fill-remaining-horizontal-space-in-flexbox -->
    <div style="flex-grow: 1; max-height: 80vh" class="overflow-y-auto">
      <!-- TODO: inject the expl_prop into here  -->
      <ExplanationGroupDisplay v-if="currentlySelectedLibraryPostID"
        :originalExplDbPath="`classes/${mitClass.id}/posts/${currentlySelectedLibraryPostID}`"
        :replyExplsDbPath="`classes/${mitClass.id}/posts/${currentlySelectedLibraryPostID}/replies`"
        :postID="currentlySelectedLibraryPostID"
        :key="currentlySelectedLibraryPostID"
      />
      <!-- Add a tutorial here -->
      <p v-else>
        The library is about minimizing the pain of exporting a file and sharing it with people. 
        On any Explain board, you can press "Save board to library" and it'll end up here. 
        The difference is most noticeable for video files. 
      </p>
    </div>
  </div>
</template>

<script>
import TheSideDrawerFileExplorer from "@/components/TheSideDrawerFileExplorer.vue";
import TheSideDrawerGroupByDate from "@/components/TheSideDrawerGroupByDate.vue";
import TheSideDrawerGroupByFolders from "@/components/TheSideDrawerGroupByFolders.vue";
import ExplanationGroupDisplay from "@/components/ExplanationGroupDisplay.vue";
import { mapState } from "vuex"; 

export default {
  components: {
    TheSideDrawerFileExplorer,
    TheSideDrawerGroupByDate,
    TheSideDrawerGroupByFolders,
    ExplanationGroupDisplay
  },
  computed: {
    ...mapState([
      "mitClass",
      "currentlySelectedLibraryPostID"
    ])
  }
}
</script>