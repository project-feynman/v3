<!-- Given a explanation, display its text and its blackboard -->
<template>
  <v-card id="display-explanation">
    <!-- Uncomment below for MUCH easier debugging -->
    <!-- <p>{{ explanation }}</p>  -->
    <v-container fluid>
      <h3 class="explanation-title">
        {{ explanation.title }}
      </h3>
      <div class="explanation-description mb-5">
        {{ explanation.description }}
      </div>
      <div v-if="explanation.image" class="image-container">
        <img :src="explanation.image"/>
      </div>
      <!-- @video-click="playGivenWhatIsAvailable()" -->
      <DoodleVideo 
        v-if="explanation.duration"
        :blackboardRef="selfRef"
        ref="DoodleVideo"
        :blackboardId="explanation['.key']" 
        :canvasId="`${explanation}`"
        :audioUrl="explanation.audioUrl"
        :hasBetaOverlay="true"
      />
    </v-container>
    <footer v-if="explanation.creator" class="explanation-footer px-4 py-3">
      <v-btn>Upvote</v-btn>
      Created by {{ explanation.isAnonymous ? 'Anonymous' : explanation.creator.firstName }}, {{ displayDate(explanation.date) }} 
    </footer>
  </v-card>
</template>

<script>
import DoodleVideo from "@/components/DoodleVideo.vue"
import db from "@/database.js";
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
  components: {
    DoodleVideo
  },
  data () {
    return {
      video: null
    }
  },
  computed: {
    DoodleVideo () { // disgintuish between the Vue component and the Firestore document
      return this.$refs.DoodleVideo;
    },
    // Enables DoodleVideo to fetch the strokes subcollection
    selfRef () {
      return this.explanationsRef.doc(this.explanation['.key']);
    }
  },
  methods: {
    displayDate (date) {
      return moment(date).format('MMM Do, h:mm a');
    }
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
.explanation-footer {
  background: #f9f9f9;
  text-align: left;
}
</style>