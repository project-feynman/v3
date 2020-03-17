<template>
  <v-card>
    <v-container fluid>
      <!-- Text -->
      <p v-if="!isEditing" v-html="expl.html"></p>
      <template v-else>
        <TextEditor :injectedHtml="expl.html" ref="TextEditor"/>
        <v-btn @click="updateExplanation()" color="accent" block>
          SAVE EDIT
        </v-btn>
      </template>
      
      <!-- Doodle Video -->
      <RenderlessFetchStrokes v-if="expl.thumbnail"
        :strokesRef="strokesRef"
        v-slot="{ fetchStrokes, strokesArray, isLoading }"
      >
        <div style="height: 100%">
          <!-- Thumbnail preview -->
          <template v-if="strokesArray.length === 0">
            <v-img :src="expl.thumbnail" :aspectRatio="16/9"/>
            <div v-if="expl.hasStrokes" class="overlay-item">
              <v-progress-circular v-if="isLoading" :indeterminate="true" size="50" color="orange"/>
              <v-btn v-else @click="fetchStrokes()" large dark>
                <v-icon>mdi-play</v-icon>
              </v-btn>
            </div>
          </template>
          <!-- Loaded video -->
          <DoodleVideo v-else
            :strokesArray="strokesArray"
            :audioUrl="expl.audioUrl" 
            :backgroundUrl="expl.imageUrl" 
          />
        </div>
      </RenderlessFetchStrokes>

      <!-- Delete popup -->
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

      <!-- Dropdown menu for editing and deleting -->
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
  </v-card>
</template>

<script>
import TextEditor from "@/components/TextEditor.vue";
import DoodleVideo from "@/components/DoodleVideo.vue";
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

<style scoped>
.overlay-item {
  position: absolute; 
  top: 50%; 
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>