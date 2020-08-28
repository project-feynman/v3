<template>
  <v-card width="260">
    <v-card-title class="orange--text pb-0">
      <p class="text-uppercase mb-0">Room {{ i }}</p>
    </v-card-title>
    <v-card-text>
      <slot>

      </slot>
      <v-container fluid>
        <div class="d-flex">
          <p :class="['align-self-center', `${hasConnectedToTwilioRoom ? 'mb-0' : '' }`]">
            {{ currentClient.name }}
          </p>
          <v-spacer/> 
          <template v-if="!hasConnectedToTwilioRoom">
            <p class="orange--text">Connecting audio...</p>
          </template>
          <template v-else>
            <BaseButton @click="$emit('mute-button-pressed')" :icon="isMuted ? 'mdi-microphone-off' : 'mdi-microphone'" color="black" :stopPropagation="false" small>
              {{ isMuted ? "Unmute" : "Mute" }}
            </BaseButton>
            <BaseButton
              small icon="mdi-phone-off" color="red"
              :stopPropagation="false"
              :to="`/class/${$route.params.class_id}`"
              @click.native="$root.$emit(`show-snackbar`, `Disconnected from room.`)"
            >
              Disconnect
            </BaseButton>
          </template>
        </div>
      </v-container>

      <v-divider/>

      <v-container v-if="hasConnectedToTwilioRoom">
        <div v-for="p in otherClients" :key="p.uid" :class="['d-flex', `${ p.uid === dominantSpeakerUID ? 'font-weight-black' : '' }`]">
          <template v-if="p.uid !== currentClient.uid">
            {{ p.firstName + " " + p.lastName }}

            <v-spacer/>

            <v-icon v-if="!uidToIsMicEnabled[p.uid]" small>
              mdi-microphone-off
            </v-icon>
          </template>
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