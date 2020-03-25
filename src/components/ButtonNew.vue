<template>
  <v-btn 
    @click="$emit('click')"
    v-on="on"
    v-bind="$attrs"
    class="button-custom" 
    :outlined="outlined" 
    color="accent" 
    :text="!outlined && !filled"
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
  inheritAttrs: false,
  props: {
    on: Object,
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
  },
  created () {
    console.log("on =", this.on);
  }
}
</script>

<style scoped>
.button-custom:not(.v-btn--round) {
  font-size: 0.7em;
  letter-spacing: unset;
  text-transform: unset;
  height: unset !important;
  min-height: 36px;
  font-weight: 400;
  max-width: 90px;
  padding: 8px 16px;
}
</style>