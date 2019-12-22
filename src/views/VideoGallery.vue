<template>
  <div>
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
                        :title="video.title"
                        :subtitle="`By ${video.authorName || 'Anonymous'}`"
                        :description="video.paragraph"
                        :tabs="classDoc.tabs"
                        :tabNumber="i"
                        :key="video['.key']"
                        class="mb-5"
                        :ref="`card--${j}`"
                      >
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
                          <v-btn @click="handleAction('FULL VIDEO', video, j)" text color="secondary">
                            FULL VIDEO
                          </v-btn>
                          <v-btn @click="handleAction('QUICKPLAY', video, `${i}-${j}`)" text color="secondary">
                            QUICKPLAY
                          </v-btn>
                          <v-btn v-if="hasPermission(video)" @click="initEditForCard(j)" text class="subtitle-2">
                            EDIT
                          </v-btn>
                       
                        </template>
                        <template v-slot:card-actions-editing>
                          <v-btn v-if="hasPermission(video)" @click="handleAction('DELETE', video, j)" text color="red" class="subtitle-2">
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
    async fetchClassDoc () {
      this.classDoc = {} 
      const classID = this.$route.params.class_id
      const ref = db.collection("classes").doc(classID)
      const doc = await ref.get()
      this.classDoc = doc.data()
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
    initEditForCard (j) {
      const card = this.$refs[`card--${j}`][0]
      card.isEditing = true
      card.show = true
    },
    expandCardDescription (j) {
      const card = this.$refs[`card--${j}`][0]
      card.show = true
    },
    async handleTabChange (newValue, { ".key": videoID }) {
      const ref = db.collection("whiteboards").doc(videoID)
      this.isEditting = false 
      await ref.update({
        tabNumber: newValue
      })
      this.fetchClassDoc()
    },
    async renameTabs (newValues) {
      const ref = db.collection("classes").doc(this.$route.params.class_id)
      await ref.update({
        tabs: newValues
      })
      this.fetchClassDoc()
    },
    async saveParagraph ({ paragraph, title } , { ".key": videoID }) {
      const ref = db.collection("whiteboards").doc(videoID)
      this.isEditting = false
      await ref.update({
        paragraph,
        title
      })
      this.fetchClassDoc()
    },
    async deleteVideo (ID, audioPath) {
      if (audioPath) {
         // TODO: audio file fails to delete 
        const storageRef = firebase.storage().ref()
        const audioFileRef = storageRef.child(`recordings/${audioPath}`)
        audioFileRef.delete()
      }    
      const recursiveDelete = firebase.functions().httpsCallable("recursiveDelete")
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
