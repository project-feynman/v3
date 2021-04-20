<template>
  <v-menu v-model="isMenuOpen" fixed offset-y bottom>
    <template v-slot:activator="{ on }">
      <v-btn v-on="on" text tile class="py-0 text-h6" max-width="150" max-height="25" style="padding-left: 3px; padding-right: 0px;">
        <span class="d-inline-block text-truncate" style="max-width: 110px;">
          {{ currentClass ? currentClass.name : "ERROR" }}
        </span>
        <v-spacer/>
        <v-icon>mdi-menu-down</v-icon>
      </v-btn>
    </template>

    <v-list style="overflow-y: auto; max-height: 400px">
      <template v-for="mitClass in $store.state.user.enrolledClasses">
        <v-list-item v-if="mitClass.id !== $route.params.class_id"
          :key="mitClass.id"
          @click="switchClass(mitClass)"
        >
          {{ mitClass.name }}
        </v-list-item>
      </template>
      
      <slot name="add-join-leave-class">

      </slot>
    </v-list>
  </v-menu>
</template>

<script>
import db from "@/database.js";
import { mapState } from "vuex"; 

export default {
  data () {
    return {
      isMenuOpen: false
    };
  },
  computed: {
    ...mapState([
      "user"
    ]),
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
      this.$router.push(`/class/${mitClass.id}/section/${mitClass.id}/room/${mitClass.id}`);
    }
  }
}
</script>