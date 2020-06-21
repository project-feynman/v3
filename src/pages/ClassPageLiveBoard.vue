<template>
  <div id="room">
    <template v-if="user">
      <LiveBoardAudio :roomId="roomId"/>
      <p v-if="!hasFetchedStrokesFromDb">Loading the real-time blackboard...</p>
      <Blackboard v-else
        ref="Blackboard"
        isRealtime
        :strokesArray="strokesArray"
        @stroke-drawn="stroke => uploadToDb(stroke)"
        @board-reset="deleteAllStrokesFromDb()"
      >
        <template v-slot:blackboard-toolbar>
          <ButtonNew @click="uploadExplanation()" icon="mdi-upload">Save Board</ButtonNew>
        </template>
      </Blackboard> 
    </template>
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
 *     Momentarily, there will be divergence between state and UI:
 *     the user's `strokesArray` does NOT have the new stroke, even though she was the one who drew the stroke.
 *     However, when the write operation finally resolves, everyone's `strokesArray` will be updated, 
 *     including the original author herself. Note that there will be double drawing, where the first is for feedback,
 *     and the second is to signal when other people can actually see her new stroke. 
 */
import firebase from "firebase/app";
import "firebase/firestore";
import Blackboard from "@/components/Blackboard.vue";
import LiveBoardAudio from "@/components/LiveBoardAudio.vue";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import ExplUploadHelpers from "@/mixins/ExplUploadHelpers.js";
import db from "@/database.js";
import ButtonNew from "@/components/ButtonNew.vue";
import { mapState } from "vuex";
import { getRandomId } from "@/helpers.js";

export default {
  components: { 
    ButtonNew,
    Blackboard,
    LiveBoardAudio,
  },
  mixins: [
    DatabaseHelpersMixin,
    ExplUploadHelpers
  ],
  data () {
    return {
      strokesArray: [],
      room: {},
      roomRef: null,
      strokesRef: null,
      unsubscribeRoomListener: null,
      classId: this.$route.params.class_id,
      roomId: this.$route.params.room_id,
      hasFetchedStrokesFromDb: false
    }
  },
  computed: {
    ...mapState([
      "user",
      "mitClass"
    ]),
    simplifiedUser () {
      if (!this.user) return; 
      return {
        email: this.user.email,
        uid: this.user.uid,
        firstName: this.user.firstName,
        lastName: this.user.lastName
      }
    }
  },
  async created () {
    this.roomRef = db.doc(`classes/${this.classId}/blackboards/${this.roomId}`);
    this.strokesRef = this.roomRef.collection("strokes");
    this.room = await this.$_getDoc(this.roomRef);
    this.setUserDisconnectHook();
    this.keepSyncingBoardWithDb();
  },
  beforeDestroy () {
    if (this.unsubscribeRoomListener) {
      this.unsubscribeRoomListener();
    }
    this.roomRef.update({
      participants: firebase.firestore.FieldValue.arrayRemove(this.simplifiedUser)
    });
  },
  methods: {
    async uploadExplanation () {
      const { TextEditor, Blackboard } = this.$refs;
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
      )
    },
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
      promises.push(
        this.roomRef.update({ imageUrl: "" })
      );
      await Promise.all(promises);
      this.$root.$emit("show-snackbar", "Successfully reset blackboard.");
    },
    /**
     * Push the user object onto the room's `participants` array, and ensures that 
     * Firebase will remove the user object if he/she disconnects for whatever reason.
     * 
     * @see https://explain.mit.edu/class/mDbUrvjy4pe8Q5s5wyoD/posts/2srLvmhGXPVtmgNyNeCH
     * @see https://firebase.google.com/docs/firestore/solutions/presence
     * @see https://firebase.google.com/docs/database/web/offline-capabilities
     */
    setUserDisconnectHook () {
      // ".info/connected" is a special location on Firebase Realtime Database 
      // that keeps track of whether the current client is conneceted or disconnected (see doc above)
      firebase.database().ref(".info/connected").on("value", async (snapshot) => {
        const isUserConnected = snapshot.val(); 
        if (isUserConnected === false) return; 
        const firebaseRef = firebase.database().ref(`/room/${this.classId}/${this.roomId}`);
        await firebaseRef.onDisconnect().set(this.simplifiedUser);
        this.roomRef.update({ // it's much faster to update Firestore directly
          participants: firebase.firestore.FieldValue.arrayUnion(this.simplifiedUser)
        });
        firebaseRef.set({ // Firebase will not detect change if it's set to an empty object
          email: "", 
          uid: "", 
          firstName: "" 
        });
      });
    }
  }
};
</script>
