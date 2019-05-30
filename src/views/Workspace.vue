<template>
  <div id="workspace">
    <v-container v-if="user && workspace && whiteboard" fluid class="pa-0">
      <div class="text-xs-center">
        <div>workspace.hasAudioRoom = {{ workspace.hasAudioRoom }}</div>
      </div>
      <video-chat :hasAudioRoom="workspace.hasAudioRoom"
                  :workspaceID="workspace['.key']"
                  @open-room="updateHasAudioRoom()"/>

      <!-- THIS IS THE WHITEBOARD THAT IS NOT FULLSCREEN -->
      <whiteboard v-if="loadCanvas"
                  ref="whiteboard"
                  :hideToolbar="true"
                  :whiteboardID="workspace.whiteboardID"
                  :isRecording="isRecording"
                  :isAnswered="whiteboard.isAnswered"
                  :disableTouch="disableTouch"
                  @start-recording="startRecording()"
                  @stop-recording="stopRecording()"/>

      <!-- THIS IS THE FULLSCREEN WHITEBOARD -->
      <v-dialog v-model="whiteboardPopup" fullscreen hide-overlay>
        <v-card v-if="whiteboardPopup">
          <whiteboard v-if="loadCanvas"
                      ref="whiteboard"
                      :whiteboardID="workspace.whiteboardID"
                      :workspace="workspace"
                      :isRecording="isRecording"
                      :isAnswered="whiteboard.isAnswered"
                      :disableTouch="disableTouch"
                      @close-whiteboard="whiteboardPopup = false"
                      @start-recording="startRecording()"
                      @stop-recording="stopRecording()"/>

          <audio-recorder v-show="false"
                          ref="audio-recorder"
                          :audioURL="workspace.audioURL"
                          :audioPath="workspace.audioPath"
                          @start-recording="isRecording = true"
                          @file-uploaded="audio => saveFileReference(audio)"/>
        </v-card>
      </v-dialog>
    </v-container>
  </div>
</template>

<script>
import firebase from 'firebase/app'
import 'firebase/firestore'
import Swatches from 'vue-swatches'
import 'vue-swatches/dist/vue-swatches.min.css'
import slugify from 'slugify'
import { mapState } from 'vuex'
import db from '@/database.js'
import Whiteboard from '@/components/Whiteboard.vue'
import SaveVideoPopup from '@/components/SaveVideoPopup.vue'
import AudioRecorder from '@/components/AudioRecorder.vue'
import VideoChat from '@/components/VideoChat.vue'

export default {
  components: {
    Whiteboard,
    SaveVideoPopup,
    VideoChat,
    AudioRecorder,
    Swatches,
  },
  computed: {
    ...mapState(['user']),
    simpleUser () {
      return {
        email: this.user.email,
        uid: this.user.uid
      }
    }
  },
  data () {
    return {
      saveVideoPopup: false,
      saveSilently: false,
      whiteboardPopup: false,
      isRecording: false,
      disableTouch: true,
      workspace: null,
      whiteboard: null,
      whiteboardRef: null,
      loadCanvas: false,
      prevWorkspaceRef: null
    }
  },
  watch: {
    $route: {
      handler: 'bindVariables',
      immediate: true
    }
  },
  created () {
    // necessary for canvas to not be invisible during initial render
    setTimeout(() => (this.loadCanvas = true), 0)
    this.$root.$on('open-whiteboard', () => this.whiteboardPopup = true)
  },
  async beforeDestroy () {
    // when the user switches to any other place besides another workspace
    this.cleanUpPrevWorkspace()
  },
  methods: {
    saveDoodle () {
      this.saveSilently = true 
      this.saveVideoPopup = true
    },
    saveVideo () {
      this.saveSilently = false
      this.saveVideoPopup = true
    },
    async bindVariables () {
      const userUID = this.$route.params.id
      const classID = this.$route.params.class_id
      const workspaceRef = db.collection('classes').doc(classID).collection('workspaces').doc(userUID)
      
      if (this.prevWorkspaceRef) {
        await this.cleanUpPrevWorkspace()
      }

      await this.$binding('workspace', workspaceRef)
      this.whiteboardRef = db.collection('whiteboards').doc(this.workspace.whiteboardID)
      this.$binding('whiteboard', this.whiteboardRef)
      this.setDisconnectHook()
      this.prevWorkspaceRef = workspaceRef
    },
    async cleanUpPrevWorkspace () {
      const promise = new Promise(async (resolve, reject) => {
        await this.prevWorkspaceRef.update({
          members: firebase.firestore.FieldValue.arrayRemove(this.simpleUser)
        })
        const workspaceDoc = await this.prevWorkspaceRef.get()
        if (workspaceDoc.data().members.length == 0) {
          await this.prevWorkspaceRef.update({
            hasAudioRoom: false
          })
        }
        resolve()
      })
      return promise
    },
    setDisconnectHook () {
      const classID = this.$route.params.class_id 
      const workspaceID = this.$route.params.id
      const workspaceRef = db.collection('classes').doc(classID).collection('workspaces').doc(workspaceID)
      const firebaseClassID = classID.replace('.', '-')
      const firebaseRef = firebase.database().ref(`/workspace/${firebaseClassID}/${workspaceID}`)

      // mirror the Firebase workspace with the Firestore workspace
      firebase.database().ref('.info/connected').on('value', async snapshot => {
        if (snapshot.val() == false) { 
          // do nothing 
        } else {
          // wait till server successfully processes the onDisconnectHook()
          await firebaseRef.onDisconnect().set(this.simpleUser) 
          workspaceRef.update({ // it's much faster to update Firestore directly
            members: firebase.firestore.FieldValue.arrayUnion(this.simpleUser)
          })
          // reset it (otherwise setting the user is not actually triggering any changes)
          firebaseRef.set({ // if I just reset it to a truly empty object, Firestore does not detect the change for some reason
            email: '',
            uid: ''
          })
        }
      })
    },
    handleExit () {
      this.whiteboardPopup = false
      this.$root.$emit('whiteboard-closed')
    },
    clearWhiteboard () {
      const whiteboard = this.$refs['whiteboard']
      whiteboard.deleteStrokesSubcollection()
    },
    toggleDisableTouch () {
      this.disableTouch = !this.disableTouch
    },
    updateHasAudioRoom () {
      this.prevWorkspaceRef.update({
        hasAudioRoom: true
      })
    },
    startRecording () {
      const audioRecorder = this.$refs['audio-recorder']
      this.isRecording = true
      audioRecorder.startRecording()
    },
    stopRecording () {
      this.isRecording = false
      const whiteboard = this.$refs['whiteboard']
      const audioRecorder = this.$refs['audio-recorder']
      whiteboard.removeTouchEvents()
      audioRecorder.stopRecording()
      this.whiteboardRef.update({
        isAnswered: true
      })
    },
    playVideo () {
      const audioRecorder = this.$refs['audio-recorder']
      const whiteboard = this.$refs['whiteboard']
      whiteboard.sortStrokesByTimestamp()
      whiteboard.playVisual(audioRecorder.getAudioTime)
      audioRecorder.playAudio()
    },
    quickplay () {
      const whiteboard = this.$refs['whiteboard']
      whiteboard.quickplay()
    },
    async saveFileReference({ url, path }) {
      await this.whiteboardRef.update({
        audioURL: url,
        audioPath: path
      })
    }
  }
}
</script>
