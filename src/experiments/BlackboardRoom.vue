<template>
  <div id="workspace">
    <v-container v-if="simpleUser && workspace" fluid class="pa-0">
      <p>workspace {{ workspace }}</p>
      <!-- "v-if="...workspace.whiteboardID"" needed because workspace goes from null to {} (surprisingly), before becoming fully populated -->
      <Blackboard
        v-if="loadCanvas && workspace.blackboardId"
        ref="whiteboard"
        :blackboardId="workspace.blackboardId"
        :isRealtime="true"
      />
    </v-container>
  </div>
</template>

<script>
import firebase from "firebase/app";
import "firebase/firestore";
import { mapState } from "vuex";
import db from "@/database.js";
import Blackboard from "@/components/Blackboard.vue";

export default {
  components: {
    Blackboard
  },
  computed: {
    ...mapState(["user"]),
    simpleUser () {
      if (!this.user) { return; } 
      return {
        email: this.user.email,
        uid: this.user.uid,
        firstName: this.user.firstName
      }
    },
    roomRef () {
      const roomId = this.$route.params.room_id;
      return db.collection("rooms").doc(roomId)
    }
  },
  data () {
    return {
      workspace: null,
      loadCanvas: false,
      prevWorkspaceRef: null,
    }
  },
  watch: {
    $route: {
      handler: "bindVariables",
      immediate: true
    }
  },
  created () {
    // necessary for canvas to not be invisible during initial render
    setTimeout(() => (this.loadCanvas = true), 0);
  },
  async beforeDestroy () {
    this.cleanUpPrevWorkspace(); // needed when the user switches to any other place besides another blackboard
  },
  methods: {
    async bindVariables () {
      if (this.prevWorkspaceRef) { await this.cleanUpPrevWorkspace(); }
      await this.$binding("workspace", this.roomRef);
      this.setDisconnectHook();
      this.prevWorkspaceRef = this.roomRef;
    },
    async cleanUpPrevWorkspace () {
      const promise = new Promise(async (resolve, reject) => {
        await this.prevWorkspaceRef.update({
          members: firebase.firestore.FieldValue.arrayRemove(this.simpleUser)
        });
        const workspaceDoc = await this.prevWorkspaceRef.get();
        if (workspaceDoc.data().members.length === 0) {
          await this.prevWorkspaceRef.update({
            hasAudioRoom: false
          });
        }
        resolve();
      });
      return promise;
    },
    setDisconnectHook () {
      const classId = this.$route.params.class_id;
      const roomId = this.$route.params.room_id;

      const firebaseclassId = classId.replace(".", "-");
      const firebaseRef = firebase.database().ref(`/workspace/${firebaseclassId}/${roomId}`);
      // mirror the Firebase workspace with the Firestore workspace
      firebase.database().ref(".info/connected").on("value", async snapshot => {
        if (snapshot.val() === false) { return; } 
        // wait till server successfully processes the onDisconnectHook()
        await firebaseRef.onDisconnect().set(this.simpleUser);
        this.roomRef.update({ // it's much faster to update Firestore directly
          members: firebase.firestore.FieldValue.arrayUnion(this.simpleUser)
        });
        // reset it (otherwise setting the user is not actually triggering any changes)
        firebaseRef.set({ // if I just reset it to a truly empty object, Firestore does not detect the change for some reason
          email: "",
          uid: "",
          firstName: ""
        });
      });
    },
    updateHasAudioRoom () {
      this.prevWorkspaceRef.update({ hasAudioRoom: true });
    }
  }
};
</script>
