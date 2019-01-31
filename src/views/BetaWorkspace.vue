<template>
  <div>
    <beta-popup-button>
      <h2>Place whiteboard here</h2>
    </beta-popup-button>
    <chat></chat>
    <h2>Beta Workspace</h2>
  </div>
</template>

<script>
import Chat from '@/components/Chat.vue'
import BetaPopupButton from '@/components/BetaPopupButton.vue'

export default {
  components: {
    Chat,
    BetaPopupButton
  }
}

</script>
