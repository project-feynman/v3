<template>
  <div>
    <!-- SNACKBAR -->
    <v-snackbar v-model="snackbar">
      {{ snackbarMessage }}
      <v-btn @click="snackbar = false" color="pink" flat>
        CLOSE
      </v-btn>
    </v-snackbar>

    <!-- TODO: Remove the "The" prefix as there are now multiple app bars -->
    <TheAppBar/>

    <v-content>
      <v-card class="mx-auto text-center" fluid>
        <v-card-text>
          <p class="display-2 text--primary">
            explain.mit.edu
          </p>
          <div class="headline text--primary">
            A place where everyone helps each other by sharing simple explanations
          </div>
        </v-card-text>
        <v-card-actions>
            <div style="margin: auto">
              <v-btn href="https://medium.com/@eltonlin1998/the-goal-of-explainmit-afd9df574c60" text class="mx-auto" color="deep-purple accent-4">
                Learn more 
              </v-btn>
              <v-btn href="https://github.com/eltonlin1998/ExplainMIT" text class="mx-auto" color="deep-purple accent-4">
                Github repo
              </v-btn>
            </div>
        </v-card-actions>
      </v-card>

      <transition name="fade" mode="out-in">
        <div v-if="isFetchingUser" key="loading..."></div>
        <div v-else key="class-list">
          <LayoutResponsiveGrid>
            <v-col v-for="(c, i) in classes" :key="c['.key']" :cols="computeCardSize()">
              <v-card>
                <!-- CARD IMAGE -->
                <v-img :aspect-ratio="16/9">
                  <RenderlessFetchStrokes :whiteboardID="c.introVideoID">
                    <template slot-scope="{ strokes }">
                      <DoodleVideo 
                        v-if="strokes"
                        :strokes="strokes"
                        :canvasID="`${i}`"
                        :ref="`doodle-video-${i}`"
                      />
                    </template>
                  </RenderlessFetchStrokes>
                </v-img>

                <!-- CARD TITLE -->
                <v-card-title>
                  <div class="title font-weight-bold">
                    {{ c.description }} ({{ c.courseNumber }})  
                  </div>
                </v-card-title>

                <!-- CARD TEXT -->
                <v-card-text class="black--text">
                  {{ c.paragraph }}
                </v-card-text>
                
                <!-- CARD ACTIONS -->
                <v-card-actions>
                  <v-btn @click="$router.push(`${c.courseNumber}/videos`)" text color="deep-purple accent-4">
                    ENTER CLASS
                  </v-btn>
                  <v-btn @click="quickplayVideo(i)" text color="deep-purple accent-4">
                    QUICKPLAY
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-col>
          </LayoutResponsiveGrid>
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
import PopupLogin from '@/components/PopupLogin.vue'
import LayoutResponsiveGrid from "@/components/LayoutResponsiveGrid.vue"
import TheAppBar from "@/components/TheAppBar.vue"
import RenderlessFetchStrokes from "@/components/RenderlessFetchStrokes.vue"
import DoodleVideo from "@/components/DoodleVideo.vue"

export default {
  components: {
    PopupLogin,
    TheAppBar,
    LayoutResponsiveGrid,
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
      db.collection("classes").get().then(querySnapshot => {
        querySnapshot.forEach(doc => {
          this.classes.push({ ".key": doc.id, ...doc.data()})
        })
      })
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
    computeCardSize () {
      return this.$vuetify.breakpoint.smAndDown? 12 : 6
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
.cursor-pointer {
  cursor: pointer;
}
</style>