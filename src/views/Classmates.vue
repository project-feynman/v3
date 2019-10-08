<template>
  <div>
    <!-- <group-chat :classID="$route.params.class_id"></group-chat> -->
      <!-- <v-layout row mt-5>

 
       <v-flex xs12 sm6 offset-sm3>
        <v-card>
          <v-toolbar color="cyan" dark>
            <v-toolbar-title>Classmates</v-toolbar-title>
            <v-spacer></v-spacer>
            
          </v-toolbar>
          <v-list three-line>
            <template v-for="(item, index) in users">
              <v-subheader v-if="item.email" :key="index">
                #{{ index + 1 }} {{ item.email }}
              </v-subheader>

            </template>

          </v-list>
        </v-card>
      </v-flex> 

    </v-layout> -->
  </div>
</template>

<script>
import GroupChat from "@/components/GroupChat.vue"
import db from '@/database.js'
import { mapState } from 'vuex'
import firebase from 'firebase/app'
import 'firebase/firestore'
import 'firebase/database'

export default {
  components: {
    GroupChat
  },
  created () {
    this.$binding('users', db.collection('users'))
  },
  data () {
    return {
      users: null
    }
  },
  computed: {
    ...mapState(['user', "isFetchingUser"]),
    classID () {
      return this.$route.class_id
    }
  },
  methods: {
    async becomeHelper () {
      // enter the ranking
      const userRef = db.collection('users').doc(this.user.uid)
      const classID = this.$route.params.class_id
      userRef.update({
        classesHelped: firebase.firestore.FieldValue.arrayUnion(classID)
      })
      // create a new workspace if you didn't have one
      const workspaceRef = db.collection('classes').doc(classID).collection('workspaces').doc(this.user.uid)
      const workspace = await workspaceRef.get()
      if (workspace.exists) {
        // do nothing 
      } else { 
        // create a new workspace pointed to a new whiteboard
        const whiteboardRef = await db.collection('whiteboards').add({})
        let workspace = {
          ownerUID: this.user.uid,
          whiteboardID: whiteboardRef.id 
        }
        await workspaceRef.set(workspace)
      }
    }
  }
}
</script>