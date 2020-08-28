<template>
  <div style="width: 100%;">
    <slot
      :dominantSpeakerUID="dominantParticipantUid"
      :hasConnectedToTwilio="twilioInitialized"
      :toggleMute="toggleIsMicEnabled"
      :isMuted="!isMicEnabled"
      :uidToIsMicEnabled="participantAudioStatus"
    >

    </slot>
    <!-- audio and video streams will be injected into this element -->
    <div id="remote-audio-div"></div>

    <!-- Helps user fix audio issues if an error shows up -->
    <v-dialog persistent max-width="600px" v-model="isShowingErrorPopup"> 
      <v-card>
        <v-card-title>
          Couldn't connect to audio 
        </v-card-title>
        <v-card-text>
          <h3>Why audio isn't working</h3>
          <p>{{ whyItFailed }}</p>
          <h3>How to fix it</h3>
          <p>{{ howToFix }}</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer/>
          <v-btn @click="isShowingErrorPopup = false" text color="secondary">
            GOT IT
          </v-btn>
        </v-card-actions>
      </v-card> 
    </v-dialog> 
  </div>
</template>

<script>
/**
 * 
 * @see screencapture https://www.twilio.com/docs/video/screen-capture-chrome
 * @see https://www.twilio.com/docs/video
 * @see API https://www.twilio.com/docs/video/tutorials/understanding-video-rooms-apis
 * @see BestPractices https://www.twilio.com/docs/video/build-js-video-application-recommendations-and-best-practices
 */
import db from "@/database.js";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import { Carousel, Slide } from 'vue-carousel';
import Twilio from "twilio-video";
import { twilioCreds } from "@/twiliocreds.js";
import { mapState } from "vuex";
import BaseButton from "@/components/BaseButton.vue";
import Vue from "vue";

export default {
  props: {
    roomID: {
      type: String,
      required: true
    },
    audioDevices: Object,
  },
  mixins: [
    DatabaseHelpersMixin
  ],
  components: {
    Carousel,
    Slide,
    BaseButton,
  },
  data () {
    return {
      firebaseUnsubscribeFuncs: [],
      
      // Begin firebase documents
      roomDoc: null,
      // End firebase documents
      
      isShowingErrorPopup: false,
      whyItFailed: "",
      howToFix: "",
      
      twilioRoom: null,
      twilioInitialized: false,
      
      isMicEnabled: true,
      
      // Contains connected participants with a published audio stream
      // Maps uid to the remote participants isMicEnabled value
      participantAudioStatus: {},
      
      // The remote participant uid with the loudest audioTrack
      // null means either there are no participants,
      // or no participants are speaking
      dominantParticipantUid: null
    };
  },
  computed: {
    ...mapState(["user"]),
    classId () {
      return this.$route.params.class_id;
    },
    roomId () {
      return this.$route.params.room_id;
    },
  },
  async created () {
    await this.connectToTwilioRoom();
    const roomDocRef = db.doc(`classes/${this.classId}/rooms/${this.roomId}`);
    this.$_listenToDoc(roomDocRef, this, "roomDoc")
        .then(unsubscribe => this.firebaseUnsubscribeFuncs.push(unsubscribe));
  },
  beforeDestroy () {
    for (const unsubscribe of this.firebaseUnsubscribeFuncs) {
      unsubscribe();
    }
  },
  destroyed () {
    if (this.twilioRoom) {
      this.twilioRoom.disconnect();
      window.removeEventListener("beforeunload", this.twilioRoom.disconnect);
      window.removeEventListener("pagehide", this.twilioRoom.disconnect);
      console.log("Disconnected from Twilio room.");
    }
  },
  watch: {
    isMicEnabled: {
      handler: 'isMicEnabledHandler'
    },
    roomDoc (newVal, oldVal) {
      // Check if we need to enable trigger a muteAll
      if (oldVal !== null && newVal.muteAllCounter != oldVal.muteAllCounter) {
        if (this.isMicEnabled) {
          this.isMicEnabled = false;
          this.$root.$emit("show-snackbar", "You were muted by an admin.");
        }
      }
    },
    audioDevices () {
      console.log('connecting');
      this.connectToTwilioRoom();
    }
  },
  methods: {
    async connectToTwilioRoom () {
      if (!Twilio.isSupported) {
        this.isShowingErrorPopup = true; 
        this.whyItFailed = "Your browser/device combination does not support audio/video/screensharing."; 
        this.howToFix = `
          For iPads, use iOS Safari. 
          For MacBooks, use MacOS Chrome, Firefox or Safari. 
          For Windows, use Chrome or Firefox. 
          For Linux, use Chrome or Firefox. 
        `;
        return;
      }
      
      // You can succesfully connect only if you give mic permissions
      try {
        // const localAudioTracks = Twilio.createLocalTracks({ audio: { deviceId: this.audioDevices.input }});
        this.twilioRoom = await Twilio.connect(this.getAccessToken(), { 
          name: this.roomID,
          // tracks: localAudioTracks,
          audio: true,
          dominantSpeaker: true
        }); // video: { width: 640 }
      } catch (error) {
        this.tellUserHowToFixError(error);
        return;
      }

      // don't tell the user "successfully connected" because they'll expect that they can hear and talk,
      // but actually it takes another 1-3 seconds to be able to
  
      // handle disconnections so other participants get notified immediately 
      window.addEventListener("beforeunload", this.twilioRoom.disconnect);
      window.addEventListener("pagehide", this.twilioRoom.disconnect);
            
      // Set up event handlers
      this.twilioRoom.participants.forEach(this.participantOnConnect); // existing participants
      this.twilioRoom.on("participantConnected", this.participantOnConnect);
      this.twilioRoom.on("participantDisconnected", this.participantOnDisconnect);
      this.twilioRoom.on("dominantSpeakerChanged", this.onDominantSpeakerChanged);
      
      this.twilioInitialized = true;
    },
    toggleIsMicEnabled () {
      this.isMicEnabled = !this.isMicEnabled;
    },
    // Updates localParticipant audioTracks based on passed in val
    isMicEnabledHandler (val) {
      if (!this.twilioRoom) return;
      if (val) {
        this.twilioRoom.localParticipant.audioTracks.forEach(
          publication => publication.track.enable()
        );
      } else {
        this.twilioRoom.localParticipant.audioTracks.forEach(
          publication => publication.track.disable()
        );
      }
    },
    /*
     * A track is a stream of bytes that contain the data generated by a multimedia source such as a microphone or a camera.
     * Each track is wrapped by a publication.
     * For details on emitted events,
     * @see https://www.twilio.com/docs/video/migrating-1x-2x#whats-changed
     */
    participantOnConnect (participant) {
      console.log("Participant onConnect", participant.identity);
      
      const tryHandleAudioTrack = (track) => {
        if (track.kind != "audio") return;
        const audioTrack = track;
        console.log("Handling audioTrack:", audioTrack.name);
        
        const setStatus = () => Vue.set(
          this.participantAudioStatus,
          participant.identity,
          audioTrack.isEnabled
        );
        setStatus();
        audioTrack.on('disabled', setStatus);
        audioTrack.on('enabled', setStatus);
        
        this.mountAudioTrack(audioTrack);
      };
      
      const handleTrack = (track) => {
        tryHandleAudioTrack(track);
        // TODO: Add tryHandleVideoTrack
      }
      
      const handlePublication = (publication) => {
        console.log("Handling publication...");
        if (publication.isSubscribed) {
          handleTrack(publication.track);
        }
      }
      
      participant.tracks.forEach(handlePublication);
      participant.on("trackSubscribed", handleTrack);
      participant.on("trackUnsubscribed", this.unmountTrack);
    },
    participantOnDisconnect(participant) {
      console.log("Participant onDisconnect", participant.identity);
      Vue.delete(this.participantAudioStatus, participant.identity);
      this.unmountParticipantTracks(participant);
    },
    onDominantSpeakerChanged(participant) {
      console.log("dominantSpeakerChanged =", participant);
      this.dominantParticipantUid = participant ? participant.identity : null;
      this.$store.commit("SET_DOMINANT_SPEAKER_UID", this.dominantParticipantUid);
    },
    /**
     * The functions below takes in a track (audio or video)
     * and makes it observable or not observable to the user.
     * 
     * track.attach() = 
     *   <audio autoplay></audio>
     *   <video autoplay playsinline></video>
     *   ...etc.
     * 
     * TODO: Add support for mounting video tracks
     */
    async mountAudioTrack (audioTrack) {
      console.assert(audioTrack.kind == "audio");
      const audioElement = audioTrack.attach();
      if ( this.audioDevices && this.audioDevices.output ) await audioElement.setSinkId(this.audioDevices.output);
      document.getElementById(
        "remote-audio-div"
      ).appendChild(audioElement);
    },
    unmountTrack (track) {
      console.log("Unmounting track:", track.name);
      const htmlElements = track.detach();
      for (const element of htmlElements) {
        element.remove();
      }
    },
    unmountParticipantTracks (participant) {
      // Unmounts published tracks by the participant
      // should be called when the participant disconnects
      console.log("Unmounting participant:", participant.identity);
      for (const publication in participant.tracks) {
        if (publication.track) {
          this.unmountTrack(publication.track);
        }
      }
    },
    /*async shareScreen () {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia();
        const screenTrack = new Twilio.LocalVideoTrack(stream.getTracks()[0]);
        this.twilioRoom.localParticipant.publishTrack(screenTrack);
      } catch (error) {
        this.tellUserHowToFixError(error);
      }
    },*/
    /**
     * Creates an "access token" that is required to join a Twilio room.
     * 
     * @see https://www.twilio.com/docs/video/tutorials/user-identity-access-tokens
     */
    getAccessToken () {
      const AccessToken = require('twilio').jwt.AccessToken;
      const VideoGrant = AccessToken.VideoGrant;
      const token = new AccessToken(
        twilioCreds.ACCOUNT_SID,
        twilioCreds.API_KEY_SID,
        twilioCreds.API_KEY_SECRET
      );
      // TODO: want unique identifiers for each device
      token.identity = this.user.uid; 

      // Create a Video grant which enables a client to use Video 
      const videoGrant = new VideoGrant();
      token.addGrant(videoGrant);

      // Serialize the token to a JWT string
      return token.toJwt();
    },
    tellUserHowToFixError (error) {
      this.isShowingErrorPopup = true; 

      // give a specific, helpful error message
      if (error.name === "NotFoundError") {
        this.whyItFailed = `Your laptop or iPad's audio device is currently disabled in this browser.`;
        this.howToFix = `Enable your audio device for the browser in the system settings.`;
      } else if (error.name === "NotAllowedError") {
        this.whyItFailed = `At some point, you dismissed or denied the popup that asked for access to your microphone`
        this.howToFix = `
          Give access to your microphone by doing the following steps: 
            1. Click the small, circular "i" button near the left of "https://explain.mit.edu/...." 
            2. Find the settings somewhere for the audio microphone and switch to "allow" 
            3. Reload the entire website.
        `;
      } else {
        this.whyItFailed = `Failed to acquire audio media because: ${error.message}`;
        this.howToFix = ""; 
      }
    }
  }
}
</script>

<style scoped>
.screen-share-container{
	/* height: 300px; */
}
.video-display{
	bottom: 0%;
	opacity: 1;
	z-index: 1000;
	padding: 0;
	margin: 0;
}
.video-row{
	padding: 0;
	margin: auto;
	margin-left: 35px;
	max-width: 1224px;
	left: 0%;
}
.video-chat-container .video-row{
	background: rgba(255,255,255,0.5);
	box-shadow: 0 0 10px;
	border-radius: 10px;
	padding: 2px;
	margin: auto;
}
@media (max-width: 600px) {
	.video-row {
		max-width: 248px;
	}
}
@media (max-width: 850px) and (min-width: 601px) {
	.video-row {
		max-width: 492px;
	}
}
@media (max-width: 1100px) and (min-width: 851px) {
	.video-row {
		max-width: 736px;
	}
}
@media (max-width: 1350px) and (min-width: 1101px) {
	.video-row {
		max-width: 980px;
	}
}

.video-col{
	padding: 2px;
}
.video-chat-container .video-col{
	margin: auto;
}

.video-container-wrapper{
	height: 135px;
	width: 240px;
	position: relative;
	border-style: solid;
	border-color: var(--v-accent-base);
	background-color: #333;
	border-radius: 10px;
}
.video-container-wrapper .video-container{
	bottom: 0; 
	position: absolute; 
	width:100%;
	height: 100%;
	display: flex;
	justify-content: center;
	align-items: center;
}
.video-container-wrapper .display-bar{
	position: absolute;
	bottom: 0px;
	left: 0px;
	height: 20%;
	width: 100%;
}
.display-bar .name-container{
	background-color: rgb(31, 31, 31);
	color: white; 
	position:absolute; 
	bottom: 0px; 
	font-size: 12px;
	text-align: center;
	padding-left: 5px;
	padding-right: 5px;
	left: 0px;
	border-bottom-left-radius: 6px;
}
.display-bar .local-buttons-container{
	position: absolute;
	right: 0px;
}
.display-bar .participant-mic{
	position: absolute;
	right: 0px;
	color: white; 
	bottom: 0px;
}
.mini-view-container{
	height: 30px;
	width: 240px;
	position: relative;
	border-style: solid;
	border-color: var(--v-accent-base);
	background-color:black;
	border-radius: 10px;
}
</style>

<style>
.video-chat-container  .VueCarousel-navigation-button {
	color: rgba(255,255,255,0.7) !important;
}
.video-chat-container  .VueCarousel-navigation-button {
	color: white !important;
	text-shadow: 0 0 10px;
}
</style>