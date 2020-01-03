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
                <div class="pt-5">
                    <p class="display-2 text--primary">
                        explain.mit.edu
                    </p>
                    <!-- EXPLAIN THE WEBSITE WITH OVERLAYS -->
                    <p class="headline text--primary">
                        An efficient platform for visual explanations
                    </p>
                </div>
                <div class="mb-5" style="margin: auto">
                    <!-- previous button color was deep-purple accent-4 -->
                    <v-btn class="mx-auto" color="secondary" href="https://medium.com/@eltonlin1998/the-grand-plan-538e57bbeffc"
                           text>
                        LEARN MORE
                    </v-btn>
                    <v-btn class="mx-auto" color="secondary" href="https://github.com/eltonlin1998/ExplainMIT" text>
                        SOURCE CODE
                    </v-btn>
                </div>
                <v-divider></v-divider>


                <!-- <BaseGrid> -->
                <v-container class="py-0" fluid>
                    <v-row class="py-0" justify="center">
                        <v-col :cols="computeVideoSize()" class="py-0">
                            <v-card>
                                <v-card-subtitle class="black--text">Ask and answer questions, just like on Piazza
                                </v-card-subtitle>
                                <v-img :aspect-ratio="16/9">
                                    <RenderlessFetchStrokes whiteboardID="BlEjXn7RP7q8YwxG8FLO">
                                        <template slot-scope="{ strokes }">
                                            <DoodleVideo
                                                    :strokes="strokes"
                                                    @animation-loaded="hasFetchedVideos = true"
                                                    canvasID="1"
                                                    v-if="strokes"
                                            />
                                        </template>
                                    </RenderlessFetchStrokes>
                                </v-img>
                            </v-card>
                        </v-col>
                        <v-col :cols="computeVideoSize()" class="py-0">
                            <v-card>
                                <v-card-subtitle class="black--text">Except you can draw & talk to explain hard ideas
                                    (live or recorded)
                                </v-card-subtitle>
                                <v-img :aspect-ratio="16/9">
                                    <RenderlessFetchStrokes whiteboardID="8hcybKON8Br67bNUA9TJ">
                                        <template slot-scope="{ strokes }">
                                            <DoodleVideo
                                                    :strokes="strokes"
                                                    @animation-loaded="hasFetchedVideos = true"
                                                    canvasID="2"
                                                    v-if="strokes"
                                            />
                                        </template>
                                    </RenderlessFetchStrokes>
                                </v-img>
                            </v-card>
                        </v-col>
                        <v-col :cols="computeVideoSize()" class="py-0">
                            <v-card>
                                <v-card-subtitle class="black--text">As people help each other, elegant explanations
                                    accumulate
                                </v-card-subtitle>
                                <v-img :aspect-ratio="16/9">
                                    <RenderlessFetchStrokes whiteboardID="vgPkZWvsqvt9pImHiMbe">
                                        <template slot-scope="{ strokes }">
                                            <DoodleVideo
                                                    :strokes="strokes"
                                                    @animation-loaded="hasFetchedVideos = true"
                                                    canvasID="3"
                                                    v-if="strokes"
                                            />
                                        </template>
                                    </RenderlessFetchStrokes>
                                </v-img>


                            </v-card>
                        </v-col>
                    </v-row>
                </v-container>
            </v-card>

            <transition mode="out-in" name="fade">
                <div key="loading..." v-if="isFetchingUser"></div>
                <div key="class-list" v-else>
                    <BaseGrid>
                        <v-col :cols="computeCardSize(c)" :key="c['.key']" v-for="(c, i) in classes">
                            <v-card @click="$router.push(`${c.courseNumber}/questions`)">
                                <v-card-title>{{ c.courseNumber }}</v-card-title>
                                <v-card-subtitle>{{ c.numOfVideos ? c.numOfVideos : 0}} videos, 0 members
                                </v-card-subtitle>
                            </v-card>
                        </v-col>
                    </BaseGrid>
                </div>
            </transition>
        </v-content>
    </div>
</template>

<script>
  import {mapState} from 'vuex'
  import 'firebase/auth'
  import db from '@/database.js'
  import BaseGrid from "@/components/BaseGrid.vue"
  import BaseCard from "@/components/BaseCard.vue"
  import HomeAppBar from "@/components/HomeAppBar.vue"
  import RenderlessFetchStrokes from "@/components/RenderlessFetchStrokes.vue"
  import DoodleVideo from "@/components/DoodleVideo.vue"

  export default {
        components: {
            HomeAppBar,
            BaseGrid,
            BaseCard,
            RenderlessFetchStrokes,
            DoodleVideo
        },
        computed: {
            ...mapState(['user', 'isFetchingUser']),
        },
        data() {
            return {
                classes: [],
                snackbar: false,
                snackbarMessage: '',
            }
        },
        created() {
            this.fetchClasses()
        },
        methods: {
            fetchClasses() {
                this.classes = [];
                db.collection("classes").get().then(querySnapshot => {
                    querySnapshot.forEach(doc => {
                        this.classes.push({".key": doc.id, ...doc.data()})
                    })
                })
            },
            async createClass(courseNumber) {
                const ref = db.collection('classes').doc(courseNumber);
                await ref.set({
                    courseNumber,
                    description: "description",
                    introVideoID: "4zV1vCQE3CDAuZC8vtEw", // always initialize picture to Sun, Moon and Lake
                    paragraph: "paragraph",
                    tabs: ["New"]
                });
                this.fetchClasses()
            },
            quickplayVideo(i) {
                const videoElem = this.$refs[`doodle-video-${i}`][0];
                videoElem.quickplay()
            },
            saveParagraph(newValue, courseNumber) {
                const ref = db.collection("classes").doc(courseNumber);
                ref.update({
                    paragraph: newValue
                })
            },
            computeVideoSize() {
                return this.$vuetify.breakpoint.smAndDown ? 12 : 4
            },
            computeCardSize({courseNumber}) {
                if (courseNumber.length > 13) {
                    if (this.$vuetify.breakpoint.md) {
                        return 4
                    } else if (this.$vuetify.breakpoint.smAndDown) {
                        return 12
                    }
                }
                return this.$vuetify.breakpoint.smAndDown ? 6 : 2
            }
        }
    }
</script>

<style>
    .fade-enter-active, .fade-leave-active {
        transition: opacity .7s;
    }

    .fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */
    {
        opacity: 0;
    }
</style>