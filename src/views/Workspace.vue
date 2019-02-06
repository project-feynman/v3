<template>
  <div id="workspace">
    <v-container fluid class="pa-0">
      <!-- <chat :ownerUid="$route.params.id"> -->
      <template v-if="user && workspace">
        <!-- <voice-chat :workspaceId="$route.params.id" :user="user"/> -->
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
                  <!-- SEE QUESTION BUTTON -->
                  <!-- <v-btn color="primary" dark @click="dialog = true">SEE QUESTION</v-btn>
                  <v-dialog v-model="dialog" max-width="290">
                    <v-card>
                      <v-card-title class="headline">
                        Question
                      </v-card-title>
                      <v-card-text>
                        {{ workspace.question }}
                      </v-card-text>
                      <v-card-actions>
                        <v-spacer></v-spacer>
                        <v-btn color="green darken-1" flat @click="dialog = false">OK</v-btn>
                      </v-card-actions>
                    </v-card>
                  </v-dialog> -->
                  <v-btn @click="clearWhiteboard()">
                    CLEAR WHITEBOARD
                  </v-btn>
                  <v-btn v-if="!isRecording" :disabled="!whiteboardReady" @click="startRecording()" color="pink white--text">
                    START VIDEO
                  </v-btn>
                  <v-btn v-else @click="stopRecording()" color="pink white--text">
                    STOP VIDEO
                  </v-btn>
                  <!-- <v-btn @click="toggleDisableTouch()">
                    {{ disableTouch ? "ENABLE TOUCH" : "DISABLE TOUCH"}}
                  </v-btn> -->
                  <v-btn @click="useEraser()">
                    USE ERASER
                  </v-btn>
                  <swatches v-model="color" :colors="colors" inline background-color="rgba(0, 0, 0, 0)" swatch-size="55" 
                            :wrapper-style="{ paddingTop: '0px', paddingBottom: '0px', paddingLeft: '40px', height: '30px' }">
                  </swatches>
                </template>
                <template v-else>

                <template style="margin: auto;">
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
        <!-- </chat> -->
    </v-container>
  </div>
</template>

<script>
import TestCanvas from '@/components/TestCanvas.vue'
import firebase from 'firebase/app'
import 'firebase/firestore'
import db from '@/database.js'
import Whiteboard from '@/components/Whiteboard.vue'
import SaveVideoPopup from '@/components/SaveVideoPopup.vue'
import BetaPopupButton from '@/components/BetaPopupButton.vue'
import AudioRecorder from '@/components/AudioRecorder.vue'
import VoiceChat from '@/components/VoiceChat.vue'
import Chat from '@/components/Chat.vue'
import Swatches from 'vue-swatches'
import "vue-swatches/dist/vue-swatches.min.css"

import { mapState } from 'vuex'

export default {
  components: {
    Whiteboard,
    SaveVideoPopup,
    AudioRecorder,
    VoiceChat,
    BetaPopupButton,
    TestCanvas,
    Swatches,
    Chat
  },
  computed: {
    ...mapState(['user'])
  },
  data() {
    return {
      saveVideoPopup: false,
      savePopup: false,
      whiteboardPopup: false,
      whiteboardReady: true,
      isRecording: false,
      ownerUid: null,
      disableTouch: true,
      newQuestion: null,
      workspace: null,
      newTitle: null,
      feedback: 'Tip: you can setup drawings before you start recording :]',
      dialog: false,
      loadCanvas: false,
      color: '#A463BF',
      lineWidth: 2,
      colors: ['#F64272', 'orange', '#A463BF']
    }
  },
  watch: {
    $route: {
      handler: 'bindVariables',
      immediate: true
    },
    user() {
      if (this.user) {
        const ref = db.collection('workspaces').doc(this.$route.params.id).collection('participants').doc(this.user.uid)
        const simpleUser = {
          name: this.user.name,
          uid: this.user.uid,
					timestamp: Math.round((new Date()).getTime() / 1000)
        }
        ref.set(simpleUser) 
      }
    },
    color() {
      // bad - high surface area for bugs 
      if (this.color != 'rgb(192, 230, 253)') {
        this.lineWidth = 2
      }
    }
  },
  created() {
    setTimeout(() => this.loadCanvas = true, 2000)
  },
  methods: {
    clearWhiteboard() {
      const whiteboard = this.$refs['whiteboard']
      if (whiteboard) {
        whiteboard.deleteStrokesSubcollection()
      }
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
      if (whiteboard) { whiteboard.quickplay() }
    },
    async saveFileReference({ url, path }) {
      const ref = db.collection('workspaces').doc(this.$route.params.id)
      await ref.update({
        audioURL: url,
        audioPath: path
      })
    },
    bindVariables() {
      this.ownerUid = this.$route.params.id
      const workspaceId = this.$route.params.id 
      this.$binding('workspace', db.collection('workspaces').doc(workspaceId))
    },
    async clearWorkspace() {
      // also update this because a new question is asked
      const whiteboard = this.$refs['whiteboard']
      if (whiteboard) {
        whiteboard.deleteStrokesSubcollection()
      }
      const ref = db.collection('workspaces').doc(this.$route.params.id)
      await ref.update({
        question: '', 
        isAnswered: false,
        answerAccepted: false,
      })
    },
    getHint() {
      return 'After submitting the question, your TA will be notified to answer ASAP'
    },
    async submitQuestion() {
      const content = this.newQuestion
      this.newQuestion = null 
      const ref = db.collection('workspaces').doc(this.$route.params.id)
      await ref.update({
        question: content 
      })
    },
    async handleSaving(videoTitle) { 
      // save aspect ratio
      const whiteboard = this.$refs['whiteboard']
      const heightToWidthRatio = whiteboard.getHeightToWidthRatio()
      console.log('aspectRatio =', heightToWidthRatio)
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
