<template>
  <v-btn
    :loading="isLoading"
    :disabled="isLoading"
    @click="$emit('click')"
    color="blue-grey" class="ma-2 white--text"
  >
    <slot>

    </slot>
    <v-icon right dark>mdi-cloud-upload</v-icon>
  </v-btn>
</template>

<script>
export default {
  props: {
    isLoading: Boolean
  }
}
</script>

<style>
.custom-loader {
  animation: loader 1s infinite;
  display: flex;
}
@-moz-keyframes loader {
  from {
    transform: rotate(0);
  }
  to {
    transform: rotate(360deg);
  }
}
@-webkit-keyframes loader {
  from {
    transform: rotate(0);
  }
  to {
    transform: rotate(360deg);
  }
}
@-o-keyframes loader {
  from {
    transform: rotate(0);
  }
  to {
    transform: rotate(360deg);
  }
}
@keyframes loader {
  from {
    transform: rotate(0);
  }
  to {
    transform: rotate(360deg);
  }
}