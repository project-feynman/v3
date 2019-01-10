<template>
  <div class="student">
    <!-- GREAT FOR DEBUGGING -->
    <!-- <h2 v-if="workspace">{{ workspace }}</h2> -->
    <v-container fluid>
      <v-layout wrap>
        <template v-if="user && workspace">
          <!-- question submitted already -->
          <p>{{ workspace.question }}</p>
          <!-- question has been answered -->
          <template v-if="workspace.isAnswered">
            <v-spacer></v-spacer>
            <popup-button 
              fullscreen :explanationTitle="newTitle" 
              @input="newValue=> newTitle = newValue" 
              @pre-save-explanation="handleSaving()"
            />
            <v-btn @click="clearWorkspace()">NEW QUESTION</v-btn>
          </template>
          <!-- no question yet  -->
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
          <!-- whiteboard -->
          <v-flex md12>
            <whiteboard v-if="ownerUid && workspace.isAskingQuestion || workspace.isAnswered" :ownerUid="ownerUid" :workspace="workspace"/>
          </v-flex>
        </template>
      </v-layout>
    </v-container>
  </div>
</template>

<script>
// a workspace document needs
// now, what is a workspace - it's just a question - and it can just be a property within the workspace that's really nice 
import firebase from 'firebase/app'
import 'firebase/firestore'
import db from '@/database'
import Chat from '@/components/Chat'
import Whiteboard from '@/components/Whiteboard'
import PopupButton from '@/components/PopupButton'
import { mapState } from 'vuex'

export default {
  components: {
    Chat,
    Whiteboard,
    PopupButton
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
  created() {
    // I know this is duplicated, but it's a quick-fix given the circumstances 
    this.ownerUid = this.$route.params.id
    const workspaceId = this.$route.params.id 
    this.$binding('workspace', db.collection('workspaces').doc(workspaceId))
  },
  watch: {
    $route(to, from) {
      this.ownerUid = this.$route.params.id
    }
  },
  methods: {
    async clearWorkspace() {
      const ref = db.collection('workspaces').doc(this.$route.params.id)
      await ref.update({
        question: '', 
        isAskingQuestion: false, 
        isAnswered: false,
      })
    },
    getHint() {
      // if (this.user.uid == this.$route.params.id) {
        return 'After submitting the question, your TA will be notified to answer ASAP'
      // } else {
      //   return 'Write an answer - aim for simplicity and elegance'
      // }
    },
    async submitQuestion() {
      const content = this.newMessage
      this.newMessage = null 
      // this.updateTableStatus(true)
      const ref = db.collection('workspaces').doc(this.$route.params.id)
      await ref.update({
        isAskingQuestion: true,
        question: content 
      })
      // this.addMessage()
    },
    async addMessage() {
      if (!this.newMessage) {
        return 
      }
      const content = this.newMessage
      this.newMessage = null
      const messagesRef = db.collection('tables').doc(this.ownerUid).collection('messages')
      await messagesRef.doc(`${this.messages.length + 1}`).set({
        content,
        author: this.author
      })
    },
    async handleSaving() {
      console.log('handleSaving called in Navbar.vue')
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