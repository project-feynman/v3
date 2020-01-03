<template>
    <div align="center" justify="center" style="height: 100%">
        <v-card style="height: 100%; width: 100%">
            <slot>

            </slot>
            <v-row justify="center">
                <v-overlay
                        :absolute="absolute"
                        :opacity="0.1"
                        :value="overlay"
                >
                    <div>
                        <v-btn @click="playVideo()" dark fab large>
                            <v-icon>play_arrow</v-icon>
                        </v-btn>
                    </div>
                </v-overlay>
            </v-row>
        </v-card>
    </div>
</template>

<script>
    export default {
        props: {
            overlay: Boolean
        },
        data: () => ({
            absolute: true
        }),
        methods: {
            playVideo() {
                event.stopPropagation();
                this.$emit('play-video')
            }
        }
    }
</script>