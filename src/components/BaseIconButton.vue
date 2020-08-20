<template>
  <v-btn @click="$emit('click')" outlined>
    <v-icon>{{ icon }}</v-icon>
  </v-btn>
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

</style>