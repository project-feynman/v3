<template>
  <div align="center" justify="center" style="height: 100%">
    <v-card style="height: 100%; width: 100%">
      <slot>

      </slot>
      <v-row justify="center">
        <v-overlay absolute :value="overlay" :opacity="0.1">
          <v-btn @click="e => playVideo(e)" fab large dark>
            <v-icon>play_arrow</v-icon>
          </v-btn>
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
  methods: {
    playVideo (e) {
      e.stopPropagation();
      this.$emit('play-click');
    }
  }
}
</script>