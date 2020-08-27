<template>
  <!-- Other rooms that I'm not currently in -->
  <div>
    <div class="room-title pb-0">
      <p>Room {{ i }}</p>
      <slot>

      </slot>
    </div>
    <v-card-text>
      <v-container>
        <div v-for="p in allClients" :key="p.id">
          {{ p.firstName + " " + p.lastName }}
        </div>
      </v-container>
    </v-card-text>
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