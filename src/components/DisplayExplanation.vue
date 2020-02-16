<template>
  <v-card id="display-explanation">
    <!-- Uncomment below for MUCH easier debugging -->
    <!-- <p>{{ explanation }}</p>  -->
    <v-container fluid>
      <h3 class="explanation-title">
        {{ explanation.title }} 
        (by {{ explanation.creator.firstName }}, 
        {{ displayDate(explanation.date) }})
      </h3>
      <div class="explanation-description mb-5">
        {{ explanation.description }}
      </div>
      <!-- <div v-if="explanation.imageUrl" class="image-container">
        <img :src="explanation.imageUrl"/>
      </div> -->
      <DoodleVideo
        v-if="explanation.hasVisual"
        ref="DoodleVideo"
        :blackboardRef="selfRef"
        :blackboardId="explanation.id"
        :audioUrl="explanation.audioUrl"
        :imageUrl="explanation.imageUrl"
        :hasBetaOverlay="true"
      />
    </v-container>
  </v-card>
</template>

<script>
import DoodleVideo from "@/components/DoodleVideo.vue";
import moment from "moment";

export default {
  props: {
    explanation: {
      type: Object,
      required: true
    },
    explanationsRef: {
      type: Object,
      required: true
    }
  },
  components: { DoodleVideo },
  computed: {
    DoodleVideo () { return this.$refs.DoodleVideo; },
    selfRef () { return this.explanationsRef.doc(this.explanation.id); } // enables DoodleVideo to fetch its own strokes subcollection
  },
  methods: {
    displayDate (date) { return moment(date).format('MMM D, h:mm a'); }
  }
}
</script>

<style>
.explanation-title {
  line-height: 1.3;
  font-size: 1.1em;
  font-weight: 500;
  margin-bottom: 15px;
}
.image-container img {
  max-width: 100%
}
</style>
