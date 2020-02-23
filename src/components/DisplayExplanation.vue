<template>
  <v-card>
    <v-container fluid>
      <p>{{ expl.title }} 
        {{ hasDate? `(by ${expl.creator.firstName}, ${displayDate(expl.date)})`: "" }}
      </p>
      <DoodleVideo v-if="expl.hasVisual" ref="DoodleVideo"
        :blackboardRef="boardRef" :blackboardId="expl.id"
        :audioUrl="expl.audioUrl" :imageUrl="expl.imageUrl" :hasBetaOverlay="true" :thumbnail="expl.thumbnail"
        @click="handleVideoClick()"
        @available-resources-ready="playVideo()"
      />
    </v-container>
  </v-card>
</template>

<script>
import DoodleVideo from "@/components/DoodleVideo.vue";
import moment from "moment";
import db from "@/database.js";

export default {
  props: { 
    expl: Object, 
    hasDate: {
      type: Boolean, 
      default () { return true; }
    }
  },
  components: { DoodleVideo },
  computed: {
    boardRef () { return db.doc(this.expl.ref); },
    DoodleVideo () { return this.$refs.DoodleVideo; },
    selfRef () { return this.explanationsRef.doc(this.explanation.id); } // enables DoodleVideo to fetch its own strokes subcollection
  },
  methods: {
    displayDate (date) { return moment(date).format('MMM D, h:mm a'); },
    async handleVideoClick () {
      await this.DoodleVideo.fetchStrokes(); //idk if await is necessary here
    },
    playVideo () {
      this.DoodleVideo.playGivenWhatIsAvailable(); 
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
  /* computed: { boardRef () { return db.doc(this.expl.ref); } },
  methods: { displayDate (date) { return moment(date).format('MMM D, h:mm a'); } } */
}
</style>
/* </script> */