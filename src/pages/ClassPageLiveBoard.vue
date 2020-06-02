<template>
  <div id="room">
    <template v-if="user">
      <LiveBoardAudio :roomId="roomId"/>
      <Blackboard 
        @stroke-drawn="(stroke) => uploadToDb(stroke)"
        @board-reset="deleteAllStrokesFromDb()"
        ref="Blackboard"
        :isRealtime="true"
      >
        <template v-slot:blackboard-toolbar>
          <ButtonNew icon="mdi-upload" disabled>
            Save Board
          </ButtonNew>
        </template>
        <template v-slot:database-listener="{ 
          drawStrokeOnCanvas, 
          resetBoard 
        }"
        >
          <RenderlessListenToBlackboard
            :blackboardId="roomId"
            @initial-strokes-fetched="(initialStrokes) => renderOnCanvas(initialStrokes, drawStrokeOnCanvas)"
            @new-stroke-from-db="(stroke) => renderIfNotByMe(stroke, drawStrokeOnCanvas)"
            @db-wiped="resetBoard()"
            ref="RenderlessListener"
          >
          </RenderlessListenToBlackboard>
        </template> 
      </Blackboard> 
    </template>
  </div>
</template>

<script>
import firebase from "firebase/app";
import "firebase/firestore";
import TheAppBar from "@/components/TheAppBar.vue";
import Blackboard from "@/components/Blackboard.vue";
import BlackboardToolBar from "@/components/BlackboardToolBar.vue";
import LiveBoardAudio from "@/components/LiveBoardAudio.vue";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import RenderlessListenToBlackboard from "@/components/RenderlessListenToBlackboard.vue";
import db from "@/database.js";
import ButtonNew from "@/components/ButtonNew.vue";

export default {
  components: { 
    TheAppBar,
    ButtonNew,
    Blackboard,
    BlackboardToolBar,
    LiveBoardAudio,
    RenderlessListenToBlackboard
  },
  mixins: [
    DatabaseHelpersMixin
  ],
  data () {
    return {
      room: {},
      unsubscribeRoomListener: null,
      classId: this.$route.params.class_id,
      roomId: this.$route.params.room_id
    }
  },
  computed: {
    user () { 
      return this.$store.state.user; 
    },
    simpleUser () {
      if (!this.user) return; 
      return {
        email: this.user.email,
        uid: this.user.uid,
        firstName: this.user.firstName
      }
    }
  },
  async created () {
    this.roomRef = db.doc(`classes/${this.classId}/blackboards/${this.roomId}`);
    this.room = await this.$_getDoc(this.roomRef);
    this.setUserDisconnectHook();
  },
  beforeDestroy () {
    if (this.unsubscribeRoomListener) {
      this.unsubscribeRoomListener();
    }
    this.roomRef.update({
      participants: firebase.firestore.FieldValue.arrayRemove(this.simpleUser)
    });
  },
  methods: {
    renderOnCanvas (strokesArray, drawStrokeOnCanvas) {
      for (let stroke of strokesArray) {
        drawStrokeOnCanvas(stroke);
      }
    },
    async uploadToDb (stroke) {
      const timestamp = firebase.firestore.FieldValue.serverTimestamp();
      const strokesRef = this.roomRef.collection("strokes");
      try {
        strokesRef.add({
          timestamp,
          ...stroke
        });
      } catch (error) {
        this.$root.$emit("snow-snackbar", "Failed to upload stroke to database.");
      }
    },
    renderIfNotByMe (newStroke, drawStrokeOnCanvas) {
      // TODO: don't duplicate the drawings
      // const localStrokes = this.$refs.Blackboard.getStrokesArray();
      drawStrokeOnCanvas(newStroke, false); // not an instant stroke
    },
    async deleteAllStrokesFromDb () {
      const strokesArray = this.$refs.RenderlessListener.getStrokesArray();
      const strokeDeleteRequests = [];

      for (let stroke of strokesArray) {
        const ref = this.roomRef.collection("strokes").doc(stroke.id);
        strokeDeleteRequests.push(ref.delete());
      }
      const backgroundResetRequest = this.roomRef.update({ imageUrl: "" });

      await Promise.all([
        ...strokeDeleteRequests, 
        backgroundResetRequest
      ]);
      this.$root.$emit("show-snackbar", "Successfully reset blackboard.");
    },
    setUserDisconnectHook () {
      /*
        Firebase Realtime Database provides a special location at /.info/connected 
        which is updated every time the Firebase Realtime Database client's connection state changes. 
        https://firebase.google.com/docs/database/web/offline-capabilities
      */
      firebase.database().ref(".info/connected").on("value", async (snapshot) => {
        const isUserConnected = snapshot.val(); 
        if (isUserConnected === false) { return; }
        // first ensure `onDisconnect` hook is successfully processed 
        const firebaseRef = firebase.database().ref(`/room/${this.classId}/${this.roomId}`);
        // 1. User leaves, and his/her identity is saved to Firebase
        // 2. Firestore detects the new user in Firebase, and uses that information to `arrayRemove` the user from the room

        // step 1 (step 2 is executed in Cloud Functions)
        await firebaseRef.onDisconnect().set(this.simpleUser);
        
        // now join the room 
        this.roomRef.update({ // it's much faster to update Firestore directly
          participants: firebase.firestore.FieldValue.arrayUnion(this.simpleUser)
        });
        firebaseRef.set({ 
          email: "", 
          uid: "", 
          firstName: "" 
        }); 
        // Firebase will not detect change if it's set to an empty object
      });
    }
  }
};
</script>
