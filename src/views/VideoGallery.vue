<template>
  <div>
    <BaseAppBar v-if="classData"
    :classData="classData" 
    :loading="!hasFetchedVideos"/>
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
              <RenderlessFetchVideos :tabNumber="i" :classID="classID" @videos-fetched="hasFetchedVideos=true">
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
                        @title-clicked="$router.push(`/${$route.params.class_id}/${video['.key']}`)"
                      >
                        <!-- IMAGE SLOT -->
                        <template v-slot:card-image>
                          <DoodleVideo
                            :whiteboardID="video['.key']" 
                            :ref="`doodle-video-${i}-${j}`"
                            :canvasID="`${i}-${j}`"
                            :thumbnail="video.thumbnail"
                            @strokes-ready="handleAction('QUICKPLAY', video, `${i}-${j}`)"
                            @video-clicked="$router.push(`/${$route.params.class_id}/${video['.key']}`)"
                            @mouse-change="handleAction('HANDLEHOVER', video, `${i}-${j}`, $event)"
                          />
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
import BaseCard from "@/components/BaseCard.vue";
import BaseAppBar from "@/components/BaseAppBar.vue";
import DoodleVideo from "@/components/DoodleVideo.vue";
import RenderlessFetchVideos from '@/components/RenderlessFetchVideos.vue';
import VideoGalleryTabs from "@/components/VideoGalleryTabs.vue";
import db from "@/database.js";
import firebase from "firebase/app";
import "firebase/functions";
import "firebase/storage";

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
      classesService: initClassesService(),
      classID : null,
      classData : null
    }
  },
  computed: {
    user () { return this.$store.state.user }
  },
  async created () {
      this.fetchClassDoc();
      this.classID = this.$route.params.class_id;
      this.classData = await this.classesService.getClassData(this.classID);
    },
  methods: {
    async fetchClassDoc () {
      this.classDoc = {} 
      const classID = this.$route.params.class_id
      const ref = db.collection("classes").doc(classID)
      const doc = await ref.get()
      this.classDoc = doc.data()
    },
    handleAction (buttonName, { className, ".key": videoID, audioPath }, canvasID, hover = false) {
      if (buttonName === "HANDLEHOVER") {
        if (!hover) return;
        const videoElem = this.$refs[`doodle-video-${canvasID}`][0];
        if (!videoElem.strokesFetched) videoElem.fetchStrokes(); // if strokes arent fetched strokes-ready event will be emmitted after this
        else if (!videoElem.isQuickplaying) videoElem.quickplay();
      } 
      else if (buttonName === "QUICKPLAY") this.quickplayVideo(canvasID);
      else if (buttonName === "DELETE") this.deleteVideo(videoID, audioPath);
    },
    quickplayVideo (canvasID) {
      const DoodleVideo = this.$refs[`doodle-video-${canvasID}`][0];
      if (!DoodleVideo.isQuickplaying) DoodleVideo.quickplay();
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
    async handleTabChange (newValue, { ".key": videoID }) {
      const ref = db.collection("whiteboards").doc(videoID)
      this.isEditting = false 
      await ref.update({ tabNumber: newValue })
      this.fetchClassDoc()
    },
    async renameTabs (newValues) {
      const ref = db.collection("classes").doc(this.$route.params.class_id)
      await ref.update({ tabs: newValues })
      this.fetchClassDoc()
    },
    async saveParagraph ({ paragraph, title } , { ".key": videoID }) {
      const ref = db.collection("whiteboards").doc(videoID)
      this.isEditting = false
      await ref.update({ paragraph, title })
      this.fetchClassDoc()
    },
    async deleteVideo (ID, audioPath) {
      if (audioPath) {
        try { firebase.storage().ref().child(`recordings/${audioPath}`).delete(); }
        catch (err) { console.log(err); }
      }
      const recursiveDelete = firebase.functions().httpsCallable("recursiveDelete");
      await recursiveDelete({ path: `whiteboards/${ID}` });
      this.fetchClassDoc();
    },
    hasPermission (video) {
      if (!this.user) return false;
      else if (video.authorUID === this.user.uid || this.user.email === "eltonlin1998@gmail.com") return true;
      else return false;
    },
    computeCardSize () {
      if (this.$vuetify.breakpoint.lgAndUp) return 4;
      else return this.$vuetify.breakpoint.smAndDown? 12 : 6; 
    }
  }
}
</script>
