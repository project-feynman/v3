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
        <v-card-text>
          <p class="display-2 text--primary">
            explain.mit.edu
          </p>
          <div class="headline text--primary mb-10">
            A place where everyone helps each other with maximal efficiency
          </div>
            The websites has only 3 sections. 
            <br>
            The "Questions" section is where you ask questions like: "I still don't understand recursion"
            <br>
            The "Blackboards" section is where you draw and talk with anyone, and/or record KhanAcademy-like videos
            <br>
            The "Videos" section is where you watch videos created by students and staff
        </v-card-text>
        <v-card-actions>
          <div style="margin: auto">
            <!-- previous button color was deep-purple accent-4 -->
            <v-btn href="https://medium.com/@eltonlin1998/learning-is-like-fighting-dragons-d7450dd3aa23" text class="mx-auto" color="secondary">
              Learn more 
            </v-btn>
            <v-btn href="https://github.com/eltonlin1998/ExplainMIT" text class="mx-auto" color="secondary">
              Source code 
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
                <v-card-title>
                  <div class="title font-weight-bold">
                    {{ c.courseNumber }}
                  </div>
                  <p v-if="c.numberOfVideos">
                    {{ c.numberOfVideos }} videos
                  </p>
                </v-card-title>
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
import HomeAppBar from "@/components/HomeAppBar.vue"

export default {
  components: {
    HomeAppBar,
    BaseGrid
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