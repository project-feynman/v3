<template>
  <div class="student">
    <v-container fluid>
      <v-layout wrap>
        <template v-if="user && workspace">
          <!-- EMPTY -->
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
              <v-btn @click="submitAnswer()" color="pink darken--1 white--text">SUBMIT ANSWER</v-btn>
            </template>
            <template v-else>
              <v-spacer></v-spacer>
              <!-- SAVE EXPLANATION -->
              <popup-button 
                fullscreen :explanationTitle="newTitle" 
                @input="newValue=> newTitle = newValue" 
                @pre-save-explanation="handleSaving()"
              />
              <!-- RESET WORKSPACE -->
              <v-btn @click="clearWorkspace()">NEW QUESTION</v-btn>
            </template>
            <!-- QUESTION ASKED, NEED ANSWER -->
            <!-- RECORD BUTTON -->
            <!-- <record-button/> -->
            <!-- SUBMIT ANSWER -->
             <!-- WHITEBOARD -->
            <v-flex md12>
              <whiteboard v-if="ownerUid" :ownerUid="ownerUid" :workspace="workspace" :showButtons="!workspace.isAnswered"/>
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
import RecordButton from '@/components/RecordButton'
import { mapState } from 'vuex'

export default {
  components: {
    Chat,
    Whiteboard,
    PopupButton,
    RecordButton
  },
  computed: {
    ...mapState(['user'])
  },
  data() {
    return {
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