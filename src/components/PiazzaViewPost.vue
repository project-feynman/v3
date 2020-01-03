<template>
    <v-card :width="getFullWidth()">
        <v-col class="pb-0" cols="12">
            <v-textarea
                    :value="question.description"
                    disabled
                    label="Question"
                    name="input-7-4"
                    readonly
            />
        </v-col>
        <v-row>
            <v-col class="pt-0" cols="12">
                <RenderlessFetchStrokes :hasSubcollection="false" :whiteboardID="question.blackboardID">
                    <template slot-scope="{ strokes }">
                        <DoodleVideo
                                :strokes="strokes"
                                @animation-loaded="hasFetchedVideos = true"
                                canvasID="2"
                                v-if="strokes"
                        />
                    </template>
                </RenderlessFetchStrokes>
            </v-col>
        </v-row>
    </v-card>
</template>

<script>
    import DoodleVideo from "@/components/DoodleVideo.vue"
    import RenderlessFetchStrokes from "@/components/RenderlessFetchStrokes.vue"

    export default {
        props: {
            question: Object
        },
        components: {
            DoodleVideo,
            RenderlessFetchStrokes
        },
        methods: {
            getFullWidth() {
                // sidenav's width = 200, BaseList's width = 300
                return window.innerWidth - 500
            }
        }
    }
</script>