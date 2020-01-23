<template>
  <div>
    <!-- SNACKBAR -->
    <v-snackbar v-model="snackbar">
      {{ snackbarMessage }}
      <v-btn @click="snackbar = false" color="pink" flat>
        CLOSE
      </v-btn>
    </v-snackbar>
    
    <!-- APP BAR -->
    <HomeAppBar @create-class="courseNumber => createClass(courseNumber)"/>

    <v-content> 
      <v-card class="mx-auto text-center" fluid>
        <div class="pt-5">
          <p class="display-2 text--primary">
            explain.mit.edu
          </p>
          <!-- EXPLAIN THE WEBSITE WITH OVERLAYS -->
          <p class="headline text--primary">
            An efficient platform for visual explanations
          </p>
        </div>
        <div style="margin: auto" class="mb-5">
          <!-- previous button color was deep-purple accent-4 -->
          <v-btn href="https://medium.com/@eltonlin1998/feynman-overview-338034dcb426" text class="mx-auto" color="secondary">
            LEARN MORE
          </v-btn>
          <v-btn href="https://github.com/eltonlin1998/ExplainMIT" text class="mx-auto" color="secondary">
            SOURCE CODE
          </v-btn>
        </div>

        <v-divider></v-divider>
        <SearchBar 
            label="Enter Class Number"
            :items="classesIDs"
            @submit="classChosen">
        </SearchBar>
        
        <KaryDialog v-if="searchBarDialog"
            title="Do you want to add the following class?"
            :text="chosenClass"
            :options="searchBarDialogOptions"
            @submit="searchBarDialogSubmitted"
        >
        </KaryDialog>

        <v-divider></v-divider>
        <v-container fluid class="py-0">
          <v-row justify="center" class="py-0">
            <v-col :cols="computeVideoSize()" class="py-0">
              <v-card>
                <v-card-subtitle class="black--text">Ask & answer questions, just like on Piazza</v-card-subtitle>
                <v-img :aspect-ratio="16/9">

                  <DoodleVideo 
                        whiteboardID="BlEjXn7RP7q8YwxG8FLO"
                        canvasID="1"
                        @animation-loaded="hasFetchedVideos = true"
                      />
                </v-img>
              </v-card>
            </v-col>
            <v-col :cols="computeVideoSize()" class="py-0">
              <v-card>
                <v-card-subtitle class="black--text">Draw & talk to explain harder ideas (live or recorded)</v-card-subtitle>
                 <v-img :aspect-ratio="16/9">

                 <DoodleVideo 
                        whiteboardID="8hcybKON8Br67bNUA9TJ"
                        canvasID="2"
                        @animation-loaded="hasFetchedVideos = true"
                      />
                </v-img>
              </v-card>
            </v-col>
            <v-col :cols="computeVideoSize()" class="py-0">
              <v-card>
                 <v-card-subtitle class="black--text">As people help each other, elegant explanations accumulate</v-card-subtitle>
                 <v-img :aspect-ratio="16/9">

                  <DoodleVideo 
                        whiteboardID="vgPkZWvsqvt9pImHiMbe"
                        canvasID="3"
                        @animation-loaded="hasFetchedVideos = true"
                      />
                </v-img>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </v-card>
      <transition name="fade" mode="out-in">
        <div v-if="isFetchingUser || user==null" key="loading..."></div>
        <div v-else key="class-list">
          <BaseGrid>
            <v-col v-for="(s, i) in user.enrolledClasses" :key="i">
                <v-card @click="$router.push(`${i}/questions`)">
                    <v-card-title>{{s.name}}</v-card-title>
                </v-card>
            </v-col>
          </BaseGrid>
        </div>
      </transition>
    </v-content>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import firebase from 'firebase/app'
import 'firebase/auth'
import db from '@/database.js'
import BaseGrid from "@/components/BaseGrid.vue"
import BaseCard from "@/components/BaseCard.vue"
import HomeAppBar from "@/components/HomeAppBar.vue"
import RenderlessFetchStrokes from "@/components/RenderlessFetchStrokes.vue"
import DoodleVideo from "@/components/DoodleVideo.vue"
import SearchBar from "@/components/SearchBar.vue"
import KaryDialog from "@/components/KaryDialog.vue"
import {initEnrollementService} from '../dep'
import {encodeKey} from '../dep'

export default {
  components: {
    HomeAppBar,
    BaseGrid,
    BaseCard,
    RenderlessFetchStrokes,
    DoodleVideo,
    SearchBar,
    KaryDialog,
  },
  computed: {
    ...mapState(['user', 'isFetchingUser']),
  },
  data () {
    return {
      classes: [],
      classesIDs: [],
      snackbar: false,
      snackbarMessage: '',

      enrollementService: initEnrollementService(),
      chosenClass: '',
      searchBarDialog: false,
      searchBarDialogOptions: ['No', 'Yes'],
    }
  },
  created () {
    this.fetchClasses()
  },
  methods: {
    fetchClasses () {
        this.classes = []
        db.collection("classes").get().then(querySnapshot => {
        querySnapshot.forEach(doc => {
          let docObj = { ".key": doc.id, ...doc.data()}
          this.classes.push(docObj)
          this.classesIDs.push(docObj.name)
        })
      })  
    },
    
    classChosen(answer) {
        this.searchBarDialog = true
        this.chosenClass = answer
    },
    searchBarDialogSubmitted(answer) {
        if(answer == 'No'){
            this.chosenClass = ''
            this.searchBarDialog = false
            return
        }
        this.enrollementService.addClass(this.user, this.chosenClass)

        this.chosenClass = ''
        this.searchBarDialog = false
    },

    async createClass (name) {
      let classID = encodeKey(name)
      const ref = db.collection('classes').doc(classID)
      await ref.set({ 
        name,
        description: "description",
        introVideoID: "4zV1vCQE3CDAuZC8vtEw", // always initialize picture to Sun, Moon and Lake
        paragraph: "paragraph",
        tagsPool: [],
        tabs: ["New"]
      })
      //add to enrolled classes
      this.fetchClasses()
    },
    quickplayVideo (i) {
      const videoElem = this.$refs[`doodle-video-${i}`][0]
      videoElem.quickplay()
    },
    saveParagraph (newValue, courseNumber) {
      const ref = db.collection("classes").doc(courseNumber)
      ref.update({
        paragraph: newValue
      })
    },
    computeVideoSize () {
      return this.$vuetify.breakpoint.smAndDown? 12 : 4
    },
    computeCardSize ({ courseNumber }) {
      if (courseNumber.length > 13) {
        if (this.$vuetify.breakpoint.md) {
          return 4
        } else if (this.$vuetify.breakpoint.smAndDown) {
          return 12
        } 
      }
      return this.$vuetify.breakpoint.smAndDown? 6 : 2
    }
  } 
}
</script>

<style>
.fade-enter-active, .fade-leave-active {
  transition: opacity .7s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}
</style>