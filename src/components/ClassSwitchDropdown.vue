<template>
  <v-menu v-model="isMenuOpen" fixed offset-y bottom>
    <template v-slot:activator="{ on }">
      <v-btn v-on="on" text tile large class="pa-2 text-truncate" style="padding-top: 0; font-size: 1.2rem; font-weight: 400">
        <!-- text--truncate doesn't do anything -->
        <div class="text--truncate" v-if="mitClass">
          {{ mitClass.name }}
        </div>
        <v-spacer/>
        <v-icon>mdi-menu-down</v-icon>
      </v-btn>
    </template>

    <v-list>
      <v-list-item v-for="mitClass in $store.state.user.enrolledClasses" :key="mitClass.id"
        @click="switchClass(mitClass)"
      >
        {{ mitClass.name }}
      </v-list-item>
      
      <!-- For adding new classes -->
      <slot>

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
      "user",
      "mitClass"
    ])
  },
  methods: {
    switchClass (mitClass) {
      const userRef = db.doc(`users/${this.$store.state.user.uid}`);
      userRef.update({
        mostRecentClassID: mitClass.id
      });
      this.$router.push(`/class/${mitClass.id}/section/${mitClass.id}`);
    }
  }
}
</script>