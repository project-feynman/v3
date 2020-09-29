<template>
  <v-app>
    <v-btn @click="connectToJisti()">Connect to video call</v-btn>
    <v-btn @click="setVideoQuality()">Set video quality</v-btn>
    <div id="jisti-video-conference" style="height: 300px">
      

    </div>
    <!-- <vue-jitsi-meet
      ref="jitsiRef"
      domain="meet.jit.si"
      :options="jitsiOptions"
    ></vue-jitsi-meet> -->
  </v-app>
</template>

<script>
import { JitsiMeet } from '@mycure/vue-jitsi-meet';

export default {
  // components: {
  //   VueJistiMeet: JistiMeet
  // },
  data () {
    return {
      api: null
    };
  },
  mounted () {
    // this.connectToJisti();
  },
  methods: {
    onIFrameLoad () {
      console.log("do something");
    },
    connectToJisti () {
      const domain = 'meet.jit.si'; 
      const options = {
        parentNode: document.querySelector("#jisti-video-conference"),
        roomName: "my-explain-room-id",
        userInfo: {
          display: "Richard Feynman"
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
        onload: () => console.log("LOADED OR UNLOADED")
      }; 
      this.api = new JitsiMeetExternalAPI(domain, options);
      console.log("jisti initialized, api =", this.api);
      this.api.addEventListener("readyToClose", () => {
        console.log("ready to close");
      });
    },
    setVideoQuality () {
      this.api.executeCommand('setVideoQuality', 200);
      console.log('current quality =', this.api.getVideoQuality());
    }
  }
};
</script>