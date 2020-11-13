<template>
  <v-col cols="12" sm="6">
    <TheSearchBar 
      :items="mitClasses"
      @submit="newVal => join({ mitClass: newVal })" 
      color="accent"
    />
  </v-col>
</template>

<script>
import TheSearchBar from "@/components/TheSearchBar.vue";

export default {
  props: {
    mitClasses: {
      type: Array,
      required: true
    }
  }
};
</script>

