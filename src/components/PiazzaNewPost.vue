<template>
    <v-card :width="getFullWidth()">
        <v-textarea
                class="mt-2"
                label="Question"
                name="input-7-4"
                outlined
                placeholder="Type question here..."
                v-model="newQuestion"
        />
        <div :style="`height: ${getFullWidth() * 9/16}px; position: relative`">
            <BlackboardMini :allStrokes="boardStrokes"
                            :height="`${getFullWidth() * 9/16}`"
                            :width="`${getFullWidth()}`"
                            @new-stroke="stroke => $emit('new-stroke', stroke)"/>
            <!-- <RenderlessFetchStrokes whiteboardID="3u9102vnYb01zaOTYYbB">
              <template slot-scope="{ strokes }">
                <DoodleVideo
                  v-if="strokes"
                  :strokes="strokes"
                  canvasID="2"
                  @animation-loaded="hasFetchedVideos = true"
                />
              </template>
            </RenderlessFetchStrokes> -->
        </div>
        <v-btn @click="submitQuestion()" block color="secondary" dark>Submit question</v-btn>
    </v-card>
</template>

<script>
  import DoodleVideo from "@/components/DoodleVideo.vue"
  import BlackboardMini from "@/components/BlackboardMini.vue"
  import RenderlessFetchStrokes from "@/components/RenderlessFetchStrokes.vue"

  export default {
        props: {
            boardStrokes: Array
        },
        components: {
            DoodleVideo,
            RenderlessFetchStrokes,
            BlackboardMini
        },
        data: () => ({
            newQuestion: ""
        }),
        methods: {
            submitQuestion() {
                const blackboardID = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                const questionObj = {
                    title: "No title yet",
                    description: this.newQuestion,
                    blackboardID
                };
                this.$emit('question-submit', questionObj);
                this.newQuestion = ""
            },
            getFullWidth() {
                // sidenav's width = 200, BaseList's width = 300
                return window.innerWidth - 500
            }
        }
    }
</script>