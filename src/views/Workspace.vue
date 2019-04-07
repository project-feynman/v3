<template>
  <div id="workspace">
    <v-container v-if="user && workspace && whiteboard" fluid class="pa-0">
      <!-- <div class="text-xs-center">{{ workspace.members }}</div> -->
      <whiteboard
          v-if="loadCanvas"
          ref="whiteboard"
          :whiteboardID="workspace.whiteboardID"
          :workspace="workspace"
          :isRecording="isRecording"
          :isAnswered="whiteboard.isAnswered"
          :disableTouch="disableTouch"
          :color="color"
          :colors="colors"
          :lineWidth="lineWidth"
      ></whiteboard>
      <!-- <v-layout align-center justify-center row fill-height wrap>
        <div class="text-xs-center">
          <v-btn @click="whiteboardPopup = true" color="pink white--text">USE WHITEBOARD</v-btn>
        </div>
      </v-layout> -->
      <v-dialog v-model="whiteboardPopup" fullscreen hide-overlay>
        <v-card v-if="whiteboardPopup">
          <v-toolbar id="whiteboard-toolbar" color="grey">
            <v-spacer></v-spacer>
            <v-toolbar-items>
              <template v-if="!whiteboard.isAnswered">
                <swatches
                  v-model="color"
                  :colors="colors"
                  inline
                  background-color="rgba(0, 0, 0, 0)"
                  swatch-size="55"
                  :wrapper-style="{ paddingTop: '0px', paddingBottom: '0px', paddingLeft: '40px', height: '30px' }"
                ></swatches>
                <v-btn @click="useEraser()">ERASER</v-btn>
                <v-btn @click="clearWhiteboard()">CLEAR BOARD</v-btn>
                <v-btn
                  @click="toggleDisableTouch()"
                >{{ disableTouch ? "ENABLE TOUCH" : "DISABLE TOUCH"}}</v-btn>
                <v-btn
                  v-if="!isRecording"
                  @click="startRecording()"
                  color="pink white--text"
                >START VIDEO</v-btn>
                <v-btn v-else @click="stopRecording()" color="pink white--text">STOP VIDEO</v-btn>
              </template>
              <template v-else>
                <v-btn @click="quickplay()">PREVIEW</v-btn>
                <v-btn @click="retryAnswer()">RETRY</v-btn>
                <v-btn @click="saveVideoPopup = true" class="pink white--text">SAVE VIDEO</v-btn>
                <save-video-popup
                  v-model="saveVideoPopup"
                  @pre-save-explanation="videoTitle => handleSaving(videoTitle)"
                  fullscreen
                />
              </template>
              <v-btn dark flat @click="handleExit()">EXIT</v-btn>
            </v-toolbar-items>
          </v-toolbar>
          <whiteboard
            v-if="loadCanvas"
            ref="whiteboard"
            :whiteboardID="workspace.whiteboardID"
            :workspace="workspace"
            :isRecording="isRecording"
            :isAnswered="whiteboard.isAnswered"
            :disableTouch="disableTouch"
            :color="color"
            :colors="colors"
            :lineWidth="lineWidth"
          ></whiteboard>
          <audio-recorder
            v-show="false"
            ref="audio-recorder"
            :audioURL="workspace.audioURL"
            :audioPath="workspace.audioPath"
            @start-recording="isRecording = true"
            @file-uploaded="audio => saveFileReference(audio)"
          />
        </v-card>
      </v-dialog>
      <!-- VIDEO PLAYER -->
      <!-- <doodle-video ref="doodle-video"
                      :audioURL="workspace.audioURL" 
                      :workspaceId="$route.params.id">     
      </doodle-video>-->
    </v-container>
  </div>
</template>

<script>
import firebase from "firebase/app";
import "firebase/firestore";
import db from "@/database.js";
import Whiteboard from "@/components/Whiteboard.vue";
import SaveVideoPopup from "@/components/SaveVideoPopup.vue";
import AudioRecorder from "@/components/AudioRecorder.vue";
import DoodleVideo from "@/views/DoodleVideo.vue";
import Swatches from "vue-swatches";
import "vue-swatches/dist/vue-swatches.min.css";
import slugify from "slugify";

import { mapState } from "vuex";

export default {
  components: {
    Whiteboard,
    SaveVideoPopup,
    AudioRecorder,
    Swatches,
    DoodleVideo
  },
  computed: {
    ...mapState(["user"])
  },
  data() {
    return {
      saveVideoPopup: false,
      whiteboardPopup: false,
      isRecording: false,
      disableTouch: false,
      workspace: null,
      whiteboard: null,
      whiteboardRef: null,
      loadCanvas: false,
      color: "#F64272",
      lineWidth: 2,
      colors: ["#F64272", "orange", "#A463BF"],
      prevWorkspaceRef: null
    };
  },
  watch: {
    $route: {
      handler: "bindVariables",
      immediate: true
    },
    color() {
      // bad - high surface area for bugs
      if (this.color != "rgb(192, 230, 253)") {
        this.lineWidth = 2;
      }
    }
  },
  created() {
    // necessary for canvas to not be invisible during initial render
    setTimeout(() => (this.loadCanvas = true), 0);
  },
  // beforeDestroy() {
  //   console.log("beforeDestroy()");
  // },
  methods: {
    handleExit() {
      this.whiteboardPopup = false;
      this.$root.$emit("whiteboard-closed");
    },
    clearWhiteboard() {
      const whiteboard = this.$refs["whiteboard"];
      whiteboard.deleteStrokesSubcollection();
    },
    toggleDisableTouch() {
      this.disableTouch = !this.disableTouch;
    },
    useEraser() {
      this.color = "rgb(192, 230, 253)";
      this.lineWidth = 18;
    },
    async retryAnswer() {
      const whiteboard = this.$refs["whiteboard"];
      whiteboard.currentTime = 0;
      await this.whiteboardRef.update({
        isAnswered: false
      });
    },
    startRecording() {
      const audioRecorder = this.$refs["audio-recorder"];
      this.isRecording = true;
      audioRecorder.startRecording();
    },
    stopRecording() {
      this.isRecording = false;
      const whiteboard = this.$refs["whiteboard"];
      const audioRecorder = this.$refs["audio-recorder"];
      whiteboard.removeTouchEvents();
      audioRecorder.stopRecording();
      this.whiteboardRef.update({
        isAnswered: true
      });
    },
    playVideo() {
      const audioRecorder = this.$refs["audio-recorder"];
      const whiteboard = this.$refs["whiteboard"];
      whiteboard.sortStrokesByTimestamp();
      whiteboard.playVisual(audioRecorder.getAudioTime);
      audioRecorder.playAudio();
    },
    quickplay() {
      const whiteboard = this.$refs["whiteboard"];
      whiteboard.quickplay();
    },
    async saveFileReference({ url, path }) {
      // console.log('saveFileReference()')
      await this.whiteboardRef.update({
        audioURL: url,
        audioPath: path
      });
    },
    async bindVariables() {
      if (this.prevWorkspaceRef) {
        // otherwise without re-rendering, there are two cases
        // 1) user closes the window or just leaves completely
        // 2) the user switched to another workspace
        // 3) component is destroyed
        await this.prevWorkspaceRef.update({
          members: firebase.firestore.FieldValue.arrayRemove(this.user)
        })
      }
      const userUID = this.$route.params.id;
      const classID = this.$route.params.class_id;
      const workspaceRef = db.collection("classes").doc(classID).collection("workspaces").doc(userUID);
      await this.$binding("workspace", workspaceRef);
      this.whiteboardRef = db.collection("whiteboards").doc(this.workspace.whiteboardID)
      this.$binding("whiteboard", this.whiteboardRef)
      // now show participants
      await workspaceRef.update({
        members: firebase.firestore.FieldValue.arrayUnion(this.user)
      })
      this.prevWorkspaceRef = workspaceRef;
      // console.log("this.workspace.members =", this.workspace.members);
    },
    async handleSaving(videoTitle) {
      // create a new explanation document that points to the whiteboard
      const whiteboard = this.$refs["whiteboard"];
      const classID = this.$route.params.class_id;
      const videoID = slugify(videoTitle, {
        replacement: "-",
        lower: true
      });
      const docRef = await db.collection('classes').doc(classID).collection('videos').doc(videoID);
      docRef.set({
        title: videoTitle,
        whiteboardID: this.workspace.whiteboardID,
        authorUid: this.user.uid || "Anonymous",
        authorName: this.user.name || "Anonymous"
      });
      // initialize a new whiteboard for the workspace
      const audioRecorder = this.$refs["audio-recorder"]
      const newWhiteboardRef = await db.collection("whiteboards").add({ isAnswered: false })
      const workspaceRef = db.collection('classes').doc(classID).collection('workspaces').doc(this.user.uid)
      workspaceRef.update({
        whiteboardID: newWhiteboardRef.id
      });
      this.$root.$emit("audio-uploaded", docRef.id);
    }
  }
};
</script>
