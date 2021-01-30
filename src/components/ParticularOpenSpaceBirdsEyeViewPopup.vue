<template>
  <v-dialog 
    :value="value" 
    @input="(newValue) => $emit('input', newValue)" 
    width="90vw"
  >
    <v-card> 
      <div style="display: flex; justify-content: space-evenly">
        <template v-for="boardID of blackboardIDsWithPeopleOn">
          <RenderlessFetchStrokes
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
            <div style="position: relative;" v-intersect.once="{
              handler (entries, observer, isIntersecting) {
                if (isIntersecting) {
                  fetchStrokes(); 
                } 
              },
              options: {
                threshold: 0.5 // intersection triggers when 0.5 i.e. 50% of blackboard is in view 
              }
            }"> 
              <BlackboardCoreDrawing v-if="! isLoading"
                :strokesArray="strokesArray"
                :width="500"
                :height="500"
                :isReadOnly="true"
              />
              <div style="margin-right: 30px"></div>
            </div>
          </RenderlessFetchStrokes>
        </template>
      </div>
    </v-card>
  </v-dialog> 
</template>

<script>
import Blackboard from "@/components/Blackboard.vue"; 
import BlackboardCoreDrawing from "@/components/BlackboardCoreDrawing.vue"; 
import db from "@/database.js";
import RenderlessFetchStrokes from "@/components/RenderlessFetchStrokes.vue"; 

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
    BlackboardCoreDrawing,
    RenderlessFetchStrokes
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
    getStrokesRefFrom (boardID) {
      return db.collection(`/classes/${this.$route.params.class_id}/blackboards/${boardID}/strokes`);
    }
  }
}
</script>