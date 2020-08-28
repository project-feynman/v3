<template>
  <!-- Other rooms that I'm not currently in -->
  <div style="width: 100%;">
    <div class="d-flex">
      <div class="text-uppercase font-weight-medium">Room {{ i }}</div>
      <v-spacer/>
      <slot>

      </slot>
    </div>
    <div class="pl-3">
      <p v-for="p in allClients" :key="p.id"
        style="font-weight: 400; font-size: 0.8em"
        class="text--secondary mb-0"
      >
        {{ p.firstName + " " + p.lastName }}
      </p>
    </div>
  </div>
</template>

<script>
import BaseButton from "@/components/BaseButton.vue"; 

export default {
  props: {
    i: {
      type: Number,
      required: true
    },
    allClients: {
      type: Array,
      required: true
    }
  },
  components: {
    BaseButton
  }
}
</script>