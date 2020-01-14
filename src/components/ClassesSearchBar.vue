<template>
  <div>
    <v-autocomplete
      label="Enter Class Number"
      :items="classes"
      item-text="courseNumber"
      @change="dialog = true"
      v-model="searchText"
    ></v-autocomplete>
    <v-dialog
      v-model="dialog"
      max-width="300"
    >
      <v-card>
        <v-card-title class="headline">Do you want to add the following
            class?</v-card-title>

        <v-card-text class="headline">
            {{searchText}}
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn
            color="green darken-1"
            text
            @click="dontAddClass"
          >
            No
          </v-btn>

          <v-btn
            color="green darken-1"
            text
            @click="addClass"
          >
            Yes
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>


<script>
import db from '@/database.js'
import { mapState } from 'vuex'
import firebase from 'firebase/app'
import 'firebase/auth'
import { closeSync } from 'fs'

export default {
  name: 'ClassesSearchBar',
  data() {
        return {
            classes: [],
            searchText: "",
            dialog: false,
        }
  },

  created () {
    this.fetchClasses()
  },
  computed: {
    ...mapState(['user', 'isFetchingUser']),
  },
  methods: {
    fetchClasses () {
        this.classes = []
        db.collection("classes").get().then(querySnapshot => {
            querySnapshot.forEach(doc => {
            this.classes.push({ ".key": doc.id, ...doc.data()})
            })
        })
    },

    addClass(){
        let userDoc = db.collection("users").doc(this.user.uid)

        userDoc.get().then(doc => {
            let A = {...doc.data()}.enrolledClasses;
            for(let x of A){
                if(x.classID == this.searchText){
                    this.dialog = false;
                    this.searchText = null;
                    return
                }
            }

            var enrolledClassObj = {
                classID: this.searchText,
                settings: {
                notification: {
                    newQuestion: "always",
                    },
                }
            };
            userDoc.update({
                enrolledClasses: firebase.firestore.FieldValue.arrayUnion(enrolledClassObj)
            });
            this.dialog = false;
            this.$emit('classAdded')
            this.searchText = null;
        })
    },
    dontAddClass(){
        this.dialog = false;
        this.searchText = null;
    }
  }
}
</script>