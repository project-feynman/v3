<template>
    <div style="height: 100%; width: 100%;">
        <DoodleVideoAnimation
                :canvasID="canvasID"
                :isFullscreen="false"
                :strokes="strokes"
                @animation-finished="handleEvent()"
                @animation-loaded="handleAnimationLoaded()"
                ref="animation"
                v-if="strokes"
        />

        <audio-recorder
                :audioURL="audioURL"
                @play="syncAnimation()"
                @recorder-loaded="recorderLoaded=true"
                @recorder-loading="recorderLoaded=false"
                ref="audio-recorder"
                v-if="audioURL"
        />
    </div>
</template>

<script>
    import DoodleVideoAnimation from "@/components/DoodleVideoAnimation.vue"
    import AudioRecorder from "@/components/AudioRecorder.vue"
    import {mapState} from "vuex"
    import "firebase/storage"

    export default {
        props: {
            strokes: Array,
            audioURL: String,
            canvasID: String
        },
        components: {
            DoodleVideoAnimation,
            AudioRecorder
        },
        data() {
            return {
                recorderLoaded: false,
                animationLoaded: false,
                syncedVisualAndAudio: false
            }
        },
        computed: {
            ...mapState(["user"]),
            resourcesLoaded() {
                return this.recorderLoaded && this.animationLoaded
            }
        },
        methods: {
            syncAnimation() {
                if (this.syncedVisualAndAudio) {

                } else if (this.resourcesLoaded) {
                    const audioRecorder = this.$refs['audio-recorder'];
                    const animation = this.$refs['animation'];
                    animation.startSync(audioRecorder.getAudioTime);
                    this.syncedVisualAndAudio = true
                }
            },
            handleAnimationLoaded() {
                this.animationLoaded = true;
                this.$emit("animation-loaded")
            },
            quickplay() {
                const animation = this.$refs["animation"];
                animation.quickplay()
            }
        }
    }
</script>
