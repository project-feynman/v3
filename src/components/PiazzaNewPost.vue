<template>
    <!-- THIS IS JUST THE TEXT, IMAGE AND VIDEO IN EDIT MODE -->
    <!-- IT'S NAMED POST SINCE IT CAN BE RE-USED FOR QUESTIONS AND ANSWERS -->
   <v-card :width="getFullWidth()">
          <v-col cols="12" class="pb-0">
            <v-textarea
              outlined
              name="input-7-4"
              label="Question"
              v-model="newQuestion"
            ></v-textarea>
          </v-col>
          <v-row>
            <v-col cols="6" class="pt-0">
              <v-img
                src="https://picsum.photos/id/11/500/300"
                lazy-src="https://picsum.photos/id/11/10/6"
                aspect-ratio="1"
                class="grey lighten-2"
                max-width="500"
                max-height="300"
              ></v-img>
            </v-col>
            <v-col cols="6" class="pt-0">
              <RenderlessFetchStrokes whiteboardID="3u9102vnYb01zaOTYYbB">
                <template slot-scope="{ strokes }">
                  <DoodleVideo 
                    v-if="strokes"
                    :strokes="strokes"
                    canvasID="2"
                    @animation-loaded="hasFetchedVideos = true"
                  />
                </template>
              </RenderlessFetchStrokes>
            </v-col>
          </v-row>
          <v-btn @click="submitQuestion()" block color="secondary" dark>Submit question</v-btn>
        </v-card>
</template>

<script>
import DoodleVideo from "@/components/DoodleVideo.vue"
import RenderlessFetchStrokes from "@/components/RenderlessFetchStrokes.vue"

export default {
  components: {
    DoodleVideo,
    RenderlessFetchStrokes
  },
  data: () => ({
    newQuestion: "Type question here"
  }),
  methods: {
    getFullWidth () {
      // sidenav's width = 200, BaseList's width = 300 
      return window.innerWidth - 500 
    }
  }
}
</script>