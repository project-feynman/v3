<template>
  <div>
    <portal to="side-drawer">
      <v-list nav class="pa-2">
        <template v-for="roomType in sortedRoomTypes">
          <!-- accent-text counterintuitively gives the orange shading and NOT the orange text-->
          <!-- :disabled prop is necessary because otherwise, the user can click it to go into a void (without being in a room) -->
          <v-list-item :key="roomType.id"
            :to="(`/class/${classID}/section/${roomType.id}`)"
            active-class="accent--text"
            class="px-0" 
          >
            <!--  color: ${ sectionID === roomType.id ? '#ff5b24' : '#424242' };  -->
            <v-list-item-content class="pt-0 pb-2">
              <v-row class="d-flex px-3 py-2" align="center">
                <div 
                  class="ml-3"
                  :style="`
                    font-size: 1rem; 
                    font-weight: 400; 
                    color: ${ sectionID === roomType.id ? '#424242' : '#424242' }; 
                    opacity: ${ sectionID === roomType.id ? '70%' : '30%' };
                  `"
                >
                  <div v-if="roomType.id !== sectionID">
                    {{ roomType.name }}
                  </div>
                  <portal-target v-else name="room-type-name">

                  </portal-target>
                </div>

                <v-spacer/>

                <portal-target v-if="sectionID === roomType.id"
                  name="current-open-space-actions"
                  :key="roomType.id + 'actions-portal'"
                >
                  
                </portal-target>
              </v-row>
      
              <portal-target v-if="sectionID === roomType.id" 
                name="currently-active-open-space" 
                :key="roomType.id + 'rooms-portal'"
              >

              </portal-target>
            </v-list-item-content>
          </v-list-item>
        </template>
      </v-list>
    </portal>
  </div>
</template>

<script>
/**
 * Experiment: whenever the user switches an open space, recount the number of participants in each open space. 
 * For operations that are rare, don't take up too much area. Optimize for high frequency operations.
 */

import db from "@/database.js"; 
import { getRandomId } from "@/helpers.js"; 
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import BasePopupButton from "@/components/BasePopupButton.vue"; 
import BaseButton from "@/components/BaseButton.vue";
import ClassLibrary from "@/pages/ClassLibrary.vue";
import { mapState, mapGetters } from "vuex";

export default {
  name: "AllOpenSpaces",
  mixins: [
    DatabaseHelpersMixin
  ],
  components: {
    ClassLibrary,
    BasePopupButton,
    BaseButton,
  },
  data () {
    return {
      roomTypes: [],
    };
  },
  computed: {
    ...mapState([ "mitClass" ]),
    ...mapGetters([ "isAdmin" ]),
    classID () { return this.$route.params.class_id; },
    sectionID () { return this.$route.params.section_id; },
    classDocRef () { return db.doc(`classes/${this.classID}`); },
    sortedRoomTypes () {
      return [
        ...this.roomTypes.filter(roomType => roomType.id === this.$route.params.class_id),
        ...this.roomTypes.filter(roomType => roomType.id !== this.$route.params.class_id)
      ];
    }
  },
  async created () {
    // fetch once for light bandwidth usage
    this.roomTypes = await this.$_getCollection(this.classDocRef.collection("roomTypes")); 
  }
}
</script>