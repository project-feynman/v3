<template>
  <v-menu v-model="isMenuOpen" bottom offset-y>
    <template v-slot:activator="{ on }">
      <v-list-item v-on="on" two-line class="px-0">
        <v-list-item-avatar @click="$emit('logo-click')"
          class="mr-0" style="cursor: pointer; margin-left: 2px; margin-bottom: 14px;" tile width="53" height="45"
        >
          <img src="/logo.png">
        </v-list-item-avatar>

        <v-list-item-content v-if="mitClass" class="py-0 mx-1" style="max-width: 170px">
          <v-list-item-title class="mb-0 headline">
            {{ mitClass.name }}
          </v-list-item-title>

          <v-list-item-subtitle class="text-truncate">
            {{ mitClass.description }}
          </v-list-item-subtitle>
        </v-list-item-content>

        <v-icon class="black--text"> 
          mdi-menu-down
        </v-icon>
      </v-list-item>
    </template>

    <!-- Expanded list of classes -->
    <v-list style="overflow-y: auto; max-height: 350px">
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
import { mapState} from 'vuex'
import db from '@/database.js'

export default {
  data () {
    return {
      isMenuOpen: false
    }
  },
  computed: {
    ...mapState([
      'mitClass'
    ])
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