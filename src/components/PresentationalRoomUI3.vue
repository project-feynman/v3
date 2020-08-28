<template>
  <div style="width: 100%">
    <div class="room-title accent--text pb-0">
      <h3>Room {{ i }}</h3>
      <slot>

      </slot>
    </div>
    <div>
      <v-container class="pr-0" fluid>
        <div class="d-flex flex-column">
          <p :class="[`${hasConnectedToTwilioRoom ? 'mb-0' : '' }`]">
            {{ currentClient.name }}
          </p>
          <div>
            <template v-if="!hasConnectedToTwilioRoom">
              <p class="accent--text">Connecting audio...</p>
            </template>
            <template v-else>
              <BaseButton @click="$emit('mute-button-pressed')" :icon="isMuted ? 'mdi-microphone-off' : 'mdi-microphone'" color="#555" :stopPropagation="false" small>
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
            <BaseButton
              small icon="mdi-settings" color="#555"
              :stopPropagation="false"
              @click="audioSettingsPopup = true"
            >
              Settings
            </BaseButton>
          </div>
          
        </div>
      </v-container>

      <v-divider/>

      <v-container class="pr-0" v-if="hasConnectedToTwilioRoom">
        <div v-for="p in otherClients" :key="p.sessionID" :class="['d-flex', `${ p.sessionID === dominantParticipantSessionID ? 'font-weight-black' : '' }`]">
          <template v-if="p.sessionID !== currentClient.sessionID">
            {{ p.firstName + " " + p.lastName }}

            <v-spacer/>

            <v-icon v-if="sessionIDToIsMicEnabled.hasOwnProperty(p.sessionID)" small>
              {{ sessionIDToIsMicEnabled[p.sessionID] ? 'mdi-microphone' : 'mdi-microphone-off' }}
            </v-icon>
          </template>
        </div>
      </v-container>
    </div>
    
    <v-dialog :value="audioSettingsPopup" persistent max-width="600px">
      <v-card>
        <v-card-title>
          <span class="headline">
            Audio Devices Settings
          </span>
        </v-card-title>
        <v-card-text>
          <v-select
            :items="audioOutputDevices"
            v-model="audioOutput"
            label="Select Audio Output Device"
          ></v-select>
          <v-select
            :items="audioInputDevices"
            v-model="audioInput"
            label="Select Audio Input Device"
          ></v-select>
        </v-card-text>
        <v-card-actions>
          <v-spacer/>
          <v-btn @click="audioSettingsPopup = false" color="secondary" text>
            Cancel
          </v-btn>
          <v-btn
            @click="changeAudioDevice()"
            color="secondary"
            text
          >
            Use These Devices
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
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
    dominantParticipantSessionID: {
      type: null
    },
    sessionIDToIsMicEnabled: {
      type: Object
    }
  },
  components: {
    BaseButton
  },
  data () {
    return {
      audioSettingsPopup: false,
      audioOutputDevices: [],
      audioInputDevices: [],
      audioInput: '',
      audioOutput: '',
      // people: [
      //   { id: "123", name: "Richard Feynman", isMuted: true, isSpeaking: true },
      //   { id: "xyc", name: "Peter Dourmashkin", isMuted: false, isSpeaking: false },
      //   { id: "abc", name: "Joseph Formaggio", isMuted: true, isSpeaking: true }
      // ]
    };
  },
  async created () {
    const devices = await navigator.mediaDevices.enumerateDevices();
    
    const audioOutputDevices = devices.filter(device => device.kind === 'audiooutput');
    const audioInputDevices = devices.filter(device => device.kind === 'audioinput');

    const audioOutputDevicesName = audioOutputDevices.map(device => ({'text': device.label, 'value': device.deviceId}));
    const audioInputDevicesName = audioInputDevices.map(device => ({'text': device.label, 'value': device.deviceId}));

    this.audioOutputDevices = audioOutputDevicesName;
    this.audioInputDevices = audioInputDevicesName;

  },
  methods: {
    changeAudioDevice () {
      this.$emit('audio-device-change', {'input': this.audioInput, 'output': this.audioOutput});
      this.audioSettingsPopup = false;
    }
  }
}
</script>