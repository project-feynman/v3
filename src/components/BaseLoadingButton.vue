<template>
  <v-btn
    :loading="isLoading"
    :disabled="isLoading"
    @click="$emit('click')"
    :block="block" :color="color" class="white--text"
  >
    <slot>
      
      <!-- <v-icon right dark>mdi-cloud-upload</v-icon> -->
    </slot>
  </v-btn>
</template>

<script>
export default {
  props: {
    isLoading: Boolean,
    block: Boolean,
    color: {
      type: String,
      default () {
        return "blue-grey"
      }
    }
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