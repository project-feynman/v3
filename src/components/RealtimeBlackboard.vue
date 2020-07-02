<template>
  <div>
    <p v-if="!hasFetchedStrokesFromDb">Loading the real-time blackboard...</p>
    <Blackboard v-else
      :strokesArray="strokesArray" @stroke-drawn="stroke => uploadToDb(stroke)"
      :key="incrementKeyToDestroy"
      isRealtime
      @mounted="({ getThumbnailBlob }) => blackboard.getThumbnailBlob = getThumbnailBlob"
      @update:currentTime="currentTime => blackboard.currentTime = currentTime"
      @update:bgImageBlob="blob => blackboard.bgImageBlob = blob"
      @update:audioBlob="blob => blackboard.audioBlob = blob"
      @board-reset="deleteAllStrokesFromDb()"
      @record-end="handleRecordEnd()"
    >
      <template v-slot:blackboard-toolbar>
        <slot name="blackboard-toolbar">

        </slot> 
        <ButtonNew @click="uploadExplanation()" icon="mdi-upload">Save Board</ButtonNew>
      </template> 
    </Blackboard> 
     <v-dialog v-model="dialog" max-width="290">
      <v-card>
        <v-card-title class="headline">Save your recorded explanation?</v-card-title>
        <v-card-text>
          Save your recorded explanation?
        </v-card-text>
        <v-card-actions>
          <v-spacer/>
          <v-btn color="green darken-1" text @click="discardAudio()">
            No, discard it. 
          </v-btn>
          <v-btn color="green darken-1" text @click="saveVideo()">
            Yes, save it as a post. 
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
/**
 * A real-time blackboard, which is <Blackboard/> hooked up to Firestore.
 * 
 * Proof of database <=> blackboard: 
 * 
 * database => blackboard: 
 *     Whenever a new stroke is added to the database, the database listener will trigger and update 
 *     strokesArray, which propagates to the Blackboard component
 * 
 * blackboard => database: 
 *     Whenever the user draws a new stroke, that stroke will be uploaded as a new document to the database. 
 *     Momentarily, there will be divergence between state and UI, which is to say that 
 *     the user's `strokesArray` does NOT have the new stroke, even though she was the one who drew the stroke.
 *     However, when the write operation finally resolves, everyone's `strokesArray` will be updated, 
 *     including the original author herself. Note that there will be double drawing, where the first is for feedback,
 *     and the second is to signal when other people can actually see her new stroke. 
 */
import Blackboard from "@/components/Blackboard.vue"; 
import ExplUploadHelpers from "@/mixins/ExplUploadHelpers.js";
import firebase from "firebase/app"; 
import ButtonNew from "@/components/ButtonNew.vue"; 
import db from "@/database.js"; 
import { mapState } from "vuex"; 
import { getRandomId } from "@/helpers.js";

export default {
  props: {
    strokesRef: {
      type: null,
      required: true
    }
  },
  mixins: [
    ExplUploadHelpers
  ],
  components: {
    Blackboard,
    ButtonNew
  },
  data () {
    return {
      strokesArray: [],
      hasFetchedStrokesFromDb: false,
      blackboard: {
        bgImageBlob: null,
        audioBlob: null,
        getThumbnailBlob: null,
        currentTime: 0
      },
      dialog: false,
      incrementKeyToDestroy: 0
    };
  },
  computed: {
    ...mapState([
      "user",
      "mitClass"
    ])
  },
  created () {
    this.keepSyncingBoardWithDb(); 
  },
  methods: {
    /*
    TODO:
      1. order by `timestamp` rather than `strokeNumber`
      2. Investigate why each new stroke triggers 2-3 snapshot callbacks
      3. handle a board reset more efficiently
    */
    keepSyncingBoardWithDb () {
      this.strokesRef.orderBy("strokeNumber").onSnapshot(snapshot => {
        if (snapshot.docs.length === 0) {
          this.strokesArray = [];
        } else {
          snapshot.docChanges().filter(change => change.type === "added").forEach(change => {
            this.strokesArray.push({
              id: change.doc.id,
              ...change.doc.data(),
              startTime: this.blackboard.currentTime,
              endTime: 1 + this.blackboard.currentTime // make other people's strokes have a period of 1 second
            });
          });
        }
        if (!this.hasFetchedStrokesFromDb) { 
          this.hasFetchedStrokesFromDb = true;
        }
      });
    },
    async uploadToDb (stroke) {
      const timestamp = firebase.firestore.FieldValue.serverTimestamp();
      try {
        this.strokesRef.add({
          timestamp,
          ...stroke
        });
      } catch (error) {
        this.$root.$emit("show-snackbar", "Failed to upload stroke to database.");
      }
    },
    async uploadExplanation () {
      const title = `Untitled (${new Date().toLocaleTimeString()})`; 
      const html = "";
      const explRef = db.doc(`classes/${this.mitClass.id}/posts/${getRandomId()}`);
      const thumbnailBlob = await this.blackboard.getThumbnailBlob();
      const tags = []

      this.$_saveExplToCacheThenUpload(
        thumbnailBlob,
        this.blackboard.audioBlob,
        html,
        title,
        tags,
        explRef
      );
    },
    async deleteAllStrokesFromDb () {
      const promises = [];
      const strokeDeleteRequests = [];
      let currentBatch = db.batch();
      let currentBatchSize = 0;

      for (const stroke of this.strokesArray) {
        if (currentBatchSize >= 500) {
          promises.push(currentBatch.commit());
          currentBatch = db.batch(); 
          currentBatchSize = 0; 
        } 
        currentBatch.delete(this.strokesRef.doc(stroke.id));
        currentBatchSize += 1;
      }

      promises.push(currentBatch.commit()); 
      // TODO: 
      // promises.push(
      //   this.roomRef.update({ imageUrl: "" })
      // );
      await Promise.all(promises);
      this.$root.$emit("show-snackbar", "Successfully reset blackboard.");
    },
    handleRecordEnd () {
      // ask if the user wants to save/discard the recorded explanation 
      this.dialog = true; 
    },
    saveVideo () {
      this.dialog = false; 
      this.uploadExplanation(); 
    },
    discardAudio () {
      this.dialog = false; 
      this.incrementKeyToDestroy += 1; 
    }
  }
}
</script>

