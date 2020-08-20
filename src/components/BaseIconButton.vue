<template>
  <v-tooltip bottom>
    <template v-slot:activator="{ on }">
      <v-btn v-on="on" @click.stop="$emit('click')" outlined :color="color" class="icon-button px-0 mx-1 align-center justify-center">
        <v-icon>{{ icon }}</v-icon>
      </v-btn>
    </template>
    <span>
      <slot></slot>
    </span>
  </v-tooltip>
</template>

<script>
export default {
  props: {
    icon: {
      type: String,
      default () {
        return 'none'
      }
    },
    color: {
      type: String,
      default () {
        return 'accent'
      }
    },
  }
}
</script>

<style>
.icon-button {
  height: 40px !important;
  width: 40px !important;
  display: inline-flex;
  border-radius: 50%;
}
</style>