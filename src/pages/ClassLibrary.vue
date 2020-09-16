<template>
  <v-row>
    <v-col cols="4">
      <v-list max-width="300">
        <TheSideDrawerFileExplorer @post-was-clicked="postID => currentPostID = postID" type="posts"/>
      </v-list>
    </v-col>
    
    <v-col cols="8">
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
import ClassPageSeePost from "@/components/ClassPageSeePost.vue";
import ClassTutorial from "@/pages/ClassTutorial.vue"; // TODO: refactor the component

export default {
  components: {
    TheSideDrawerFileExplorer,
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