<template>
  <v-btn @click="$emit('click')"
    class="button-custom" 
    :outlined="outlined" color="accent" :text="!outlined && !filled"
  >
    <div class="d-flex flex-column">
        <v-icon>{{ icon }}</v-icon>
        <span class="d-none d-sm-block">
        <slot>

        </slot>
        </span>
    </div>
  </v-btn>
</template>

<script>
export default {
  props: {
    icon: String,
    outlined: {
      type: Boolean,
      default () {
        return false;
      }
    },
    filled: {
      type: Boolean,
      default () {
        return false
      }
    }
  }
}
</script>

<style scoped>
.button-custom:not(.v-btn--round) {
  font-size: 0.75em;
  letter-spacing: unset;
  text-transform: unset;
  height: unset !important;
  min-height: 36px;
  font-weight: 400;
  max-width: 90px;
  padding: 8px 16px;
}
</style>