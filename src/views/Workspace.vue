<template>
  <div class="student">
    <v-container fluid>
      <template v-if="user && workspace">
        <!-- INITIAL STATE-->
        <template v-if="!workspace.question">
          <!-- QUESTION AREA -->
          <v-layout>
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
          <!-- PAST ANSWERS -->
        </template>

        <!-- QUESTION ASKED -->
        <template v-else>
          <div style="text-align: center;">
            <p class="headline">{{ workspace.question }}</p>
          </div>

          <!-- HIDDEN AUDIO RECORDER -->
          <audio-recorder v-show="false"
                  ref="audio-recorder"
                  :audioURL="workspace.audioURL"
                  :audioPath="workspace.audioPath"
                  @start-recording="isRecording = true" 
                  @end-recording="isRecording = false"
                  @file-uploaded="audio => saveFileReference(audio)"/>

          <template v-if="!workspace.isAnswered">
            <v-layout>
              <div v-if="!workspace.isAnswered" style="margin: auto;">
                <v-btn v-if="!isRecording" @click="startRecording()">
                  START EXPLANATION
                </v-btn>
                <v-btn v-else @click="stopRecording()">
                  STOP RECORDING
                </v-btn>
              </div>
            </v-layout>
          </template>
          
          <v-layout v-else>
            <div style="margin: auto;">
              <v-btn @click="playVideo()">
                PLAY VIDEO
              </v-btn>
              <v-btn @click="quickplay()">
                QUICKPLAY
              </v-btn>
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
                NEW QUESTION
              </v-btn>
            </div>
          </v-layout>

          <!-- WHITEBOARD -->
          <whiteboard v-if="ownerUid" 
                      ref="whiteboard"
                      :ownerUid="ownerUid" 
                      :workspace="workspace" 
                      :showButtons="isRecording"
                      :isRecording="isRecording"/>

          </template>
        </template>
    </v-container>
  </div>
</template>

<script>
import firebase from 'firebase/app'
import 'firebase/firestore'
import db from '@/database'
import Chat from '@/components/Chat'
import Whiteboard from '@/components/Whiteboard'
import PopupButton from '@/components/PopupButton'
import AudioRecorder from '@/components/AudioRecorder'
import { mapState } from 'vuex'

export default {
  components: {
    Chat,
    Whiteboard,
    PopupButton,
    AudioRecorder
  },
  computed: {
    ...mapState(['user'])
  },
  data() {
    return {
      isRecording: false,
      ownerUid: null,
      newQuestion: null,
      workspace: null,
      newTitle: null,
    }
  },
  watch: {
    $route: {
      handler: 'bindVariables',
      immediate: true
    }
  },
  methods: {
    async retryAnswer() {
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
      const audioRecorder = this.$refs['audio-recorder']
      if (audioRecorder) {
        this.isRecording = true 
        audioRecorder.startRecording()
      }
    },
    stopRecording() {
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

<style>
.responsive-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(250px, 0.97fr));
	grid-gap: 30px;
	max-width: 90%;
	margin: 0 auto 30px;
}
</style>
