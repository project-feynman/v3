<template>
  <div>
    <v-btn v-if="!isUsingJisti" @click="connectToJisti()">
      Connect audio and video
    </v-btn>
    <div v-if="isUsingJisti" 
      id="jisti-video-conference" 
      style="height: 200px"
    >

    </div>
  </div>
</template>

<script>
import { mapState } from "vuex"; 

export default {
  props: {
    roomID: {
      type: String,
      required: true
    }
  },
  data () {
    return {
      api: null,
      isUsingJisti: false
    };
  },
  computed: {
    ...mapState(["user", "canHearAudio"])
  },
  mounted () {
    // TODO: rename `canHearAudio` to `hasJoinedAVRoomAlready`
    if (this.canHearAudio) {
      this.connectToJisti(); 
    }
  },
  methods: {
    async connectToJisti () {
      this.$store.commit("SET_CAN_HEAR_AUDIO", true);
      this.isUsingJisti = true; 
      await this.$nextTick(); // otherwise the API mounting fails 

      const domain = 'meet.jit.si'; 
      const options = {
        parentNode: document.querySelector("#jisti-video-conference"),
        roomName: this.roomID,
        userInfo: {
          displayName: `${this.user.firstName} ${this.user.lastName} `
        },
        configOverwrite: {
          enableWelcomePage: false,
          // lower the bandwidth
          constraints: {
            video: {
              height: {
                ideal: 480,
                max: 720,
                min: 240
              }
            }
          }
        },
        interfaceConfigOverwrite: {
          // hide misleading steps in connecting
          MOBILE_APP_PROMO: false, // don't mislead the user to download an app
          DISPLAY_WELCOME_PAGE_CONTENT: false,

          // clean up other UI clutter related to promos and branding
          SHOW_JITSI_WATERMARK: false,
          SHOW_CHROME_EXTENSION_BANNER: false,
          APP_NAME: "Video Comms",

          // configure UI for displaying videos
          VERTICAL_FILMSTRIP: false,
          filmStripOnly: true,
          // TILE_VIEW_MAX_COLUMNS: 5,

          // simplify UI by removing unnecessary features
          HIDE_INVITE_MORE_HEADER: true,
          SETTINGS_SECTIONS: [ 'devices', 'moderator'],
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
            'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
            'etherpad', 'settings', 'raisehand',
            'videoquality', 'filmstrip', 'feedback', 'stats',
            'tileview', 'download', 'mute-everyone', 
          ],
        },
        // events here
        onload: (argument) => {
          console.log("argument =", argument);
          // this.isUsingJisti = !this.isUsingJisti; 
        }
      }; 
      this.api = new JitsiMeetExternalAPI(domain, options);
      this.api.addEventListener("videoConferenceLeft", roomName => {
        this.isUsingJisti = false;
        this.$store.commit("SET_CAN_HEAR_AUDIO", false);
      })
    }
  }
};
</script>