<template>
  <div>
    <div class="text-xs-center">
      <v-btn @click="becomeHelper()">Get a workspace</v-btn>
    </div>

    <v-layout row mt-5>

      <v-flex xs12 sm6 offset-sm3>
        <v-card>
          <v-toolbar color="cyan" dark>

            <v-toolbar-title>Classmates</v-toolbar-title>

            <v-spacer></v-spacer>
            
            <!-- <v-btn icon>
              <v-icon>search</v-icon>
            </v-btn> -->
          </v-toolbar>

          <v-list three-line>
      
            <template v-for="(item, index) in users">
          
              <v-subheader v-if="item.email" :key="index">
                #{{ index + 1 }} {{ item.email }}
              </v-subheader>

                <!-- <v-list-tile-avatar>
                  <img :src="item.avatar">
                </v-list-tile-avatar> -->

                <!-- <v-list-tile-content>
                  <v-list-tile-title v-html="item.title"></v-list-tile-title>
                  <v-list-tile-sub-title v-html="item.subtitle"></v-list-tile-sub-title>
                </v-list-tile-content> -->
    
              <!-- <v-divider :key="index"></v-divider> -->
              
            </template>

          </v-list>
        </v-card>
      </v-flex>
    </v-layout>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import db from '@/database.js'
import firebase from 'firebase/app'
import 'firebase/firestore'
import 'firebase/database'

export default {
  created () {
    this.$binding('users', db.collection('users'))
  },
  data () {
    return {
      users: null
    }
  },
  computed: {
    ...mapState(['user'])
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