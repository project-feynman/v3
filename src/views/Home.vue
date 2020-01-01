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
          <v-btn href="https://medium.com/@eltonlin1998/the-grand-plan-538e57bbeffc" text class="mx-auto" color="secondary">
            LEARN MORE
          </v-btn>
          <v-btn href="https://github.com/eltonlin1998/ExplainMIT" text class="mx-auto" color="secondary">
            SOURCE CODE
          </v-btn>
        </div>
        <v-divider></v-divider>


          <!-- <BaseGrid> -->
        <v-container fluid class="py-0">
          <v-row justify="center" class="py-0">
            <v-col :cols="computeVideoSize()" class="py-0">
              <v-card>
                <v-card-subtitle class="black--text">Ask & answer questions, just like on Piazza</v-card-subtitle>
                <v-img :aspect-ratio="16/9">
                  <RenderlessFetchStrokes whiteboardID="BlEjXn7RP7q8YwxG8FLO">
                    <template slot-scope="{ strokes }">
                      <DoodleVideo 
                        v-if="strokes"
                        :strokes="strokes"
                        canvasID="1"
                        @animation-loaded="hasFetchedVideos = true"
                      />
                    </template>
                  </RenderlessFetchStrokes>
                </v-img>
              </v-card>
            </v-col>
            <v-col :cols="computeVideoSize()" class="py-0">
              <v-card>
                <v-card-subtitle class="black--text">Draw & talk to explain harder ideas (live or recorded)</v-card-subtitle>
                 <v-img :aspect-ratio="16/9">
                  <RenderlessFetchStrokes whiteboardID="8hcybKON8Br67bNUA9TJ">
                    <template slot-scope="{ strokes }">
                      <DoodleVideo 
                        v-if="strokes"
                        :strokes="strokes"
                        canvasID="2"
                        @animation-loaded="hasFetchedVideos = true"
                      />
                    </template>
                  </RenderlessFetchStrokes>
                </v-img>
              </v-card>
            </v-col>
            <v-col :cols="computeVideoSize()" class="py-0">
              <v-card>
                 <v-card-subtitle class="black--text">As people help each other, elegant explanations accumulate</v-card-subtitle>
                 <v-img :aspect-ratio="16/9">
                  <RenderlessFetchStrokes whiteboardID="vgPkZWvsqvt9pImHiMbe">
                    <template slot-scope="{ strokes }">
                      <DoodleVideo 
                        v-if="strokes"
                        :strokes="strokes"
                        canvasID="3"
                        @animation-loaded="hasFetchedVideos = true"
                      />
                    </template>
                  </RenderlessFetchStrokes>
                </v-img>
              
            
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </v-card>

      <transition name="fade" mode="out-in">
        <div v-if="isFetchingUser" key="loading..."></div>
        <div v-else key="class-list">
          <BaseGrid>
            <v-col v-for="(c, i) in classes" :key="c['.key']" :cols="computeCardSize(c)">
              <v-card @click="$router.push(`${c.courseNumber}/questions`)">
                <v-card-title>{{ c.courseNumber }}</v-card-title>
                <v-card-subtitle>{{ c.numOfVideos ? c.numOfVideos : 0}} videos, 0 members</v-card-subtitle>
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

export default {
  components: {
    HomeAppBar,
    BaseGrid,
    BaseCard,
    RenderlessFetchStrokes,
    DoodleVideo
  },
  computed: {
    ...mapState(['user', 'isFetchingUser']),
  },
  data () {
    return {
      classes: [],
      snackbar: false,
      snackbarMessage: '',
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
          this.classes.push({ ".key": doc.id, ...doc.data()})
        })
      })
    },
    async createClass (courseNumber) {
      const ref = db.collection('classes').doc(courseNumber)
      await ref.set({ 
        courseNumber,
        description: "description",
        introVideoID: "4zV1vCQE3CDAuZC8vtEw", // always initialize picture to Sun, Moon and Lake
        paragraph: "paragraph",
        tabs: ["New"]
      })
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