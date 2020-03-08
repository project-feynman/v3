<template>
  <div>
    <TheAppBar/>
    <v-content>
      <CreateExplanation 
        :willCreateNewPost="true"
        :postDbRef="newPostRef"
      />
    </v-content>
  </div>
</template>

<script>
import TheAppBar from "@/components/TheAppBar.vue";
import CreateExplanation from "@/components/CreateExplanation.vue";
import db from "@/database.js";
import { getRandomId } from "@/helpers.js";

export default {
  components: { 
    TheAppBar, 
    CreateExplanation 
  },
  computed: {
    postsRef () {
      return db.collection(`classes/${this.$route.params.class_id}/posts`);
    },
    newPostRef () { 
      return this.postsRef.doc(getRandomId()); 
    }
  }
}
</script>