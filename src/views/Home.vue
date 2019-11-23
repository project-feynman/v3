<template>
  <div>
    <!-- SNACKBAR -->
    <v-snackbar v-model="snackbar">
      {{ snackbarMessage }}
      <v-btn @click="snackbar = false" color="pink" flat>
        CLOSE
      </v-btn>
    </v-snackbar>

    <HomeAppBar @create-class="courseNumber => createClass(courseNumber)"/>

    <v-content> 
      <v-card class="mx-auto text-center" fluid>
        
        <v-card-text>
          <p class="display-2 text--primary">
            explain.mit.edu
          </p>
          <div class="headline text--primary mb-10">
            A place where everyone helps each other with maximal efficiency
          </div>

          <ul>
            The websites has only 3 sections. 
            <li>The "Questions" section is where you ask questions like: "I still don't understand recursion"</li>
            <li>The "Blackboards" section is where you draw and talk with anyone, and/or record KhanAcademy-like videos</li>
            <li>The "Videos" section is where you watch videos created by students and staff</li>
          </ul>

          <div>Below are 3 common use-cases</div>
  
          <v-divider/>
          <v-flex xs12>
            <v-container grid-list-xl>
              <v-layout row wrap align-center>
                <v-flex xs12 md4>
                  <v-card flat class="transparent">
                    <!-- <v-card-text class="text-center">
                      <v-icon x-large class="blue--text text--lighten-2">mdi-palette</v-icon>
                    </v-card-text> -->
                    <v-card-title primary-title class="layout justify-center">
                      <div class="headline text-center">Get back on track</div>
                    </v-card-title>
                    <v-card-text>
                      Hillary had a difficult week and missed several lectures. 
                      Office Hours seem too crowded, and Piazza answers seem too vague.   
                      She visits ExplainMIT and posts "I am totally lost with Dynamic Programming”. 
                      Within 10 minutes, another classmate responds with a short video that explains everything she needs to know to get back on track. 
                    </v-card-text>
                  </v-card>
                </v-flex>
                <v-flex xs12 md4>
                  <v-card flat class="transparent">
                    <v-card-title primary-title class="layout justify-center">
                      <div class="headline">Collaborate with classmates</div>
                    </v-card-title>
                    <v-card-text>
                      Obama and his friends have busy schedules that rarely overlap, so he mostly studies by himself. 
                      That’s why whenever he works, he opens explain.mit.edu to see if anyone else is also working on the homework - 
                      if so, he joins the blackboard room and collaborates with them. 
                    </v-card-text>
                  </v-card>
                </v-flex>
                <v-flex xs12 md4>
                  <v-card flat class="transparent">
                    <!-- <v-card-text class="text-center">
                      <v-icon x-large class="blue--text text--lighten-2">mdi-wrench</v-icon>
                    </v-card-text> -->
                    <v-card-title primary-title class="layout justify-center">
                      <div class="headline text-center">Explaining important things</div>
                    </v-card-title>
                    <v-card-text>
                      Bob and Marley are researchers who like explaining things. Realizing that it's frictionless to explain things on ExplainMIT, they adopt the Feynman technique of learning - learning by teaching.
                      They become prolific creators of algorithmic and probability-related explanations, and have to constantly decline interview invitations from Jane Street and Google. 
                    </v-card-text>
                  </v-card>
                </v-flex>
              </v-layout>
            </v-container>
          </v-flex>

        </v-card-text>

                <v-card-actions>
            <div style="margin: auto">
              <!-- previous button color was deep-purple accent-4 -->
              <v-btn href="https://medium.com/@eltonlin1998/the-goal-of-explainmit-afd9df574c60" text class="mx-auto" color="secondary">
                Learn more 
              </v-btn>
              <v-btn href="https://github.com/eltonlin1998/ExplainMIT" text class="mx-auto" color="secondary">
                Github repo
              </v-btn>
            </div>
        </v-card-actions>


      </v-card>

      <transition name="fade" mode="out-in">
        <div v-if="isFetchingUser" key="loading..."></div>
        <div v-else key="class-list">
          <BaseGrid>
            <v-col v-for="(c, i) in classes" :key="c['.key']" :cols="computeCardSize()">
              <v-card @click="$router.push(`${c.courseNumber}/videos`)">
                <!-- CARD IMAGE -->
                <!-- <v-img :aspect-ratio="16/9">
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
                </v-img> -->

                <!-- CARD TITLE -->
                <v-card-title>
                  <div class="title font-weight-bold">
                    {{ c.courseNumber }}
                  </div>
                </v-card-title>

                <!-- CARD TEXT -->
                <!-- <v-card-text class="black--text">
                  {{ c.paragraph }}
                </v-card-text> -->
                
                <!-- CARD ACTIONS -->
                <v-card-actions>
                  <!-- <v-btn @click="$router.push(`${c.courseNumber}/videos`)" text color="secondary">
                    ENTER CLASS
                  </v-btn> -->
                  <!-- <v-btn @click="quickplayVideo(i)" text color="deep-purple accent-4">
                    QUICKPLAY
                  </v-btn> -->
                </v-card-actions>
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
import PopupLogin from '@/components/PopupLogin.vue'
import BaseGrid from "@/components/BaseGrid.vue"
import HomeAppBar from "@/components/HomeAppBar.vue"
import RenderlessFetchStrokes from "@/components/RenderlessFetchStrokes.vue"
import DoodleVideo from "@/components/DoodleVideo.vue"

export default {
  components: {
    PopupLogin,
    HomeAppBar,
    BaseGrid,
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
      console.log("create class")
      // this should be delegated to the parent
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
    computeCardSize () {
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
.cursor-pointer {
  cursor: pointer;
}
</style>