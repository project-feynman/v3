<template>
  <div id="workspace">
    <v-container fluid class="pa-0">
      <template v-if="user && workspace">
        <!-- INITIAL STATE-->
        <template v-if="!workspace.question">
          <!-- QUESTION AREA -->
          <v-layout style="width: 92%; margin: auto;" class="pt-5">
            <v-flex>
              <v-textarea
                name="input-7-1"
                label="Question Area"
                v-model="newQuestion"
                :hint="getHint()"
                class="mb-2"
              ></v-textarea>
              <v-btn block @click="submitQuestion()">SUBMIT QUESTION</v-btn>
            </v-flex>
          </v-layout>
        </template>

        <!-- QUESTION ASKED -->
        <template v-else>
          <!-- <p class="body-2" style="text-align: center;">
            {{ workspace.question }}
          </p> -->
          <!-- <voice-chat :user="user" :workspaceId="$route.params.id"/> -->
          <!-- HIDDEN AUDIO RECORDER -->
          <audio-recorder v-show="false"
                  ref="audio-recorder"
                  :audioURL="workspace.audioURL"
                  :audioPath="workspace.audioPath"
                  @start-recording="isRecording = true" 
                  @end-recording="isRecording = false"
                  @file-uploaded="audio => saveFileReference(audio)"/>

     
            <!-- <p style="text-align: center;">{{ feedback }}</p> -->
     

          <!-- WHITEBOARD -->
          <whiteboard v-if="ownerUid" 
                      ref="whiteboard"
                      @whiteboard-cleared="handleWhiteboardClear()"
                      :ownerUid="ownerUid" 
                      :workspace="workspace" 
                      :showButtons="false"
                      :isRecording="isRecording"
                      :isAnswered="workspace.isAnswered"
                      :parentHeight="parentHeight">
            <v-layout v-if="!workspace.isAnswered" id="whiteboard-buttons-layout">
              <div style="margin: auto;" v-if="!workspace.isAnswered">
                <v-btn>
                  SHOW QUESTION
                </v-btn>
                <v-btn @click="useEraser()">
                  USE ERASER
                </v-btn>
                <v-btn v-if="!isRecording" @click="$root.$emit('toggle-navbar')">
                  TOGGLE FULLSCREEN
                </v-btn>
                <!-- <true-popup-button>
                  <template slot="text">
                    {{ workspace.question }}
                  </template>
                  <template slot="button">
                    <v-btn @click="dialog = false">BUTTON</v-btn>
                  </template>
                </true-popup-button> -->
                <v-btn v-if="!isRecording" :disabled="!whiteboardReady" @click="startRecording()" color="pink white--text">
                  START RECORDING
                </v-btn>
                <v-btn v-else @click="stopRecording()" color="pink white--text">
                  STOP RECORDING
                </v-btn>
              </div>
            </v-layout>
          
            <v-layout v-else id="whiteboard-buttons-layout">
              <div style="margin: auto;">
                <v-btn @click="playVideo()">
                  PLAY VIDEO
                </v-btn>
                <!-- <v-btn @click="quickplay()">
                  QUICKPLAY
                </v-btn> -->
                <v-btn @click="retryAnswer()">
                  RETRY ANSWER
                </v-btn>
                <!-- SAVE VIDEO-->
                <popup-button 
                  fullscreen :explanationTitle="newTitle" 
                  @input="newValue=> newTitle = newValue" 
                  @pre-save-explanation="handleSaving()"
                />
                <v-btn @click="clearWorkspace()">
                  RESET WORKSPACE
                </v-btn>
              </div>
            </v-layout>
          </whiteboard>

          </template>
        </template>
    </v-container>
  </div>
</template>

<script>
import firebase from 'firebase/app'
import 'firebase/firestore'
import db from '@/database'
// import Chat from '@/components/Chat'
import Whiteboard from '@/components/Whiteboard.vue'
import PopupButton from '@/components/PopupButton.vue'
import AudioRecorder from '@/components/AudioRecorder.vue'
import VoiceChat from '@/components/VoiceChat.vue'
import TruePopupButton from '@/components/TruePopupButton.vue'

import { mapState } from 'vuex'

export default {
  components: {
    // Chat,
    Whiteboard,
    PopupButton,
    AudioRecorder,
    VoiceChat,
    TruePopupButton
  },
  computed: {
    ...mapState(['user'])
  },
  data() {
    return {
      whiteboardReady: true,
      isRecording: false,
      ownerUid: null,
      newQuestion: null,
      workspace: null,
      newTitle: null,
      feedback: 'Tip: you can setup drawings before you start recording :]',
      parentHeight: 0
    }
  },
  watch: {
    $route: {
      handler: 'bindVariables',
      immediate: true
    }
  },
  methods: {
    useEraser() {
      const whiteboard = this.$refs['whiteboard']
      if (whiteboard) {
        whiteboard.useEraser()
      }
    },
    hideNavbar() {
      this.$root.$emit('toggle-navbar')
    },
    handleWhiteboardClear() {
      const whiteboard = this.$refs['whiteboard']
      if (whiteboard) {
        this.feedback = 'Initializing whiteboard...'
        whiteboard.initTouchEvents()
        whiteboard.currentTime = 0 
        this.feedback = 'Whiteboard ready!'
        this.whiteboardReady = true 
        setTimeout(() => this.feedback = 'Tip: you can setup drawings before you start recording :]', 1500)
      }
    },
    async retryAnswer() {
      this.whiteboardReady = false 
      this.feedback = 'Clearing whiteboard...'
      const whiteboard = this.$refs['whiteboard']
      if (whiteboard) {
        whiteboard.deleteStrokesSubcollection()
      }
      const ref = db.collection('workspaces').doc(this.$route.params.id)
      await ref.update({
        isAnswered: false
      })
    },
    startRecording() {
      // this.$root.$emit('close-navbar')
      const audioRecorder = this.$refs['audio-recorder']
      if (audioRecorder) {
        this.isRecording = true 
        audioRecorder.startRecording()
        this.feedback = 'Recording your strokes and audio...'
      }
    },
    stopRecording() {
      this.$root.$emit('open-navbar')
      const whiteboard = this.$refs['whiteboard']
      if (whiteboard) {
        whiteboard.removeTouchEvents()
      }
      const audioRecorder = this.$refs['audio-recorder']
      if (audioRecorder) {
        audioRecorder.stopRecording()
        this.isRecording = false
        this.submitAnswer()
      }
    },
    playVideo() {
      const audioRecorder = this.$refs['audio-recorder']
      const whiteboard = this.$refs['whiteboard']
      if (whiteboard) { whiteboard.playVisual() }
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
    async submitAnswer() {
      const ref = db.collection('workspaces').doc(this.$route.params.id)
      await ref.update({
        isAnswered: true
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
    async handleSaving() { 
      const docRef = await db.collection('explanations').add({
        title: this.newTitle,
        question: this.workspace.question,
        authorUid: this.user.uid,
        authorName: this.user.name,
        teacherUid: this.$route.params.teacher_id
      })
      // now strokes can be saved as subcollections to that document 
      const audioRecorder = this.$refs['audio-recorder']
      const whiteboard = this.$refs['whiteboard']
      audioRecorder.saveAudio(docRef.id)
      whiteboard.saveStrokes(docRef.id)
    }
  }
}
</script>
