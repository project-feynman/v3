<template>
  <!-- Other rooms that I'm not currently in -->
  <div>
    <div class="room-title pt-2">
      <div>Room {{ i }}</div>
      <slot>

      </slot>
    </div>
    <div class="pl-3">
      <div v-for="p in allClients" :key="p.id">
        {{ p.firstName + " " + p.lastName }}
      </div>
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