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
      <RenderlessFetchStrokes v-if="expl.hasStrokes"
        :strokesRef="strokesRef"
        :imageDownloadUrl="expl.imageUrl"
        v-slot="{ fetchStrokes, strokesArray, imageBlob, isLoading }"
      > 
        <!-- .
          quiet : don't trigger when the directive is binded, only trigger for actual intersecting 
          .once : unbind the directive once it has been triggered 
          `threshold: 0.5` : trigger the event only if >50% of the element is visible
              
          More info: https://vuetifyjs.com/en/directives/intersect/#intersection-observer 
        -->
        <div style="position: relative;" v-intersect.once="{
          handler (entries, observer, isIntersecting) {
            if (isIntersecting) fetchStrokes(); 
          },
          options: {
            threshold: 0.5 
          }
        }"> 
          <template v-if="strokesArray.length === 0 || isLoading">
            <!-- PLACEHOLDER -->
            <div style="width: 100%; height: 500px;">

            </div>
            <!-- <v-img :src="expl.thumbnail || 'https://miro.medium.com/max/4406/1*KjJ8jkkARDfxSsgD2AykwA.png'" :aspect-ratio="16/9" data-qa="expl-thumbnail"/>
            <div v-if="expl.hasStrokes" @click="handlePlayClick(fetchStrokes)" class="overlay-item">
              <v-progress-circular v-if="isLoading" :indeterminate="true" size="50" color="orange"/>
              <v-btn v-else large dark>
                <v-icon>mdi-play</v-icon>
              </v-btn>
            </div> -->
          </template>
          <DoodleVideo v-else-if="expl.audioUrl"
            :strokesArray="strokesArray"
            :imageBlob="imageBlob" 
            :audioUrl="expl.audioUrl" 
            :aspectRatio="expl.aspectRatio"
          />
          <DoodleAnimation v-else
            :strokesArray="strokesArray"
            :backgroundUrl="expl.imageUrl"
            :aspectRatio="expl.aspectRatio"
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
            <v-btn text color="secondary" @click="deleteExplanation()" data-qa="confirm-delete">DELETE</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Dropdown menu for editing and deleting -->
      <v-row v-if="user" justify="center">
        <v-layout align-center>
          <template v-if="hasDate">
            <p class="pt-3 pl-3 body-2 font-weight-light">
              Saved by {{ expl.creator.firstName }}, {{ displayDate(expl.date) }}
            </p>      
            <p v-if="expl.thumbnail" class="pt-3 pl-2 body-2 font-weight-light">
              (video views: {{ expl.views ? expl.views : 0 }}) 
            </p> 
            <v-spacer></v-spacer>
            
            <!-- email is unique for MIT Kerberos -->
            <template v-if="expl.creator.email === user.email">
              <BaseButton @click="startEditing()" icon="mdi-pencil">Edit Text</BaseButton>
              <BaseButton @click="popup = true" icon="mdi-delete" data-qa="delete-post-btn">Delete</BaseButton>
            </template>
            <BaseButton @click="upvoteExpl()" :disabled="expl.creator.uid === user.uid">
              Thanks! ({{ expl.upvotersIds ? expl.upvotersIds.length : 0 }})
            </BaseButton>
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
import BaseButton from "@/components/BaseButton.vue"
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
    BaseButton
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
      if (this.isLoading) return;
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
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
