<template>
    <v-menu v-model="isMenuOpen" fixed>
      <template v-slot:activator="{ on }">
          <v-btn v-on="on" text tile large class="pa-2" style="padding-top: 0; font-size: 1.25rem text-truncate">
            {{ currentClass.name }}
            <v-icon>mdi-menu-down</v-icon>
          </v-btn>
      </template>

      <v-list>
        <v-list-item v-for="mitClass in $store.state.user.enrolledClasses" :key="mitClass.id"
          @click="switchClass(mitClass)"
        >
          {{ mitClass.name }}
        </v-list-item>
      </v-list>
    </v-menu>

    <!-- <v-select 
      :items="$store.state.user.enrolledClasses"
      :value="currentClass" 
      item-text="name" 
      hide-details 
      return-object
      height="35"
      style="font-size: 1.25rem; padding-top: 2px"
      @change="mitClass => switchClass(mitClass)"
      color="accent"
    >
      <template v-slot:append-item>
        <slot>
          
        </slot>
      </template>
    </v-select>  -->
</template>

<script>
import db from "@/database.js";

export default {
  data () {
    return {
      isMenuOpen: false
    };
  },
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
      this.$router.push(`/class/${mitClass.id}/section/${mitClass.id}/room/${mitClass.id}`);
    }
  }
}
</script>