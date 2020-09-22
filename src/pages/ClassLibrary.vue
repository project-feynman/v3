<template>
  <v-card width="800" height="400"> 
    <v-row>
      <v-col cols="4">
        <TheSideDrawerGroupByDate @post-was-clicked="postID => currentPostID = postID" type="posts"/>
      </v-col>
      
      <v-col cols="8" class="d-flex flex-column mb-6">
        <ClassPageSeePost v-if="currentPostID"
          :postID="currentPostID"
          :key="currentPostID"
        />
        <ClassTutorial v-else/>
      </v-col>
    </v-row>
  </v-card>
</template>

<script>
import TheSideDrawerFileExplorer from "@/components/TheSideDrawerFileExplorer.vue";
import TheSideDrawerGroupByDate from "@/components/TheSideDrawerGroupByDate.vue";
import ClassPageSeePost from "@/components/ClassPageSeePost.vue";
import ClassTutorial from "@/pages/ClassTutorial.vue"; // TODO: refactor the component

export default {
  components: {
    TheSideDrawerFileExplorer,
    TheSideDrawerGroupByDate,
    ClassPageSeePost,
    ClassTutorial
  },
  data () {
    return {
      currentPostID: ""
    }
  }
}
</script>