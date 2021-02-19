<template>
   <!-- `v-if` is not redundant, as it forces the birds-eye view to be refetched --> 
  <v-dialog v-if="value"
    :value="value" 
    @input="(newValue) => $emit('input', newValue)" 
    width="98vw"
    id="birds-eye-view-popup"
  >
    <!-- <v-toolbar dark fixed>
      <v-btn icon dark @click="$emit('input', false)">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-toolbar> -->

    <v-card> 
      <v-card-title>
        There are {{ blackboardIDsWithPeopleOn.length }} active blackboards
      </v-card-title>

      <v-card-subtitle>
        Warning: might lag if there are too many blackboard strokes
      </v-card-subtitle>

      <!-- Without `position: relative` the interection might not work -->
      <div :style="`height: ${getPopupWidth()}; display: flex; justify-content: space-evenly; flex-flow: wrap;`">
        <template v-for="boardID of blackboardIDsWithPeopleOn">
          <RenderlessSyncStrokes
            :strokesRef="getStrokesRefFrom(boardID)"
            v-slot="{ fetchStrokes, strokesArray, isLoading }"
            :key="boardID"
          > 
            <!-- .
              quiet : don't trigger when the directive is binded, only trigger for actual intersecting 
              .once : unbind the directive once it has been triggered 
              `threshold: 0.5` : trigger the event only if >50% of the element is visible
                  
              More info: https://vuetifyjs.com/en/directives/intersect/#intersection-observer 
            -->
            <div style="margin: 2px" v-intersect.once="{
              handler (entries, observer, isIntersecting) {
                if (isIntersecting) {
                  fetchStrokes(); 
                } 
              },
              options: {
                threshold: 0.3 // intersection triggers when 0.5 i.e. 50% of blackboard is in view 
              }
            }"> 
              <template v-if="isLoading">
                <!-- PLACEHOLDER so intersection doesn't autofire for a dimensionless element -->
                <div :style="`width: ${getPopupWidth()}px; height: ${getPopupWidth()}px;`">
                  <!-- Loading... -->
                  <p v-if="isLoading">Loading...</p>
                  <p v-else>Scroll down to load</p>
                </div>
              </template>

              <BlackboardCoreDisplay v-if="! isLoading"
                :strokesArray="strokesArray"
                :width="getPopupWidth()"
                :height="getPopupWidth()"
              />

              <div style="margin-right: 30px"></div>
            </div>
          </RenderlessSyncStrokes>
        </template>
      </div>
    </v-card>
  </v-dialog> 
</template>

<script>
import Blackboard from "@/components/Blackboard.vue"; 
import BlackboardCoreDisplay from "@/components/BlackboardCoreDisplay.vue"; 
import db from "@/database.js";
import RenderlessFetchStrokes from "@/components/RenderlessFetchStrokes.vue"; 
import RenderlessSyncStrokes from "@/components/RenderlessSyncStrokes.vue"; 

export default {
  props: {
    value: {
      type: Boolean,
      required: true
    },
    participants: {
      type: Array,
      required: true
    }
  },
  components: {
    Blackboard,
    BlackboardCoreDisplay,
    RenderlessFetchStrokes,
    RenderlessSyncStrokes
  },
  data () {
    return {
      isPopupOpen: false
    };
  },
  computed: {
    blackboardIDsWithPeopleOn () {
      const boardIDs = new Set(); 
      for (const participant of this.participants) {
        if (participant.currentBoardID) { // sometimes, perhaps because on an updated version, the participant doc doesn't have activeBoardID on
          boardIDs.add(participant.currentBoardID); 
        }
      }
      return Array.from(boardIDs);
    }
  },
  methods: {
    getPopupWidth () {
      const separationBetweenBoards = 10; 
      const deltaBetweenPopupAndFullWidth = 50; 
      // for iOS Safari compatibility 
      // see https://stackoverflow.com/questions/58390221/js-safari-on-ios-how-to-get-viewport-scale-property
      // const viewportWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
      return (window.innerWidth * 0.5) - separationBetweenBoards - deltaBetweenPopupAndFullWidth; 
    },
    getStrokesRefFrom (boardID) {
      return db.collection(`/classes/${this.$route.params.class_id}/blackboards/${boardID}/strokes`);
    }
  }
}
</script>