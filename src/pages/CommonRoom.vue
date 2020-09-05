<template>
  <div>
    <h1>This is a common room</h1>
    <RealtimeSpaceTwilioRoom2 
      :roomID="$route.params.section_id"
      willMuteByDefault
    />
    <p>Everyone will mute by default</p>
    <p>You will not be shuffled here</p>
    <p>Aspect ratio here is fixed</p>
  </div>
</template>

<script>
import RealtimeSpaceTwilioRoom2 from "@/components/RealtimeSpaceTwilioRoom2.vue"; 

export default {
  name: "CommonRoom",
  components: {
    RealtimeSpaceTwilioRoom2
  },
  data () {
    return {
      isMicOn: true,
      isCameraOn: true
    };
  }
};
</script>