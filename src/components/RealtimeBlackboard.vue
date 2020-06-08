<template>
  <p v-if="!hasFetchedStrokesFromDb">Loading the real-time blackboard...</p>
  <Blackboard v-else
    ref="Blackboard"
    isRealtime
    :strokesArray="strokesArray"
    @stroke-drawn="stroke => uploadToDb(stroke)"
    @board-reset="deleteAllStrokesFromDb()"
  >
    <template v-slot:blackboard-toolbar>
      <slot name="blackboard-toolbar">

      </slot> 
      <ButtonNew @click="uploadExplanation()" icon="mdi-upload">Save Board</ButtonNew>
    </template> 
  </Blackboard> 
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
 *     Momentarily, there will be divergence between state and UI:
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
      hasFetchedStrokesFromDb: false
    }
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
              ...change.doc.data()
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
        this.$root.$emit("snow-snackbar", "Failed to upload stroke to database.");
      }
    },
    async uploadExplanation () {
      const { Blackboard } = this.$refs;
      const title = `Untitled (${new Date().toLocaleTimeString()})`; 
      const html = "";
      const explRef = db.doc(`classes/${this.mitClass.id}/posts/${getRandomId()}`);
      const audioBlob = null; // TODO
      const thumbnailBlob = await Blackboard.getThumbnail();
      this.$_saveExplToCacheThenUpload(
        thumbnailBlob,
        audioBlob,
        html,
        title,
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
    }
  }
}
</script>

