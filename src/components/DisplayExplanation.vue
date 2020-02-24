<template>
  <v-card>
    <v-container fluid>
      <!-- <p>{{ expl }}</p> -->
      <p>{{ expl.title }}</p>
      <DoodleVideo v-if="expl.hasVisual" ref="DoodleVideo"
        :blackboardRef="boardRef" 
        :blackboardId="expl.id" 
        :audioUrl="expl.audioUrl" 
        :imageUrl="expl.imageUrl" 
        :thumbnail="expl.thumbnail"
        @click="handleVideoClick()"
        @available-resources-ready="playVideo()"
      />
      <v-row v-if="user" justify="center">
        <v-layout align-center>
          <v-spacer></v-spacer>
          <p class="pt-3">{{ hasDate? `By ${expl.creator.firstName}, ${displayDate(expl.date)}`: "" }}</p>
          <v-menu v-if="expl.creator.uid === user.uid" bottom offset-y>
            <template v-slot:activator="{ on }">
              <v-btn v-if="expl.creator.uid === user.uid" large icon v-on="on">
                <v-icon>mdi-dots-vertical</v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-list-item v-for="(item, i) in ['delete']" :key="i"
                @click="deleteExplanation()"
              >
                <v-list-item-title>{{ item }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </v-layout>
      </v-row>
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
    user () { return this.$store.state.user; }
  },
  methods: {
    displayDate (date) { return moment(date).format('MMM D, h:mm a'); },
    handleVideoClick () {
      this.$refs.DoodleVideo.fetchStrokes(); 
    },
    playVideo () {
      this.$refs.DoodleVideo.playGivenWhatIsAvailable(); 
    },
    deleteExplanation () {
      this.explRef.delete();
    }
  }
}
</script>

<style>
.image-container img {
  max-width: 100%;
}
</style>