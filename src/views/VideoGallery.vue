<template>
  <div>
    <BaseAppBar :loading="!hasFetchedVideos"/>
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
              <RenderlessFetchVideos 
                :tabNumber="i" 
                :classID="classDoc.courseNumber" 
                @videos-fetched="hasFetchedVideos=true"
              >
                <template slot-scope="{ videos }">
                  <v-container fluid>
                    <v-row>
                      <v-col v-for="(video, j) in videos" :key="video['.key']" :cols="computeCardSize()">
                        <BaseCard
                          @save-tab-number="newValue => handleTabChange(newValue, video)"
                          @save-paragraph="newValue => saveParagraph(newValue, video)"
                          :isEditting="isEditting"
                          :title="video.title"
                          :subtitle="getSubtitle(video)"
                          :description="video.paragraph || ''"
                          :tabs="classDoc.tabs"
                          :tabNumber="i"
                          class="mb-5"
                          :ref="`card--${j}`"
                        >
                          <!-- IMAGE SLOT -->
                          <template v-slot:card-image>
                            <DoodleVideo
                              :whiteboardID="video['.key']" 
                              :ref="`doodle-video-${i}-${j}`"
                              :canvasID="`${i}-${j}`"
                              :thumbnail="video.thumbnail"
                              @strokes-ready="handleAction('QUICKPLAY', video, `${i}-${j}`)"
                              @video-clicked="handleAction('FULL VIDEO', video, j)"
                              @mouse-change="handleAction('HANDLEHOVER', video, `${i}-${j}`, $event)"
                            />
                          </template>

                          <!-- BUTTONS SLOT -->
                          <template v-slot:card-actions>
                            <v-btn @click="handleAction('FULL VIDEO', video, j)" text color="secondary">
                              FULL VIDEO
                            </v-btn>
                            <v-btn @click="handleAction('QUICKPLAY', video, `${i}-${j}`)" text color="secondary">
                              QUICKPLAY
                            </v-btn>
                            <v-btn v-if="hasPermission(video)" @click="initEditForCard(j)" text color="secondary" class="subtitle-2">
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
                    </v-row>
                  </v-container>
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
import BaseAppBar from "@/components/BaseAppBar.vue"
import DoodleVideo from "@/components/DoodleVideo.vue"
import RenderlessFetchVideos from '@/components/RenderlessFetchVideos.vue'
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
    BaseAppBar,
    RenderlessFetchVideos
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
    user () { return this.$store.state.user }
  },
  created () { this.fetchClassDoc() },
  methods: {
    async fetchClassDoc () {
      this.classDoc = {} 
      const classID = this.$route.params.class_id
      const ref = db.collection("classes").doc(classID)
      const doc = await ref.get()
      this.classDoc = doc.data()
    },
    handleAction (buttonName, { courseNumber, ".key": videoID, audioPath }, canvasID, hover=false) {
      if (buttonName === "FULL VIDEO") {
        const classID = this.$route.params.class_id
        this.$router.push(`/${classID}/${videoID}`)
      }else if (buttonName === "HANDLEHOVER") {
        if (hover){
          this.$nextTick(() => {
            const videoElem = this.$refs[`doodle-video-${canvasID}`][0];
            if (!videoElem.strokesFetched){
              videoElem.fetchStrokes(); // if strokes arent fetched strokes-ready event will be emmitted after this
            } else if (!videoElem.isQuickplaying){
              videoElem.quickplay();
            }
          });
        }
      }
      else if (buttonName === "QUICKPLAY") {
        this.$nextTick(() => {
          const videoElem = this.$refs[`doodle-video-${canvasID}`][0];
          if (!videoElem.isQuickplaying){
            videoElem.quickplay();
          }
        });
      } else if (buttonName === "DELETE") {
        this.deleteVideo(videoID, audioPath)
      }
    },
    getSubtitle ({ authorName, duration }) {
      if (duration) { return `By ${authorName || 'Anonymous'}, ${Number.parseFloat(duration / 60).toPrecision(2)} minutes` } 
      else { return `By ${authorName || 'Anonymous'}, silent animation`}
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
        try {
          const storageRef = firebase.storage().ref();
          const audioFileRef = storageRef.child(`recordings/${audioPath}`);
          await audioFileRef.delete();
        } catch (err) {
          console.log(err);
        }
      }

      const recursiveDelete = firebase.functions().httpsCallable("recursiveDelete");
      await recursiveDelete({ path: `whiteboards/${ID}` });

      this.fetchClassDoc();
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
