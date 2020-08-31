<template>
  <div>
    <!-- Audio popup -->
    <!-- <v-dialog :value="audioSettingsPopup" persistent max-width="600px">
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

          <v-btn @click="changeAudioDevice()" color="secondary" text>
            Use These Devices
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog> -->
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
    dominantSpeakerSessionID: {
      type: null,
      required: true
    },
    sessionIDToIsMicEnabled: {
      type: Object
    },
    sessionIDToIsVideoEnabled: {
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