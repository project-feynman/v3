<template>
  <v-card>
    <v-container fluid>
      <p v-if="!isEditing" v-html="expl.html"></p>
      <TextEditor v-else key="1" ref="TextEditor"
        :injectedHtml="expl.html" 
      />
      <v-btn v-if="isEditing" @click="updateExplanation()" block color="accent">
        SAVE EDIT
      </v-btn>
      <DoodleVideo v-if="expl.thumbnail" 
        :blackboardRef="boardRef" 
        :blackboardId="expl.id" 
        :audioUrl="expl.audioUrl" 
        :imageUrl="expl.imageUrl" 
        :thumbnail="expl.thumbnail"
        :hasStrokes="expl.hasStrokes"
        @click="fetchStrokes()"
        @available-resources-ready="playGivenWhatIsAvailable()"
        ref="DoodleVideo"
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
import TextEditor from "@/components/TextEditor.vue";
import DoodleVideo from "@/components/DoodleVideo.vue";
import db from "@/database.js";
import { displayDate } from "@/helpers.js";

export default {
  props: { 
    expl: Object, 
    hasDate: {
      type: Boolean, 
      default () { return true; }
    }
  },
  components: { 
    DoodleVideo, 
    TextEditor 
  },
  computed: {
    boardRef () { 
      return db.doc(this.expl.ref); 
    },
    user () { 
      return this.$store.state.user; 
    }
  },
  data: () => ({ 
    isEditing: false,
    isShowingPopup: false
  }),
  methods: {
    displayDate (dateString) { 
      return displayDate(dateString);
    },
    // TODO: fetchStrokes as a slot-prop
    fetchStrokes () {
      this.$refs.DoodleVideo.fetchStrokes(); 
    },
    // TODO: playGivenWhatIsAvailable as a slot-prop
    playGivenWhatIsAvailable () {
      this.$refs.DoodleVideo.playGivenWhatIsAvailable(); 
    },
    startEditing () {
      this.isEditing = true;
    },
    updateExplanation () {
      const { TextEditor } = this.$refs;
      db.doc(this.expl.ref).update({
        title: TextEditor.extractAllText(),
        html: TextEditor.html
      });
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