<template>
  <div style="width: 100%">
    <div class="room-title accent--text pb-0">
      <h3 class="text-uppercase">Room {{ i }}</h3>
      <slot>

      </slot>
    </div>
    <div>
      <v-container class="pr-0" fluid>
        <div class="d-flex flex-column">
          <p class="mb-0 black--text">
            {{ currentClient.name }}
          </p>
          
          <p v-if="!hasConnectedToTwilioRoom" class="accent--text">
            Connecting audio...
          </p>

          <div v-else>
            <div style="display: flex;">
              <p class="green--text mt-1">Connected</p>

              <v-spacer/>

              <v-btn @click.stop.prevent="$emit('mute-button-pressed')" fab small color="grey" class="white--text" depressed>
                <v-icon>{{ isMuted ? 'mdi-microphone-off' : 'mdi-microphone'  }}</v-icon>
              </v-btn>

              <v-btn @click.stop.prevent="audioSettingsPopup = true" color="grey" fab class="white--text" small depressed> 
                <v-icon>mdi-settings</v-icon>
              </v-btn>

              <v-btn @click.stop.prevent="$emit('disconnect-button-clicked')" fab color="red" small class="white--text" depressed>
                <v-icon>mdi-phone-hangup</v-icon>
              </v-btn>
            </div>
          </div>
        </div>
      </v-container>

      <v-divider/>

      <v-container class="pr-0" v-if="hasConnectedToTwilioRoom">
        <div v-for="p in otherClients" :key="p.sessionID" :class="['d-flex', `${ p.sessionID === dominantSpeakerSessionID ? 'font-weight-black' : '' }`]">
          <template v-if="p.sessionID !== currentClient.sessionID">
            {{ p.firstName + " " + p.lastName }}

            <v-spacer/>

            <v-icon v-if="sessionIDToIsVideoEnabled.hasOwnProperty(p.sessionID)" small>
              {{ sessionIDToIsVideoEnabled[p.sessionID] ? 'mdi-video' : 'mdi-video-off' }}
            </v-icon>

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