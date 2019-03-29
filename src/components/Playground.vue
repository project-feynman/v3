<template>
  <voice-chat></voice-chat>
</template>

<script>
import VoiceChat from "@/components/future/VoiceChat.vue";

export default {
  components: {
    VoiceChat
  },
  data() {
    return {
      show: true
    }
  }
};
</script>