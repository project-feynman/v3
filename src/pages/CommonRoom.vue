<template>
  <RealtimeRoom
    :roomId="$route.params.section_id"
  />
</template>

<script>
import RealtimeSpaceTwilioRoom from "@/components/RealtimeSpaceTwilioRoom.vue"; 
import RealtimeRoom from "@/pages/RealtimeRoom.vue"; 

export default {
  name: "CommonRoom",
  components: {
    RealtimeRoom,
    RealtimeSpaceTwilioRoom
  },
  data () {
    return {
      isMicOn: true,
      isCameraOn: true
    };
  }
};
</script>