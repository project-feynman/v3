<template>
    <v-dialog persistent v-model="value" width="700">
        <v-card>
            <v-card-text>
                <template v-if="!shareableURL">
                    <v-container align-center justify-center>
                        <v-layout>
                            <v-flex>
                                <v-text-field
                                        autofocus
                                        label="Title"
                                        placeholder="e.g. Djikstra's Algorithm"
                                        v-model="videoTitle"
                                />
                            </v-flex>
                        </v-layout>
                    </v-container>
                </template>

                <template v-else>
                    <p>Shareable Video Link</p>
                    <p id="link_url">{{ shareableURL }}</p>
                </template>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <template v-if="!shareableURL && !isSavingVideo">
                    <v-btn @click="handleClose()" color="green darken-1" text>
                        CANCEL
                    </v-btn>
                    <v-btn @click="handleSave()" color="green darken-1" text>
                        SAVE
                    </v-btn>
                </template>
                <p class="pink--text" v-else-if="isSavingVideo">Saving video...</p>
                <template v-else>
                    <v-btn v-clipboard="returnLinkURL()">
                        COPY TO CLIPBOARD
                    </v-btn>
                    <v-btn @click="handleClose()">
                        OK
                    </v-btn>
                </template>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
    export default {
        props: {
            value: Boolean
        },
        data() {
            return {
                isSavingVideo: false,
                shareableURL: '',
                videoTitle: ''
            }
        },
        methods: {
            showSuccessMessage(videoDocID) {
                this.shareableURL = `explain.mit.edu/${this.$route.params.class_id}/${videoDocID}`;
                this.isSavingVideo = false
            },
            handleSave() {
                if (!this.videoTitle) {
                    return
                }
                this.isSavingVideo = true;
                this.$emit('pre-save-explanation', this.videoTitle)
            },
            handleClose() {
                this.shareableURL = '';
                this.isSavingVideo = false;
                this.videoTitle = '';
                this.$emit('input', !this.value)
            },
            returnLinkURL() {
                return this.shareableURL
            }
        }
    }
</script>
