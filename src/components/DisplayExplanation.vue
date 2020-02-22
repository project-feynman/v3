<template>
  <v-card>
    <v-container fluid>
      <p>{{ expl.title }} 
        {{ hasDate? ` by (${expl.creator.firstName}, ${displayDate(expl.date)})`: "" }}
      </p>
      <DoodleVideo v-if="expl.hasVisual" ref="DoodleVideo"
        :blackboardRef="boardRef" :blackboardId="expl.id"
        :audioUrl="expl.audioUrl" :imageUrl="expl.imageUrl" :hasBetaOverlay="true"
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
  computed: { boardRef () { return db.doc(this.expl.ref); } },
  methods: { displayDate (date) { return moment(date).format('MMM D, h:mm a'); } }
}
</script>