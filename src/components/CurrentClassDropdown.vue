<template>
  <v-menu v-model="isMenuOpen" bottom offset-y>
    <template v-slot:activator="{ on }">
      <!-- The limiting case that max-width must work for is a laptop with the scrollbar taking up additional width  -->
      <!-- Both `max-width: fit-content` are necessary, analysis is slightly complicated
       -->
      <v-list-item v-on="on" two-line class="px-0" style="max-width: fit-content">
        <v-list-item-content v-if="mitClass" class="py-0 ml-1 mr-0" style="max-width: fit-content">
          <v-list-item-title class="mb-0 display-1 text-truncate" style="1.4rem; display: inline-block; max-width: 150px">
            {{ mitClass.name }}
          </v-list-item-title>

          <!-- margin-left is necessary because, by default, Vuetify doesn't align the title and subtitle properly when they're different fonts -->
          <v-list-item-subtitle class="text-truncate" style="margin-left: 2px; display: inline-block; max-width: 150px">
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