<template>
  <div>
    <div class="room-title accent--text pb-0">
      <h3>Room {{ i }}</h3>
      <slot>

      </slot>
    </div>
    <div>
      <v-container class="pr-0" fluid>
        <div class="d-flex">
          <p :class="['align-self-center', `${hasConnectedToTwilioRoom ? 'mb-0' : '' }`]">
            {{ currentClient.name }}
          </p>
          <v-spacer/> 
          <template v-if="!hasConnectedToTwilioRoom">
            <p class="accent--text">Connecting audio...</p>
          </template>
          <template v-else>
            <BaseButton @click="$emit('mute-button-pressed')" :icon="isMuted ? 'mdi-microphone-off' : 'mdi-microphone'" color="black" :stopPropagation="false" small>
              {{ isMuted ? "Unmute" : "Mute" }}
            </BaseButton>
            <BaseButton @click="$router.push(`/class/${$route.params.class_id}`)" small icon="mdi-phone-off" color="red" :stopPropagation="false">
              Disconnect
            </BaseButton>
          </template>
        </div>
      </v-container>

      <v-divider/>

      <v-container class="pr-0" v-if="hasConnectedToTwilioRoom">
        <div v-for="p in otherClients" :key="p.uid" :class="['d-flex', `${ p.id === dominantSpeakerUID ? 'font-weight-black' : '' }`]">
          <template v-if="p.uid !== currentClient.uid">
            {{ p.firstName + " " + p.lastName }}

            <v-spacer/>

            <v-icon v-if="!uidToIsMicEnabled[p.uid]" small>
              mdi-microphone-off
            </v-icon>
          </template>
        </div>
      </v-container>
    </div>
  </div>
</template>

<script>
import BaseButton from "@/components/BaseButton.vue"; 

export default {
  props: {
    i: {
      type: Number,
      required: true,
    },
    hasConnectedToTwilioRoom: {
      type: Boolean,
      required: true
    },
    currentClient: {
      type: Object,
      required: true
    },
    otherClients: {
      type: Array
    },
    isMuted: {
      type: Boolean,
      required: true
    },
    dominantSpeakerUID: {
      type: null
    },
    uidToIsMicEnabled: {
      type: Object
    }
  },
  components: {
    BaseButton
  },
  data () {
    return {
      // people: [
      //   { id: "123", name: "Richard Feynman", isMuted: true, isSpeaking: true },
      //   { id: "xyc", name: "Peter Dourmashkin", isMuted: false, isSpeaking: false },
      //   { id: "abc", name: "Joseph Formaggio", isMuted: true, isSpeaking: true }
      // ]
    };
  }
}
</script>