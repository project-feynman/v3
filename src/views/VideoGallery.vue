<template>
  <div>
    <!-- FULLSCREEN VIDEO POPUP -->
    <!-- <v-dialog v-model="whiteboardPopup" fullscreen hide-overlay>
      <v-card v-if="whiteboardPopup">
        <div class="text-xs-center">
          <v-btn @click="whiteboardPopup = false">EXIT</v-btn>
        </div>
        <FullVideo :videoID="currentVideoID"/>
      </v-card>
    </v-dialog> -->

    <!-- APP BAR -->
    <BaseAppBar :loading="!hasFetchedVideos"/>

    <!-- CONTENT -->
    <v-content>
      <template v-if="classDoc != {}">
        <VideoGalleryTabs 
          v-if="classDoc.tabs"
          :tabs="classDoc.tabs"
          :tab="tab"
          @tab-change="newValue => tab = newValue"
          @tabs-rename="newValues => renameTabs(newValues)"
        >
          <template v-slot:default="{ tabs }">
            <v-tab-item v-for="(tab, i) in tabs" :key="`tab--item--${i}`"> 
              <RenderlessFetchVideos :tabNumber="i" :classID="classDoc.courseNumber">
                <template slot-scope="{ videos }">
                  <BaseGrid>
                    <v-col v-for="(video, j) in videos" :key="video['.key']" :cols="computeCardSize()">
                      <BaseCard
                        @save-tab-number="newValue => handleTabChange(newValue, video)"
                        @save-paragraph="newValue => saveParagraph(newValue, video)"
                        :isEditting="isEditting"
                        :description="`By ${video.authorName || 'Anonymous'}`"
                        :paragraph="video.paragraph"
                        :tabs="classDoc.tabs"
                        :tabNumber="i"
                        class="mb-5"
                        :key="video['.key']"
                      >
                        <template v-slot:card-title>
                          {{ video.title }}
                        </template>

                        <!-- IMAGE SLOT -->
                        <template v-slot:card-image>
                          <RenderlessFetchStrokes :whiteboardID="video['.key']">
                            <template slot-scope="{ strokes }">
                              <DoodleVideo 
                                v-if="strokes"
                                :ref="`doodle-video-${i}-${j}`"
                                :strokes="strokes"
                                :canvasID="`${i}-${j}`"
                                @animation-loaded="hasFetchedVideos = true"
                              />
                            </template>
                          </RenderlessFetchStrokes>
                        </template>

                        <!-- BUTTONS SLOT -->
                        <template v-slot:card-actions>
                          <template v-if="isEditting === false">
                            <v-btn @click="handleAction('FULL VIDEO', video, j)" text color="secondary">
                              FULL VIDEO
                            </v-btn>
                            <v-btn @click="handleAction('QUICKPLAY', video, `${i}-${j}`)" text color="secondary">
                              QUICKPLAY
                            </v-btn>
                            <v-btn v-if="hasPermission(video)" @click="isEditting = true" text class="subtitle-2">
                              EDIT
                            </v-btn>
                          </template>
                          <v-btn v-else @click="handleAction('DELETE', video, j)" text color="red" class="subtitle-2">
                            DELETE
                          </v-btn>
                        </template>
                      </BaseCard>
                    </v-col>
                  </BaseGrid>
                </template>
              </RenderlessFetchVideos>
            </v-tab-item>
          </template>
        </VideoGalleryTabs>
      </template>
    </v-content>
  </div>
</template>

<script>
import BaseCard from "@/components/BaseCard.vue"
import BaseGrid from "@/components/BaseGrid.vue"
import BaseAppBar from "@/components/BaseAppBar.vue"
import DoodleVideo from "@/components/DoodleVideo.vue"
import FullVideo from "@/views/FullVideo.vue"
import RenderlessFetchVideos from '@/components/RenderlessFetchVideos.vue'
import RenderlessFetchStrokes from "@/components/RenderlessFetchStrokes.vue"
import VideoGalleryTabs from "@/components/VideoGalleryTabs.vue"
import db from "@/database.js"
import firebase from "firebase/app"
import "firebase/functions"
import "firebase/storage"

export default {
  components: {
    VideoGalleryTabs,
    DoodleVideo,
    FullVideo,
    BaseCard,
    BaseGrid,
    BaseAppBar,
    RenderlessFetchVideos,
    RenderlessFetchStrokes
  },
  data () {
    return {
      hasFetchedVideos: false,
      tab: 0,
      whiteboards: [],
      classDoc: {},
      isEditting: false,
      whiteboardPopup: false,
      currentVideoID: "",
    }
  },
  computed: {
    user () {
      return this.$store.state.user
    }
  },
  created () {
    this.fetchClassDoc()
  },
  methods: {
    fetchClassDoc () {
      this.classDoc = {} 
      const classID = this.$route.params.class_id
      const classRef = db.collection("classes").doc(classID)
      classRef.get().then(doc => {
        this.classDoc = doc.data()
      })
    },
    toggleDrawer () {
      this.$root.$emit("toggle-drawer")
    },
    handleAction (buttonName, { courseNumber, ".key": videoID, audioPath }, canvasID) {
      if (buttonName === "FULL VIDEO") {
        const classID = this.$route.params.class_id
        this.$router.push(`/${classID}/${videoID}`)
      } else if (buttonName === "QUICKPLAY") {
        const videoElem = this.$refs[`doodle-video-${canvasID}`][0]
        videoElem.quickplay()
      } else if (buttonName === "DELETE") {
        this.deleteVideo(videoID, audioPath)
      }
    },
    async handleTabChange (newValue, { ".key": videoID }) {
      const ref = db.collection("whiteboards").doc(videoID)
      ref.update({
        tabNumber: newValue
      })
      this.isEditting = false 
    },
    async renameTabs (newValues) {
      const ref = db.collection("classes").doc(this.$route.params.class_id)
      await ref.update({
        tabs: newValues
      })
      const classDoc = await ref.get()
      this.classDoc = classDoc.data()
    },
    saveParagraph ({ paragraph, title } , { ".key": videoID }) {
      const ref = db.collection("whiteboards").doc(videoID)
      ref.update({
        paragraph,
        title
      })
      this.isEditting = false
    },
    async deleteVideo (ID, audioPath) {
      if (audioPath) {
         // TODO: audio file fails to delete 
        const storageRef = firebase.storage().ref()
        const audioFileRef = storageRef.child(`recordings/${audioPath}`)
        audioFileRef.delete()
      }    
      const recursiveDelete = firebase.functions().httpsCallable('recursiveDelete')
      await recursiveDelete({ path: `whiteboards/${ID}` })
      this.fetchClassDoc()
    },
    hasPermission (video) {
      if (!this.user) {
        return false
      } 
      if (video.authorUID === this.user.uid || this.user.email === "eltonlin1998@gmail.com") {
        return true 
      } 
      return false 
    },
    computeCardSize () {
      if (this.$vuetify.breakpoint.lgAndUp) {
        return 4
      }
      return this.$vuetify.breakpoint.smAndDown? 12 : 6
    }
  }
}
</script>
