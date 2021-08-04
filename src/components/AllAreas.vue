<template>
  <div>
    <div v-for="(area, i) of sortedAreas" :key="area.id">
      <div style="display: flex; align-content: center;">
        <v-icon @click="toggleExpansion(i)" class="black--text">
          mdi-chevron-down
        </v-icon>

        <p class="text-uppercase font-weight-medium text--secondary mb-0"
          :style="indicesOfExpandedAreas.includes(i) ? 'margin-top: 6px;' : ''"
        >
          {{ area.name }}
        </p>
        
        <v-spacer/>

        <portal-target :name="`area-${area.id}-actions`">

        </portal-target>
      </div>

      <CurrentArea v-if="indicesOfExpandedAreas.includes(i)"
        :sectionID="area.id"
      />
    </div>
  </div>
</template>

<script>
import CurrentArea from '@/components/CurrentArea.vue'
import DatabaseHelpersMixin from '@/mixins/DatabaseHelpersMixin.js'
import db from '@/database.js'

export default {
  mixins: [
    DatabaseHelpersMixin
  ],
  components: {
    CurrentArea
  },
  data () {
    return {
      allAreas: [],
      indicesOfExpandedAreas: [0]
    }
  },
  computed: {
    classDocRef () { return db.doc(`classes/${this.$route.params.class_id}`) },
    sortedAreas () {
      return [
        ...this.allAreas.filter(roomType => roomType.id === this.$route.params.class_id),
        ...this.allAreas.filter(roomType => roomType.id !== this.$route.params.class_id)
      ];
    },
    currentRoomTypeDoc () {
      return this.allAreas.filter(roomType => roomType.id === this.sectionID)[0];
    }
  },
  async created () {
    // fetch once for light bandwidth usage
    this.allAreas = await this.$_getCollection(this.classDocRef.collection("roomTypes"));
  },
  methods: {
    toggleExpansion (i) {
      if (this.indicesOfExpandedAreas.includes(i)) {
        const updatedArray = this.indicesOfExpandedAreas.filter(element => element !== i)
        this.indicesOfExpandedAreas = updatedArray
      } else {
        this.indicesOfExpandedAreas.push(i)
      }
    }
  }
}
</script>