<template>
  <v-container fluid>
    <p v-if="!isEditing" 
      v-html="expl.html">
    </p>
    <template v-else>
      <TextEditor :injectedHtml="expl.html" ref="TextEditor"/>
      <v-btn @click="updateExplanation()" color="accent" block>
        SAVE EDIT
      </v-btn>
    </template>
    <RenderlessFetchStrokes
      :strokesRef="strokesRef"
      :hasStrokes="expl.hasStrokes"
      v-slot="{ fetchStrokes, strokesArray, isLoading }"
    >
      <BetaDoodleVideo v-if="expl.thumbnail"
        :thumbnailUrl="expl.thumbnail"
        @play-click="fetchStrokes()"
        :isLoading="isLoading"
        :strokesArray="strokesArray"
        :audioUrl="expl.audioUrl" 
        :backgroundUrl="expl.imageUrl" 
      />
    </RenderlessFetchStrokes>

    <v-dialog v-model="popup" max-width="600px">
      <v-card>
        <v-card-title>Are you sure you want to delete?</v-card-title>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="popup = false">CANCEL</v-btn>
          <v-btn @click="deleteExplanation()">DELETE</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-row v-if="user" justify="center">
      <v-layout align-center>
        <v-spacer></v-spacer>
        <p class="pt-3">
          {{ hasDate ? `By ${expl.creator.firstName}, ${displayDate(expl.date)}`: "" }}
        </p>
        <v-menu v-if="expl.creator.uid === user.uid" bottom offset-y>
          <template v-slot:activator="{ on: activateMenu }">
            <v-btn v-on="activateMenu" large icon>
              <v-icon>mdi-dots-vertical</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item @click="startEditing()">
              <v-list-item-title >Edit text</v-list-item-title>
            </v-list-item>
            <v-list-item @click="popup = true">
              <v-list-item-title>Delete</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-layout>
    </v-row>
  </v-container>
</template>

<script>
import TextEditor from "@/components/TextEditor.vue";
import DoodleVideo from "@/components/DoodleVideo.vue";
import BetaDoodleVideo from "@/components/BetaDoodleVideo.vue";
import BasePopupButton from "@/components/BasePopupButton.vue";
import RenderlessFetchStrokes from "@/components/RenderlessFetchStrokes";
import db from "@/database.js";
import { displayDate } from "@/helpers.js";

export default {
  props: { 
    expl: Object, 
    hasDate: {
      type: Boolean, 
      default: () => true
    }
  },
  components: { 
    DoodleVideo, 
    BetaDoodleVideo,
    TextEditor,
    BasePopupButton,
    RenderlessFetchStrokes
  },
  computed: {
    strokesRef () {
      return db.collection(`${this.expl.ref}/strokes`);
    },
    user () { 
      return this.$store.state.user; 
    }
  },
  data: () => ({ 
    isEditing: false,
    popup: false
  }),
  methods: {
    displayDate (dateString) { 
      return displayDate(dateString);
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
    // TODO: should be a recursive deletion
    deleteExplanation () {
      db.doc(this.expl.ref).delete();
      this.popup = false;
    }
  }
}
</script>