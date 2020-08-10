<template>
  <div>
    <p v-if="!hasFetchedStrokesFromDb">Loading the real-time blackboard...</p>

    <!-- Blackboard -->
    <Blackboard v-else
      :strokesArray="strokesArray" @stroke-drawn="stroke => handleNewlyDrawnStroke(stroke)"
      isRealtime
      @mounted="({ getThumbnailBlob }) => blackboard.getThumbnailBlob = getThumbnailBlob"
      @update:currentTime="currentTime => blackboard.currentTime = currentTime"
      @update:bgImageBlob="blob => blackboard.bgImageBlob = blob"
      @update:audioBlob="blob => blackboard.audioBlob = blob"
      @record-end="handleRecordEnd()"
    >
      <template v-slot:blackboard-toolbar>
        <slot name="blackboard-toolbar">

        </slot> 
        <BaseButton @click="toggleChat()" icon="mdi-chat" :filled="messagesOpen">Chat</BaseButton>
        <BaseButton @click="uploadExplanation()" icon="mdi-upload">Save Blackboard</BaseButton>
      </template> 

      <!-- Wipe Board (overrides the normal, offline wiping behavior) -->
      <template v-slot:wipe-board-button-slot>
        <BasePopupButton actionName="Wipe board" @action-do="deleteAllStrokesFromDb()">
          <template v-slot:activator-button="{ on }">
            <BaseButton :on="on" icon="mdi-delete" data-qa="wipe-board">
              Wipe board
            </BaseButton>
          </template>
          <template v-slot:message-to-user>
            Are you sure you want to wipe everything?
          </template> 
        </BasePopupButton>
      </template>
    </Blackboard> 
    
    <!-- Popup for saving blackboard -->
    <v-dialog v-model="dialog" max-width="600">
      <v-card>
        <v-card-title class="headline">Save your recorded explanation?</v-card-title>
        <v-card-text>
          <v-text-field v-model="explTitle" placeholder="(Optional) Enter a title..."/>
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

    <!-- Realtime Messaging -->
    <RealtimeMessageChat
      v-model="messagesOpen"
      :roomParticipants="roomParticipants"
      :roomId="this.roomId"
      :classId="this.classId"
    />
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
 *     Whenever the user draw a new stroke, it will be pushed to `strokesArray` and uploaded to Firestore. 
 *     When the upload finishes, other people will detect the new stroke and update accordingly. 
 *     (Note the user will ignore the new stroke, since he/she drew the stroke in the first place.)
 */
import Blackboard from "@/components/Blackboard.vue"; 
import BaseButton from "@/components/BaseButton.vue"; 
import BasePopupButton from "@/components/BasePopupButton.vue";
import RealtimeMessageChat from "@/components/RealtimeMessageChat.vue";
import ExplUploadHelpers from "@/mixins/ExplUploadHelpers.js";
import firebase from "firebase/app"; 
import db from "@/database.js"; 
import { mapState } from "vuex"; 
import { getRandomId } from "@/helpers.js";

export default {
  props: {
    strokesRef: {
      type: null,
      required: true
    },
    roomParticipants: {
      type: null,
      required: true
    },
  },
  mixins: [
    ExplUploadHelpers
  ],
  components: {
    Blackboard,
    BaseButton,
    BasePopupButton,
    RealtimeMessageChat
  },
  data () {
    return {
      hasFetchedStrokesFromDb: false,
      strokesArray: [],
      blackboard: {
        bgImageBlob: null,
        audioBlob: null,
        getThumbnailBlob: null,
        currentTime: 0
      },
      removeBlackboardStrokesListener: null,
      dialog: false,
      explTitle: "",
      classId: this.$route.params.class_id,
      roomId: this.$route.params.room_id,
      messagesOpen: false,
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
  destroyed () {
    this.removeBlackboardStrokesListener();
  },
  methods: {
    /** 
    Known issues:
      1. [CRUCIAL] Investigate why each new stroke triggers 2-3 snapshot callbacks 
      2. If the board is wiped while someone else is drawing, it results in diverging states

      Overview of correctness argument: 
        - If database has fewer strokes than the client, it must mean the board was wiped
        - However, during the wiping process, other people could still be drawing 
        - Therefore, the correct response is to first wipe the board, then render drawings
          that other people made during the process (if any). 
      @see explain.mit.edu/class/mDbUrvjy4pe8Q5s5wyoD/posts/k8TLymX9Say5EUoCdxEp
    */
    keepSyncingBoardWithDb () {
      this.removeBlackboardStrokesListener = this.strokesRef.orderBy("timestamp").onSnapshot(async snapshot => {
        // CASE 1: wipe board operation
        const removedDocs = snapshot.docChanges().filter(change => change.type === "removed"); 
        if (removedDocs.length > 0) {
          this.$root.$emit("show-snackbar", "The board was wiped by someone.");
          // trigger <Blackboard/> to wipe the canvas UI via resetting `strokesArray` 
          this.strokesArray = []; 

          /* Wait 1 tick, otherwise <Blackboard/> can't react to `this.strokesArray = []`,
             because of Vue's reactivity caveat: "If the same watcher is triggered multiple times, it will be pushed into the queue only once."
             More info here: https://vuejs.org/v2/guide/reactivity.html */
          await this.$nextTick();

        /* If people added strokes while Firestore was still deleting documents,
           then the blackboard should NOT end up being empty. */
         if (snapshot.docs.length > 0) {
          snapshot.docs.forEach(doc => {
            this.strokesArray.push(
              this.convertDocToStroke(doc)
            );
          });
         }
        } 

        // CASE 2: add stroke operation
        else {
          // CASE 2a: stroke added by the user himself/herself
          if (snapshot.docs.length === this.strokesArray.length) {
            console.log("my own stroke")
            // do nothing
          } 

          // CASE 2b: stroke added by someone else 
          else {
            console.log("someone else's stroke");
            snapshot.docChanges().filter(change => change.type === "added").forEach(change => {
              this.strokesArray.push(
                this.convertDocToStroke(change.doc)
              );
            });
          }
        }
        if (!this.hasFetchedStrokesFromDb) { 
          this.hasFetchedStrokesFromDb = true;
        }
      });
    },
    /**
     * Artifically smooths out new strokes that were created by other people 
     * with a period of 1 second. 
     * 
     * Crucially, each strokesArray's timestamps are subjective i.e. based off of the user's currentTime,
     * unlike Firestore which keeps track of objective time. This is so that whoever records a video, the order of strokes will be the same as
     * what that user observed originally. 
    */ 
    convertDocToStroke (doc) {
      const strokeObject = {
        id: doc.id,
        ...doc.data(),
      };
      // make the timestamp subjective
      strokeObject.startTime = this.blackboard.currentTime; 
      strokeObject.endTime = this.blackboard.currentTIme; 

      if (!doc.data().isErasing) {
        // artifically add a 1 second period to the stroke
        strokeObject.endTime += 1;
      } 
      return strokeObject;
    },
    /**
     * Helps maintain the invariant that UI => RealtimeBlackboard's strokesArray,
     * and uploads the new stroke to Firestore.
     */
    handleNewlyDrawnStroke (stroke) {
      this.strokesArray.push(stroke); 
      this.uploadToDb(stroke);
    },
    async uploadToDb (stroke) {
      try {
        this.strokesRef.doc(stroke.id).set({
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          ...stroke
        });
      } 
      catch (error) {
        this.$root.$emit("show-snackbar", "Failed to upload stroke to database.");
      }
    },
    async uploadExplanation () {
      const thumbnailBlob = await this.blackboard.getThumbnailBlob();
      this.$_saveExplToCacheThenUpload({
        thumbnailBlob,
        audioBlob: this.blackboard.audioBlob,
        html: "",
        title: this.explTitle ? this.explTitle : `Untitled (${new Date().toLocaleTimeString()})`, 
        tags: [],
        explRef: db.doc(`classes/${this.mitClass.id}/posts/${getRandomId()}`)
      });
      this.explTitle = ""; 
    },
    async deleteAllStrokesFromDb () {
      console.log("deleteAllStrokesFromDb, strokesArray = ", this.strokesArray);
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
      console.log("finished deleting everything")
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
    },
    toggleChat () {
      this.messagesOpen = !this.messagesOpen;
    }
  }
}
</script>

