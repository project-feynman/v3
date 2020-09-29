<template>
  <div>
    <template v-if="!isUsingJisti">
      <p class="ma-3">
        To connect to video with iPad, <u>don't download any apps</u> and instead press "launch in web". This is an ongoing issue (https://github.com/jitsi/jitsi-meet/issues/7612), 
        and I intend to resolve this ASAP. Before then, it's necessary to repeat the process everytime you join a room. 
      </p>

      <p class="ma-3">
        The common room has full video conference features</u> whereas 
        other room has minimal features.
      </p>

      <p class="ma-3">
        <b>Tip:</b> Use laptop video and iPad blackboard for the best experience.
      </p>
    </template>

    <v-btn v-if="!isUsingJisti" @click="connectToJisti()" block color="green" class="white--text">
      Connect video
    </v-btn>


    <div v-if="isUsingJisti"
      id="jisti-video-conference" 
      :style="`height: ${isCommonRoom ? '70vh' : '300px'}`"
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
    },
    isCommonRoom: {
      type: Boolean,
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
          displayName: `${this.user.firstName} ${this.user.lastName} `,
          id: this.user.uid
        },
        configOverwrite: {
          enableWelcomePage: false,
          // lower the bandwidth
          // constraints: {
          //   video: {
          //     height: {
          //       ideal: 480,
          //       max: 720,
          //       min: 240
          //     }
          //   }
          // }
        },
        interfaceConfigOverwrite: {
          // hide misleading steps in connecting
          MOBILE_APP_PROMO: false, // don't mislead the user to download an app
          DISPLAY_WELCOME_PAGE_CONTENT: false,

          // clean up other UI clutter related to promos and branding
          SHOW_JITSI_WATERMARK: false,
          SHOW_CHROME_EXTENSION_BANNER: false,
          // APP_NAME: "Video Comms",

          // configure UI for displaying videos
          // VERTICAL_FILMSTRIP: false,
          // VERTICAL_FILMSTRIP: this.isCommonRoom,
          // filmStripOnly: !this.isCommonRoom,
          // TILE_VIEW_MAX_COLUMNS: 5,

          // simplify UI by removing unnecessary features
          HIDE_INVITE_MORE_HEADER: true,
          SETTINGS_SECTIONS: [ 'devices', 'moderator'],
          TOOLBAR_BUTTONS: this.isCommonRoom ? [
            'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
            'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
            'etherpad', 'settings', 'raisehand',
            'videoquality', 'filmstrip', 'feedback', 'stats',
            'tileview', 'download', 'mute-everyone', 
          ] 
          : 
          [
            'microphone', 'camera', 'desktop', 'fullscreen',
            'fodeviceselection', 'hangup', 'chat',
            'settings', 'videoquality', 'filmstrip', 'feedback',
            'tileview', 'mute-everyone', 
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
      });
      this.api.addEventListener("dominantSpeakerChanged", (dominantSpeaker) => {
        console.log("dominantSpeaker =", dominantSpeaker);
        this.$store.commit("SET_DOMINANT_SPEAKER_NAME", this.api.getDisplayName(dominantSpeaker.id));
      });
    }
  }
};
</script>