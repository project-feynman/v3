<template>
    <div>
        <!-- APP BAR -->
        <BaseAppBar :loading="!hasFetchedVideos"/>

        <v-content>
            <template v-if="classDoc != {}">
                <VideoGalleryTabs
                        :tab="tab"
                        :tabs="classDoc.tabs"
                        @tab-change="newValue => tab = newValue"
                        @tabs-rename="newValues => renameTabs(newValues)"
                        v-if="classDoc.tabs"
                >
                    <template v-slot:default="{ tabs }">
                        <v-tab-item :key="`tab--item--${i}`" v-for="(tab, i) in tabs">
                            <RenderlessFetchVideos :classID="classDoc.courseNumber" :tabNumber="i">
                                <template slot-scope="{ videos }">
                                    <BaseGrid>
                                        <v-col :cols="computeCardSize()" :key="video['.key']"
                                               v-for="(video, j) in videos">
                                            <BaseCard
                                                    :description="video.paragraph || ''"
                                                    :isEditting="isEditting"
                                                    :key="video['.key']"
                                                    :ref="`card--${j}`"
                                                    :subtitle="getSubtitle(video)"
                                                    :tabNumber="i"
                                                    :tabs="classDoc.tabs"
                                                    :title="video.title"
                                                    @save-paragraph="newValue => saveParagraph(newValue, video)"
                                                    @save-tab-number="newValue => handleTabChange(newValue, video)"
                                                    class="mb-5"
                                            >
                                                <!-- IMAGE SLOT -->
                                                <template v-slot:card-image>
                                                    <RenderlessFetchStrokes :whiteboardID="video['.key']">
                                                        <template slot-scope="{ strokes }">
                                                            <DoodleVideo
                                                                    :canvasID="`${i}-${j}`"
                                                                    :ref="`doodle-video-${i}-${j}`"
                                                                    :strokes="strokes"
                                                                    @animation-loaded="hasFetchedVideos = true"
                                                                    v-if="strokes"
                                                            />
                                                        </template>
                                                    </RenderlessFetchStrokes>
                                                </template>

                                                <!-- BUTTONS SLOT -->
                                                <template v-slot:card-actions>
                                                    <v-btn @click="handleAction('FULL VIDEO', video, j)" color="secondary"
                                                           text>
                                                        FULL VIDEO
                                                    </v-btn>
                                                    <v-btn @click="handleAction('QUICKPLAY', video, `${i}-${j}`)" color="secondary"
                                                           text>
                                                        QUICKPLAY
                                                    </v-btn>
                                                    <v-btn @click="initEditForCard(j)" class="subtitle-2" color="secondary"
                                                           text v-if="hasPermission(video)">
                                                        EDIT
                                                    </v-btn>

                                                </template>
                                                <template v-slot:card-actions-editing>
                                                    <v-btn @click="handleAction('DELETE', video, j)"
                                                           class="subtitle-2" color="red" text
                                                           v-if="hasPermission(video)">
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
        data() {
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
            user() {
                return this.$store.state.user
            }
        },
        created() {
            this.fetchClassDoc()
        },
        methods: {
            async fetchClassDoc() {
                this.classDoc = {};
                const classID = this.$route.params.class_id;
                const ref = db.collection("classes").doc(classID);
                const doc = await ref.get();
                this.classDoc = doc.data()
            },
            handleAction(buttonName, {courseNumber, ".key": videoID, audioPath}, canvasID) {
                if (buttonName === "FULL VIDEO") {
                    const classID = this.$route.params.class_id;
                    this.$router.push(`/${classID}/${videoID}`)
                } else if (buttonName === "QUICKPLAY") {
                    const videoElem = this.$refs[`doodle-video-${canvasID}`][0];
                    videoElem.quickplay()
                } else if (buttonName === "DELETE") {
                    this.deleteVideo(videoID, audioPath)
                }
            },
            getSubtitle({authorName, duration}) {
                if (duration) {
                    return `By ${authorName || 'Anonymous'}, ${Number.parseFloat(duration / 60).toPrecision(2)} minutes`
                } else {
                    return `By ${authorName || 'Anonymous'}, silent animation`
                }
            },
            initEditForCard(j) {
                const card = this.$refs[`card--${j}`][0];
                card.isEditing = true;
                card.show = true
            },
            expandCardDescription(j) {
                const card = this.$refs[`card--${j}`][0];
                card.show = true
            },
            async handleTabChange(newValue, {".key": videoID}) {
                const ref = db.collection("whiteboards").doc(videoID);
                this.isEditting = false;
                await ref.update({
                    tabNumber: newValue
                });
                this.fetchClassDoc()
            },
            async renameTabs(newValues) {
                const ref = db.collection("classes").doc(this.$route.params.class_id);
                await ref.update({
                    tabs: newValues
                });
                this.fetchClassDoc()
            },
            async saveParagraph({paragraph, title}, {".key": videoID}) {
                const ref = db.collection("whiteboards").doc(videoID);
                this.isEditting = false;
                await ref.update({
                    paragraph,
                    title
                });
                this.fetchClassDoc()
            },
            async deleteVideo(ID, audioPath) {
                if (audioPath) {
                    // TODO: audio file fails to delete
                    const storageRef = firebase.storage().ref();
                    const audioFileRef = storageRef.child(`recordings/${audioPath}`);
                    audioFileRef.delete()
                }
                const recursiveDelete = firebase.functions().httpsCallable("recursiveDelete");
                await recursiveDelete({path: `whiteboards/${ID}`});
                this.fetchClassDoc()
            },
            hasPermission(video) {
                if (!this.user) {
                    return false
                }
                if (video.authorUID === this.user.uid || this.user.email === "eltonlin1998@gmail.com") {
                    return true
                }
                return false
            },
            computeCardSize() {
                if (this.$vuetify.breakpoint.lgAndUp) {
                    return 4
                }
                return this.$vuetify.breakpoint.smAndDown ? 12 : 6
            }
        }
    }
</script>
