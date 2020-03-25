<template>
  <v-card>
    <v-container fluid>
      <!-- Text -->
      <template v-if="!isEditing"> 
        <p v-html="expl.html"></p>
      </template>
      <template v-else>
        <TextEditor :injectedHtml="expl.html" ref="TextEditor"/>
        <v-btn @click="updateExplanation()" color="accent">
          SAVE EDIT
        </v-btn>
      </template>
      
      <!-- Doodle Video -->
      <RenderlessFetchStrokes v-if="expl.thumbnail"
        :strokesRef="strokesRef"
        :imageDownloadUrl="expl.imageUrl"
        v-slot="{ fetchStrokes, strokesArray, imageBlob, isLoading }"
      >
        <div style="height: 100%; position: relative;">
          <!-- Thumbnail preview -->
          <template v-if="strokesArray.length === 0 || isLoading">
            <v-img :src="expl.thumbnail" :aspect-ratio="16/9"/>
            <div v-if="expl.hasStrokes" class="overlay-item">
              <v-progress-circular v-if="isLoading" :indeterminate="true" size="50" color="orange"/>
              <v-btn v-else @click="fetchStrokes()" large dark>
                <v-icon>mdi-play</v-icon>
              </v-btn>
            </div>
          </template>
          <!-- Loaded video -->
          <DoodleVideo v-else-if="expl.audioUrl"
            :strokesArray="strokesArray"
            :imageBlob="imageBlob" 
            :audioUrl="expl.audioUrl" 
          />
          <DoodleAnimation v-else
            :strokesArray="strokesArray"
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
          <p class="pt-3 pl-3 body-2 font-weight-light">
            {{ hasDate ? `By ${expl.creator.firstName}, ${displayDate(expl.date)}`: "" }}
          </p>          
          <v-spacer></v-spacer>
          <template v-if="expl.creator.uid === user.uid">
            <ButtonNew @click="startEditing()" icon="mdi-pencil">Edit Text</ButtonNew>
            <ButtonNew @click="popup = true" icon="mdi-delete">Delete</ButtonNew>
          </template>
        </v-layout>
      </v-row>
    </v-container>
  </v-card>
</template>

<script>
import TextEditor from "@/components/TextEditor.vue";
import DoodleVideo from "@/components/DoodleVideo.vue";
import DoodleAnimation from "@/components/DoodleAnimation.vue";
import RenderlessFetchStrokes from "@/components/RenderlessFetchStrokes";
import ButtonNew from "@/components/ButtonNew.vue"
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
    DoodleAnimation,
    DoodleVideo,
    TextEditor,
    RenderlessFetchStrokes,
    ButtonNew
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
