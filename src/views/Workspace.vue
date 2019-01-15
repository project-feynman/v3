<template>
  <div class="student">
    <v-container fluid>
      <v-layout wrap>
        <template v-if="user && workspace">
          <!-- INITIAL STATE-->
          <v-layout v-if="!workspace.question">
            <v-flex>
              <v-textarea
                name="input-7-1"
                label="Question Area"
                v-model="newMessage"
                :hint="getHint()"
                class="mb-2"
              ></v-textarea>
              <v-btn block @click="submitQuestion()">Submit Question</v-btn>
            </v-flex>
          </v-layout>
          <!-- QUESTION ANSWERED -->
          <template v-else>
            <p>{{ workspace.question }}</p>
            <template v-if="!workspace.isAnswered">
              <v-spacer/>
              <!-- PREVIEW VIDEO -->
              <v-btn @click="playVideo()">PREVIEW VIDEO</v-btn>

              <!-- SUBMIT ANSWER -->
              <v-btn @click="submitAnswer()" color="pink darken--1 white--text">SUBMIT ANSWER</v-btn>
            </template>
            <!-- AUDIO RECORDER -->
            <audio-recorder v-show="!workspace.isAnswered"
                            ref="audio-recorder"
                            :audioURL="workspace.audioURL"
                            :audioPath="workspace.audioPath"
                            @start-recording="isRecording = true" 
                            @end-recording="isRecording = false"
                            @file-uploaded="audio => saveFileReference(audio)"/>


    
            <template v-if="workspace.isAnswered">
              <v-spacer></v-spacer>
              <!-- PREVIEW VIDEO -->
              <v-btn @click="playVideo()">PREVIEW VIDEO</v-btn>

              <!-- SAVE EXPLANATION -->
              <popup-button 
                fullscreen :explanationTitle="newTitle" 
                @input="newValue=> newTitle = newValue" 
                @pre-save-explanation="handleSaving()"
              />

              <!-- RESET WORKSPACE -->
              <v-btn @click="clearWorkspace()">NEW QUESTION</v-btn>
            </template>

             <!-- WHITEBOARD -->
            <v-flex md12>
              <whiteboard v-if="ownerUid" 
                          ref="whiteboard"
                          :ownerUid="ownerUid" 
                          :workspace="workspace" 
                          :showButtons="!workspace.isAnswered"
                          :isRecording="isRecording"/>
            </v-flex>
          </template>
        </template>
      </v-layout>
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
      newMessage: null,
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
    playVideo() {
      const audioRecorder = this.$refs['audio-recorder']
      const whiteboard = this.$refs['whiteboard']
      if (whiteboard) { whiteboard.playVisual() }
      if (audioRecorder) { audioRecorder.playAudio() } 
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
        isAskingQuestion: false, 
        isAnswered: true
      })
    },
    bindVariables() {
      this.ownerUid = this.$route.params.id
      const workspaceId = this.$route.params.id 
      this.$binding('workspace', db.collection('workspaces').doc(workspaceId))
    },
    async clearWorkspace() {
      const ref = db.collection('workspaces').doc(this.$route.params.id)
      await ref.update({
        question: '', 
        isAskingQuestion: false, 
        isAnswered: false,
      })
    },
    getHint() {
      return 'After submitting the question, your TA will be notified to answer ASAP'
    },
    async submitQuestion() {
      const content = this.newMessage
      this.newMessage = null 
      const ref = db.collection('workspaces').doc(this.$route.params.id)
      await ref.update({
        isAskingQuestion: true,
        question: content 
      })
    },
    async handleSaving() { 
      const docRef = await db.collection('explanations').add({
        title: this.newTitle,
        question: this.workspace.question,
        author: 'Richard Feynman',
        teacherUid: this.$route.params.teacher_id
      })
      this.$root.$emit('save-explanation', docRef.id)
    }
  }
}
</script>