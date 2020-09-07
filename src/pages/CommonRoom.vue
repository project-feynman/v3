<template>
  <RealtimeRoom
    :roomId="$route.params.section_id"
  />
</template>

<script>
import RealtimeRoom from "@/pages/RealtimeRoom.vue"; 

export default {
  name: "CommonRoom",
  components: {
    RealtimeRoom
  }
};
</script>