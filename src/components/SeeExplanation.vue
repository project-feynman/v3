<template>
  <v-card v-if="expl">
    <v-container fluid>
      <!-- Text -->
      <template v-if="!isEditing"> 
        <h2 v-if="expl.title">{{ expl.title }}</h2>
        <p v-html="expl.html"></p>
      </template>
      <template v-else>
        <TextEditor :injectedHtml="expl.html" ref="TextEditor"/>
        <v-btn @click="updateExplanation()" color="secondary">
          SAVE EDIT
        </v-btn>
      </template>
      
      <!-- Doodle Video -->
      <RenderlessFetchStrokes v-if="expl.thumbnail"
        :strokesRef="strokesRef"
        :imageDownloadUrl="expl.imageUrl"
        v-slot="{ fetchStrokes, strokesArray, imageBlob, isLoading }"
      >
      
        <!-- <div id="doodle-wrapper" @click="(e) => clickOutsideDoodle(e)" :class="isFullScreen ? 'fullscreen-video' : 'video-wrapper'"> -->
          <!-- this might need some css to be the right size -->
        <div> 
          <!-- Thumbnail preview -->
          <template v-if="strokesArray.length === 0 || isLoading">
            <v-img :src="expl.thumbnail" :aspect-ratio="16/9"/>
            <div v-if="expl.hasStrokes" class="overlay-item">
              <v-progress-circular v-if="isLoading" :indeterminate="true" size="50" color="orange"/>
              <v-btn v-else @click="handlePlayClick(fetchStrokes)" large dark>
                <v-icon>mdi-play</v-icon>
              </v-btn>
            </div>
          </template>
          <!-- Loaded video -->
          <DoodleVideo v-else-if="expl.audioUrl"
            :strokesArray="strokesArray"
            :imageBlob="imageBlob" 
            :audioUrl="expl.audioUrl" 
            ref="Doodle"
          />
          <DoodleAnimation v-else
            :strokesArray="strokesArray"
            :backgroundUrl="expl.imageUrl"
            ref="Doodle"
          />
      </div>
      </RenderlessFetchStrokes>

      <!-- Delete popup TODO: refactor -->
      <v-dialog v-model="popup" max-width="600px">
        <v-card>
          <v-card-title>Are you sure you want to delete?</v-card-title>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text color="secondary" @click="popup = false">CANCEL</v-btn>
            <v-btn text color="secondary" @click="deleteExplanation()">DELETE</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Dropdown menu for editing and deleting -->
      <v-row v-if="user" justify="center">
        <v-layout align-center>
          <p v-if="hasDate" class="pt-3 pl-3 body-2 font-weight-light">
            By {{ expl.creator.firstName }}, {{ displayDate(expl.date) }}
          </p>      
          <p v-if="expl.thumbnail" class="pt-3 pl-2 body-2 font-weight-light">
            (video views: {{ expl.views ? expl.views : 0 }}) 
          </p> 
          <v-spacer></v-spacer>
          <template v-if="expl.creator.uid === user.uid">
            <!-- <ButtonNew @click="" -->
            <ButtonNew @click="startEditing()" icon="mdi-pencil">Edit Text</ButtonNew>
            <ButtonNew @click="popup = true" icon="mdi-delete">Delete</ButtonNew>
          </template>
          <ButtonNew @click="upvoteExpl()" :disabled="expl.creator.uid === user.uid">
            Thanks! ({{ expl.upvotersIds ? expl.upvotersIds.length : 0 }})
          </ButtonNew>
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
import firebase from "firebase/app";
import "firebase/firestore";

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
    upvoteExpl () {
      const ref = db.doc(`${this.expl.ref}`);
      if (!this.userHasUpvoted()) {
        ref.update({
          upvotersIds: firebase.firestore.FieldValue.arrayUnion(this.user.uid)
        });
      } else {
        ref.update({
          upvotersIds: firebase.firestore.FieldValue.arrayRemove(this.user.uid)
        });
      }
    },
    userHasUpvoted () {
      if (!this.expl.upvotersIds) return false;
      return this.expl.upvotersIds.includes(this.user.uid);
    },
    handlePlayClick (fetchStrokes) {
      fetchStrokes();
      // update view count 
      const ref = db.doc(`${this.expl.ref}`);
      ref.update({
        views: firebase.firestore.FieldValue.increment(1)
      });
    },
    displayDate (dateString) { 
      return displayDate(dateString);
    },
    startEditing () {
      this.isEditing = true;
    },
    updateExplanation () {
      const { TextEditor } = this.$refs;
      db.doc(this.expl.ref).update({
        html: TextEditor.html
      });
      this.isEditing = false;
    },
    // TODO: should be a recursive deletion
    async deleteExplanation () {
      this.popup = false;
      await db.doc(this.expl.ref).delete();
      // this.$router.push(`/class/${this.$route.params.class_id}`);
      this.$root.$emit("show-snackbar", "Successfully deleted post, you might have to leave the page though");
    },
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
