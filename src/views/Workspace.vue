<template>
  <div id="workspace">
    <v-container v-if="simpleUser && workspace" fluid class="pa-0">
      <VoiceChat :workspaceID="workspace['.key']" :user="simpleUser"/>
      <!-- AUDIO CHAT -->
      <!-- <div class="text-xs-center">
        <div>workspace.hasAudioRoom = {{ workspace.hasAudioRoom }}</div>
      </div> -->
      <!-- <video-chat :hasAudioRoom="workspace.hasAudioRoom"
                  :workspaceID="workspace['.key']"
                  @open-room="updateHasAudioRoom()"/> -->

      <!-- THIS IS WORKSPACE WHITEBOARD-->
      <!-- "v-if="...workspace.whiteboardID"" needed because workspace goes from null to {} (surprisingly), before becoming fully populated -->
      <whiteboard 
        v-if="loadCanvas && workspace.whiteboardID"
        ref="whiteboard"
        :hideToolbar="true"
        :whiteboardID="workspace.whiteboardID"/>

      <!-- THIS IS THE FULLSCREEN WHITEBOARD -->
      <v-dialog v-model="whiteboardPopup" fullscreen hide-overlay>
        <v-card v-if="whiteboardPopup">
          <whiteboard 
            v-if="loadCanvas"
            ref="whiteboard"
            :whiteboardID="workspace.whiteboardID"
            @close-whiteboard="whiteboardPopup = false"/>
        </v-card>
      </v-dialog>
    </v-container>
  </div>
</template>

<script>
import firebase from 'firebase/app'
import 'firebase/firestore'
import slugify from 'slugify'
import { mapState } from 'vuex'
import db from '@/database.js'
import Whiteboard from '@/components/Whiteboard.vue'
import VoiceChat from '@/components/VoiceChat.vue'

export default {
  components: {
    Whiteboard,
    VoiceChat
  },
  computed: {
    ...mapState(['user']),
    simpleUser () {
      if (this.user) {
        return {
          email: this.user.email || "anonymous@gmail.com",
          uid: this.user.uid || "anonymous",
          color: this.user.color || "grey",
        }
      } else {
        return {
          email: "anonymous",
          uid: "anonymous",
          color: "grey",
        }
      }
    }
  },
  data () {
    return {
      whiteboardPopup: false,
      workspace: null,
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
    async bindVariables () {
      const userUID = this.$route.params.id
      const classID = this.$route.params.class_id
      const workspaceRef = db.collection('classes').doc(classID).collection('workspaces').doc(userUID)
      if (this.prevWorkspaceRef) {
        await this.cleanUpPrevWorkspace()
      }
      await this.$binding('workspace', workspaceRef)
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
    updateHasAudioRoom () {
      this.prevWorkspaceRef.update({
        hasAudioRoom: true
      })
    }
  }
}
</script>
