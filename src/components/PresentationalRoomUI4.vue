<template>
  <!-- Other rooms that I'm not currently in -->
  <v-card>
    <v-card-subtitle class="pb-0">
      <p>Room {{ i }}</p>
    </v-card-subtitle>
    <v-card-text>
      <v-container>
        <div v-for="p in allClients" :key="p.id">
          {{ p.firstName + " " + p.lastName }}
        </div>
      </v-container>
    </v-card-text>
  </v-card>
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