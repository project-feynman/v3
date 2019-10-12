<template>
  <v-row align="center" justify="center" style="height: 100%">
    <v-card style="height: 100%; width: 100%">
        <slot>

        </slot>
        <v-row justify="center">
          <v-overlay
            :absolute="absolute"
            :value="overlay"
          >
            <div>
              <v-btn @click="playVideo()" fab large dark>
                <v-icon>play_arrow</v-icon>
              </v-btn>
            </div>
          </v-overlay>
        </v-row>
    </v-card>
  </v-row>
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
    playVideo () {
      event.stopPropagation()
      this.$emit('play-video')
    }
  }
}
</script>