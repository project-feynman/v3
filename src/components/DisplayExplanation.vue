<template>
  <v-card>
    <v-container fluid>
      <p v-if="!isEditing">{{ expl.title }}</p>
      <template v-else>
        <v-textarea :value="expl.title" @input="newVal => editedText = newVal"/>
        <v-btn @click="updateExplanation()" block color="accent lighten-1">SAVE EDIT</v-btn>
      </template>
      <DoodleVideo v-if="expl.hasVisual" ref="DoodleVideo"
        :blackboardRef="boardRef" 
        :blackboardId="expl.id" 
        :audioUrl="expl.audioUrl" 
        :imageUrl="expl.imageUrl" 
        :thumbnail="expl.thumbnail"
        @click="handleVideoClick()"
        @available-resources-ready="playVideo()"
      />
      <v-dialog v-model="isShowingPopup" max-width="600px">
        <v-card>
          <v-card-title>Are you sure you want to delete?</v-card-title>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn @click="isShowingPopup = false">CANCEL</v-btn>
            <v-btn @click="deleteExplanation()">DELETE</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      <v-row v-if="user" justify="center">
        <v-layout align-center>
          <v-spacer></v-spacer>
          <p class="pt-3">{{ hasDate? `By ${expl.creator.firstName}, ${displayDate(expl.date)}`: "" }}</p>
          <v-menu v-if="expl.creator.uid === user.uid" bottom offset-y>
            <template v-slot:activator="{ on }">
              <v-btn large icon v-on="on"><v-icon>mdi-dots-vertical</v-icon></v-btn>
            </template>
            <v-list>
              <v-list-item @click="startEditing()">
                <v-list-item-title >Edit text</v-list-item-title>
              </v-list-item>
              <v-list-item @click="isShowingPopup = true">
                <v-list-item-title >Delete</v-list-item-title>
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
import BasePopupButton from "@/components/BasePopupButton";
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
  components: { DoodleVideo, BasePopupButton },
  computed: {
    boardRef () { return db.doc(this.expl.ref); },
    user () { return this.$store.state.user; }
  },
  data: () => ({ 
    isEditing: false,
    isShowingPopup: false
  }),
  methods: {
    displayDate (date) { return moment(date).format('MMM D, h:mm a'); },
    handleVideoClick () {
      this.$refs.DoodleVideo.fetchStrokes(); 
    },
    playVideo () {
      this.$refs.DoodleVideo.playGivenWhatIsAvailable(); 
    },
    startEditing () {
      this.editedText = this.expl.title;
      this.isEditing = true;
    },
    updateExplanation () {
      db.doc(this.expl.ref).update({
        title: this.editedText
      })
      this.isEditing = false;
    },
    deleteExplanation () {
      db.doc(this.expl.ref).delete();
      this.isShowingPopup = false;
    }
  }
}
</script>

<style>
.image-container img {
  max-width: 100%;
}
</style>