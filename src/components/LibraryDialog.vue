<template>
  <v-card>
    <v-row>
      <v-col cols="3">
        <TheSideDrawerFileExplorer @post-was-clicked="postID => currentPostID = postID" type="posts"/>
      </v-col>
      <v-col>
        <ClassPageSeePost v-if="currentPostID"
          :postID="currentPostID"
          :key="currentPostID"
        />
        <ClassPageOverview v-else/>
      </v-col>
    </v-row>
  </v-card>
</template>

<script>
import TheSideDrawerFileExplorer from "@/components/TheSideDrawerFileExplorer.vue";
import ClassPageSeePost from "@/components/ClassPageSeePost.vue";
import ClassPageOverview from "@/pages/ClassPageOverview.vue"; // TODO: refactor the component

export default {
  components: {
    TheSideDrawerFileExplorer,
    ClassPageSeePost,
    ClassPageOverview
  },
  data () {
    return {
      currentPostID: ""
    }
  }
}
</script>