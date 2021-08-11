<template>
  <div>
    <div v-for="(area, i) of sortedAreas" :key="area.id" style="margin-bottom: 12px">
      <div @click="toggleExpansion(i)" 
        :ref="`area-${area.id}`"
        style="display: flex; align-content: center;" class="pl-1 pr-0"
      >
        <v-icon v-if="indicesOfExpandedAreas.includes(i)" class="black--text">
          mdi-chevron-down
        </v-icon>
        <v-icon v-else class="black--text">
          mdi-chevron-right
        </v-icon>

        <p 
          class="text-uppercase font-weight-medium mb-0"
          :style="indicesOfExpandedAreas.includes(i) ? 'margin-top: 6px; opacity: 80%' : 'opacity: 80%;'"
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
      indicesOfExpandedAreas: []
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
    this.allAreas = await this.$_getCollection(this.classDocRef.collection("roomTypes"))

    // let the DOM update to newly hydrated `allAreas`
    await this.$nextTick() 
    // open and scroll to the current area the person is in
    const { sortedAreas } = this
    for (let i = 0; i < sortedAreas.length; i++) {
      if (sortedAreas[i].id === this.$store.state.currentAreaID) {
        this.indicesOfExpandedAreas.push(i)
        this.$refs[`area-${sortedAreas[i].id}`][0].scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
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