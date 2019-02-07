<template>
  <div id="workspace">
    <v-container fluid class="pa-0">
      <template v-if="user && workspace">
        <v-layout align-center justify-center row fill-height wrap>
          <div class="text-xs-center">
          <v-btn @click="whiteboardPopup = true" color="pink white--text">
            Use Whiteboard
          </v-btn>
        </div>
          </v-layout>
        <v-dialog v-model="whiteboardPopup" fullscreen hide-overlay>
          <v-card v-if="whiteboardPopup">
            <v-toolbar id="whiteboard-toolbar" color="grey">
              <v-toolbar-title class="white--text">Whiteboard</v-toolbar-title>
              <v-spacer></v-spacer>
              <v-toolbar-items>
                <template v-if="!workspace.isAnswered">
                  <swatches v-model="color" :colors="colors" inline background-color="rgba(0, 0, 0, 0)" swatch-size="55" 
                            :wrapper-style="{ paddingTop: '0px', paddingBottom: '0px', paddingLeft: '40px', height: '30px' }">
                  </swatches>
                  <v-btn @click="useEraser()">
                    USE ERASER
                  </v-btn>
                  <v-btn @click="clearWhiteboard()">
                    CLEAR WHITEBOARD
                  </v-btn>
                  <v-btn v-if="!isRecording" @click="startRecording()" color="pink white--text">
                    START VIDEO
                  </v-btn>
                  <v-btn v-else @click="stopRecording()" color="pink white--text">
                    STOP VIDEO
                  </v-btn>
                  <!-- <v-btn @click="toggleDisableTouch()">
                    {{ disableTouch ? "ENABLE TOUCH" : "DISABLE TOUCH"}}
                  </v-btn> -->
                </template>
                <template v-else>
                  <v-btn @click="quickplay()">
                    PREVIEW
                  </v-btn>
                  <v-btn @click="retryAnswer()">
                    RETRY 
                  </v-btn>
                  <v-btn @click="saveVideoPopup = true" class="pink white--text">
                    SAVE VIDEO
                  </v-btn>
                  <save-video-popup v-model="saveVideoPopup"
                                    @pre-save-explanation="videoTitle => handleSaving(videoTitle)"
                                    fullscreen
                  />
                </template>
                <v-btn dark flat @click="whiteboardPopup = false">EXIT</v-btn>
              </v-toolbar-items>
            </v-toolbar>
            <whiteboard
                        v-if="loadCanvas"
                        ref="whiteboard"
                        :workspaceID="workspace['.key']"
                        :workspace="workspace" 
                        :isRecording="isRecording"
                        :isAnswered="workspace.isAnswered"
                        :disableTouch="disableTouch"
                        :color="color"
                        :colors="colors"
                        :lineWidth="lineWidth">
            </whiteboard>
            <audio-recorder v-show="false"
                            ref="audio-recorder"
                            :audioURL="workspace.audioURL"
                            :audioPath="workspace.audioPath"
                            @start-recording="isRecording = true" 
                            @end-recording="isRecording = false"
                            @file-uploaded="audio => saveFileReference(audio)"/>
            </v-card>
          </v-dialog>
        </template>
    </v-container>
  </div>
</template>

<script>
import firebase from 'firebase/app'
import 'firebase/firestore'
import db from '@/database.js'
import Whiteboard from '@/components/Whiteboard.vue'
import SaveVideoPopup from '@/components/SaveVideoPopup.vue'
import AudioRecorder from '@/components/AudioRecorder.vue'
import Swatches from 'vue-swatches'
import "vue-swatches/dist/vue-swatches.min.css"

import { mapState } from 'vuex'

export default {
  components: {
    Whiteboard,
    SaveVideoPopup,
    AudioRecorder,
    Swatches
  },
  computed: {
    ...mapState(['user'])
  },
  data() {
    return {
      saveVideoPopup: false,
      whiteboardPopup: false,
      isRecording: false,
      disableTouch: true,
      workspace: null,
      loadCanvas: false,
      color: '#F64272',
      lineWidth: 2,
      colors: ['#F64272', 'orange', '#A463BF']
    }
  },
  watch: {
    $route: {
      handler: 'bindVariables',
      immediate: true
    },
    color() {
      // bad - high surface area for bugs 
      if (this.color != 'rgb(192, 230, 253)') {
        this.lineWidth = 2
      }
    }
  },
  created() {
    // necessary for canvas to not be invisible during initial render
    setTimeout(() => this.loadCanvas = true, 0)
  },
  methods: {
    clearWhiteboard() {
      const whiteboard = this.$refs['whiteboard']
      whiteboard.deleteStrokesSubcollection()
    },
    toggleDisableTouch() {
      this.disableTouch = !this.disableTouch
    },
    useEraser() {
      this.color = 'rgb(192, 230, 253)'
      this.lineWidth = 18
    },
    async retryAnswer() {
      const whiteboard = this.$refs['whiteboard']
      whiteboard.currentTime = 0 
      const ref = db.collection('workspaces').doc(this.$route.params.id)
      await ref.update({
        isAnswered: false
      })
    },
    startRecording() {
      const audioRecorder = this.$refs['audio-recorder']
      this.isRecording = true 
      audioRecorder.startRecording()
    },
    stopRecording() {
      const whiteboard = this.$refs['whiteboard']
      const audioRecorder = this.$refs['audio-recorder']
      whiteboard.removeTouchEvents()
      audioRecorder.stopRecording()
      this.isRecording = false
      const ref = db.collection('workspaces').doc(this.$route.params.id)
      ref.update({
        isAnswered: true
      })
    },
    playVideo() {
      const audioRecorder = this.$refs['audio-recorder']
      const whiteboard = this.$refs['whiteboard']
      whiteboard.sortStrokesByTimestamp()
      whiteboard.playVisual(audioRecorder.getAudioTime)
      if (audioRecorder) { audioRecorder.playAudio() } 
    },
    quickplay() {
      const whiteboard = this.$refs['whiteboard']
      whiteboard.quickplay() 
    },
    async saveFileReference({ url, path }) {
      const ref = db.collection('workspaces').doc(this.$route.params.id)
      await ref.update({
        audioURL: url,
        audioPath: path
      })
    },
    bindVariables() {
      const workspaceId = this.$route.params.id 
      this.$binding('workspace', db.collection('workspaces').doc(workspaceId))
    },
    async handleSaving(videoTitle) { 
      const whiteboard = this.$refs['whiteboard']
      const heightToWidthRatio = whiteboard.getHeightToWidthRatio()
      const docRef = await db.collection('explanations').add({
        title: videoTitle,
        question: this.workspace.question || "Anonymous",
        authorUid: this.user.uid || "Anonymous",
        authorName: this.user.name || "Anonymous",
        teacherUid: this.$route.params.teacher_id || "Anonymous",
        heightToWidthRatio
      })
      // now strokes can be saved as subcollections to that document 
      const audioRecorder = this.$refs['audio-recorder']
      audioRecorder.saveAudio(docRef.id)
      whiteboard.saveStrokes(docRef.id)
    }
  }
}
</script>
