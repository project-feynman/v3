<template>
  <v-btn @click="$emit('click')"
    :class="`board-action-btn ${isNormalText? 'normal-text' : ''} ${isSuperSmallText? 'super-small-text pa-1' : ''}`" 
    :outlined="outlined" color="accent lighten-1" 
  >
    <span class="d-none d-sm-block mr-2">
      <slot>

      </slot>
    </span>
    <v-icon>{{ icon }}</v-icon>
  </v-btn>
</template>

<script>
export default {
  props: {
    icon: String,
    isNormalText: {
      type: Boolean,
      default () {
        return false;
      }
    },
    isSuperSmallText: {
      type: Boolean,
      default () {
        return false;
      }
    },
    outlined: {
      type: Boolean,
      default () {
        return false;
      }
    }
  }
}
</script>

<style scoped>
.board-action-btn.normal-text {
  letter-spacing: unset;
  text-transform: unset;
  font-size: 0.9em;
}

/* TODO: not encapsulated */
/* .super-small-text p {
  font-size: 0.6em;
  margin-bottom: 0;
} */
</style>