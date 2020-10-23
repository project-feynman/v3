<template>
  <div style="width: 130px">
    <v-select 
      :items="$store.state.user.enrolledClasses"
      :value="currentClass" 
      item-text="name" 
      hide-details 
      return-object
      height="35"
      style="font-size: 1.25rem"
      @change="mitClass => switchClass(mitClass)"
    >
      <!-- TODO: support deleting classes -->
      <!-- <template v-slot:append>
        append item
      </template> -->
    </v-select> 
  </div>
</template>

<script>
import db from "@/database.js";

export default {
  computed: {
    user () {
      return this.$store.state.user; 
    },
    currentClass () {
      for (const mitClass of this.user.enrolledClasses) {
        if (mitClass.id === this.$route.params.class_id) {
          return mitClass; 
        }
      }
    }
  },
  methods: {
    switchClass (mitClass) {
      const userRef = db.doc(`users/${this.$store.state.user.uid}`);
      userRef.update({
        mostRecentClassID: mitClass.id
      });
      this.$router.push(`/class/${mitClass.id}`);
    }
  }
}
</script>