<template>
  <div v-show="!isLeftPanelCollapsed">
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
          class="text-uppercase font-weight-medium mb-0 text-truncate"
          :style="indicesOfExpandedAreas.includes(i) && user.email ? 'margin-top: 6px; opacity: 80%' : 'opacity: 80%;'"
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

    <BasePopupButton v-if="sortedAreas.length !== 0 && sortedAreas.length < 5 && user.email"
      actionName="Create a new area"
      :inputFields="['name']" 
      @action-do="({ name }) => createNewRoomType(name)"
    >
      <template v-slot:activator-button="{ on }">
        <v-list-item v-on="on" style="font-weight: 500; opacity: 100%; padding-left: 6px">
          <v-icon class="black--text" style="margin-right: 1px; font-size: 1.35rem">mdi-plus</v-icon>
          <div class="text-uppercase font-weight-medium" style="opacity: 80%">NEW AREA</div>
        </v-list-item>
      </template> 
    </BasePopupButton>
  </div>
</template>

<script>
import CurrentArea from '@/components/CurrentArea.vue'
import DatabaseHelpersMixin from '@/mixins/DatabaseHelpersMixin.js'
import BasePopupButton from '@/components/BasePopupButton.vue'
import db from '@/database.js'
import { getRandomId } from '@/helpers.js'
import { mapState } from 'vuex'

export default {
  mixins: [
    DatabaseHelpersMixin
  ],
  components: {
    BasePopupButton,
    CurrentArea
  },
  data () {
    return {
      allAreas: [],
      indicesOfExpandedAreas: []
    }
  },
  computed: {
    ...mapState([
      'user',
      'isLeftPanelCollapsed'
    ]),
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
        // quick-fix: don't scroll if it's the first area as it's unnecessary
        // still flawed, because if it's room 20 on the first area, that room won't be visible
        if (sortedAreas[i].id === this.$route.params.class_id) return 
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
    },
    async createNewRoomType (name, id = getRandomId()) {
      if (!name) {
        this.$root.$emit("show-snackbar", "Don't forget to name this area"); 
        return;
      }
      const { class_id } = this.$route.params; 
      const ref = db.doc(`classes/${class_id}`);
      await Promise.all([
        ref.collection("roomTypes").doc(id).set({ id, name }),
        ref.collection("rooms").doc(id).set({
          isCommonRoom: true,
          roomTypeID: id,
          blackboards: [id]
        }),
        ref.collection("blackboards").doc(id).set({})
      ]);

      // have to re-fetch to get the updated areas 
      this.allAreas = await this.$_getCollection(this.classDocRef.collection("roomTypes"))

      this.$root.$emit("show-snackbar", "Successfully created new open space.")
      this.$router.push(`/class/${class_id}/section/${id}/room/${id}`);
    }
  }
}
</script>