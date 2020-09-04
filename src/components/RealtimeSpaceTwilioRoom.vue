<template>
  <div>
    <!-- Display videos above the shared blackboard -->
    <portal to="destination">
      <div class="d-flex">
        <div id="local-video"> 

        </div>
        <div id="remote-video-div"> 

        </div>
      </div>
    </portal>

    <div id="remote-audio-div"> 

    </div>

    <!-- Display current user's connection state and options -->
    <portal to="destination2">
      <p v-if="!twilioInitialized" class="accent--text">
        Connecting audio...
      </p>
      <template v-else>
        <p class="green--text mt-1">
          Connected 
        </p>
        <v-row class="d-flex" justify="space-around">
          <!-- Mute button -->
          <v-btn @click="isMicEnabled = !isMicEnabled" fab color="grey" class="white--text" depressed>
            <v-icon large>{{ isMicEnabled ? 'mdi-microphone' : 'mdi-microphone-off'  }}</v-icon>
          </v-btn>
          
          <!-- Deafen button -->
          <v-btn @click="isDeafened = !isDeafened" fab color="grey" class="white--text" depressed>
            <v-icon large>{{ isDeafened ? 'mdi-headset-off' : 'mdi-headset' }}</v-icon>
          </v-btn>

          <!-- Disconnect button -->
          <v-btn @click.stop.prevent="$router.push(`/class/${$route.params.class_id}`)" fab color="red" class="white--text" depressed>
            <v-icon large>mdi-phone-hangup</v-icon>
          </v-btn>
        </v-row>
      </template>
    </portal>

    <portal to="destination3">
      <template v-if="allClients">
        <div v-for="client in allClients"
          :key="client.id" 
          :class="['d-flex', `${dominantParticipantSessionID === client.sessionID ? 'font-weight-black' : '' }`]"
          style="font-size: 0.8em"
        >
          {{ client.firstName + " " + client.lastName }}

          <v-spacer/>

          <v-icon v-if="allClientAudioStatuses.hasOwnProperty(client.sessionID)" small>
            {{ allClientAudioStatuses[client.sessionID] ? 'mdi-microphone' : 'mdi-microphone-off' }}
          </v-icon>
        </div>
      </template>
    </portal>

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
    }
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
      allClients: null,

      roomDoc: null,

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
      isVideoEnabled: false,
      isDeafened: false,
      isSharingScreen: false,

      cameraTrack: null,
      micTrack: null,
      screenTrack: null,
      
      // Contains connected participants with a published audio stream
      // Maps sessionID to the remote participants isMicEnabled value
      participantAudioStatus: {},
      participantVideoStatus: {},
      participantDeafenedStatus: {},
      
      // The remote participant sessionID with the loudest audioTrack
      // null means either there are no other participants, or no participants are speaking
      dominantParticipantSessionID: null
    };
  },
  computed: {
    ...mapState([
      "user",
      "session"
    ]),
    sessionID () { return this.session.currentID; },
    classId () { return this.$route.params.class_id; },
    roomId () { return this.$route.params.room_id; },
  },
  watch: {
    allClients () {
      console.log("allClients changed =", this.allClients); 
    }
  },
  watch: {
    allClients () {
      console.log("allClients changed =", this.allClients); 
    }
  },
  async created () {
<<<<<<< Updated upstream
<<<<<<< Updated upstream
    await this.connectToTwilioRoom();
    const roomDocRef = db.doc(`classes/${this.classId}/rooms/${this.roomId}`);
    this.$_listenToDoc(roomDocRef, this, "roomDoc")
        .then(unsubscribe => this.firebaseUnsubscribeFuncs.push(unsubscribe));
=======
    // quickfix for the missing prop this.allClients
    const participantsQuery = db.collection(`/class/${this.$route.params.class_id}/participants`)
      .where("currentRoom", "==", this.$route.params.room_id);
=======
    // quickfix for the missing prop this.allClients
    const participantsQuery = db.collection(`/class/${this.$route.params.class_id}/participants`)
      .where("curentRoom", "==", this.$route.params.room_id);
>>>>>>> Stashed changes

    // then the watch hook will do the trick
    this.$_listenToCollection(participantsQuery, this, "allClients").then(unsubFunc => {
      this.firebaseUnsubscribeFuncs.push(unsubFunc);
    });

    if (!this.isTwilioSupportedByBrowser()) {
      return; 
    }
    try {
      this.twilioRoom = await Twilio.connect(this.getAccessToken(), { 
        name: this.roomID,
        audio: true, // should be able to just connect without anything
        dominantSpeaker: true
        // video: { width: 640 }
      }); 
    } catch (error) {
      this.tellUserHowToFixError(error);
      return;
    }
    
    // others => me
    this.twilioRoom.participants.forEach(
      participant => this.handleHisOrHerTracks(participant)
    );
    
    this.twilioRoom.on("participantConnected", 
      participant => this.handleHisOrHerTracks(participant)
    );

    this.twilioRoom.on("participantDisconnected", participant => {
      Vue.delete(this.participantAudioStatus, participant.identity);
      this.removeHisOrHerSharedTracks(participant);
    });

    this.twilioRoom.on("dominantSpeakerChanged", participant => {
      if (!participant) console.log("participant is null!"); 
      this.dominantParticipantSessionID = participant ? participant.identity : null;
    });

    // me => others
    window.addEventListener("beforeunload", this.twilioRoom.disconnect);
    window.addEventListener("pagehide", this.twilioRoom.disconnect);
    
    // to detect the mute all TODO: refactor
    this.$_listenToDoc(
      db.doc(`classes/${this.$route.params.class_id}/rooms/${this.roomID}`),
      this, 
      "roomDoc"
    ).then(unsubscribe => this.firebaseUnsubscribeFuncs.push(unsubscribe));

    this.twilioInitialized = true;
>>>>>>> Stashed changes
  },
  beforeDestroy () {
    // remove the "mute everyone" listener
    for (const unsubscribe of this.firebaseUnsubscribeFuncs) {
      unsubscribe();
    }

    // disable camera, mic, etc. to turn off the lights
    if (this.cameraTrack) this.cameraTrack.stop();
    if (this.micTrack) this.micTrack.stop();
    if (this.screenTrack) this.screenTrack.stop(); 

    if (this.twilioRoom) {
      // stop displaying other people's tracks
      this.twilioRoom.participants.forEach(otherPerson => {
        this.removeHisOrHerSharedTracks(otherPerson);
      });

      // notify other people that I disconnected
      this.twilioRoom.disconnect();
      window.removeEventListener("beforeunload", this.twilioRoom.disconnect);
      window.removeEventListener("pagehide", this.twilioRoom.disconnect);
      console.log("Disconnected from Twilio room.");
    }
  },
  watch: {
    isMicEnabled (isEnabled) {
      if (!this.twilioRoom) return;
      if (isEnabled) {
        this.twilioRoom.localParticipant.audioTracks.forEach(
          publication => publication.track.enable()
        );
      } else {
        this.twilioRoom.localParticipant.audioTracks.forEach(
          publication => publication.track.disable()
        );
      }
    },
<<<<<<< Updated upstream
    async isVideoEnabled (isEnabled) {
      if (isEnabled) {
        const { createLocalVideoTrack } = require('twilio-video');
        const videoTrack = await createLocalVideoTrack();
        videoTrack.enable();

        // Display the video preview.
        const divContainer = document.getElementById('local-video');
        const videoElement = videoTrack.attach();
        videoElement.height = 100; 
        videoElement.width = 200;
        divContainer.appendChild(videoElement);
            
        // publish the video tracks to other people
        this.twilioRoom.localParticipant.publishTrack(videoTrack);
=======
    async isCameraEnabled (newValue) {
      if (newValue) {
        this.cameraTrack = await Twilio.createLocalVideoTrack();
        this.cameraTrack.enable();
        this.shareMyVisualTrackWithEveryone(this.cameraTrack);
      } 
      else {
        this.stopSharingMyVisualTracks();
      }
    },
    async isSharingScreen (newValue) {
      if (newValue) {
        try {
          // I think audio: false prevents MacOS Safari from throwing a"type error"
          const myScreenStream = await navigator.mediaDevices.getDisplayMedia({ audio: false });
          this.shareMyVisualTrackWithEveryone(
            new Twilio.LocalVideoTrack(myScreenStream.getTracks()[0])
          );
        } catch (error) {
          this.tellUserHowToFixError(error);
        }
>>>>>>> Stashed changes
      } 
      else {
        this.twilioRoom.localParticipant.videoTracks.forEach(publication => {
          publication.track.disable(); // other people
          this.unmountTrack(publication.track); // hide local preview
        });
      }
    },
    isDeafened (isDeafened) {
      if (isDeafened) {
        this.isMicEnabled = false; // mute myself 

        // silence other people
        this.twilioRoom.participants.forEach(person => {
          person.audioTracks.forEach(publication => this.unmountTrack(publication.track));
        }); 
      } 
      else {
        this.isMicEnabled = true; // unmute myself
        
        // unsilence other people 
        this.twilioRoom.participants.forEach(person => {
          person.audioTracks.forEach(publication => {
            if (publication.isSubscribed) {
              this.mountAudioTrack(publication.track);
            }
          });
        }); 
      }
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
        this.twilioRoom = await Twilio.connect(this.getAccessToken(), { 
          name: this.roomID,
          audio: true,
          dominantSpeaker: true
        }); // video: { width: 640 }
      } catch (error) {
        this.tellUserHowToFixError(error);
        return;
      }

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
    toggleDeafen () {
      this.isDeafened = !this.isDeafened;
    },
    toggleIsVideoEnabled () {
      this.isVideoEnabled = !this.isVideoEnabled;
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

<<<<<<< Updated upstream
      const tryHandleVideoTrack = (track) => {
        if (track.kind != "video") return;
        const videoTrack = track;
        
        const setStatus = () => {
          Vue.set(
            this.participantVideoStatus,
            participant.identity,
            videoTrack.isEnabled
          );

           // quick-fix: it's necessary but should be refactored
           // however this is confusing and hard to understand
          // when someone else turns off their video, I will unmount their video from DOM
          if (!videoTrack.isEnabled) {
            console.log("someone turned off their video");
            this.unmountTrack(videoTrack);
          }
        
        }
        setStatus();

        videoTrack.on('disabled', setStatus);
        videoTrack.on('enabled', setStatus);
        
        this.mountVideoTrack(videoTrack);
      };
      
      const handleTrack = (track) => {
        console.log("handleTrack track =", track);
        tryHandleAudioTrack(track);
        tryHandleVideoTrack(track); 
      }
      
      const handlePublication = (publication) => {
        if (publication.isSubscribed) {
          handleTrack(publication.track);
        }
      }
      
      participant.tracks.forEach(handlePublication);

      // whenever someone publishes a track i.e. audio/video/screen, we'll be informed (automatically subscribed)
      participant.on("trackSubscribed", handleTrack);
=======
      // display local feedback 
      const htmlVideoElement = visualTrack.attach();
      htmlVideoElement.height = 150; 
      htmlVideoElement.width = 210;
      document.getElementById("local-video").appendChild(htmlVideoElement);
    },
    stopSharingMyVisualTracks () {
      this.twilioRoom.localParticipant.videoTracks.forEach(publication => {
        // publication.track.disable(); 
        publication.unpublish();
>>>>>>> Stashed changes

      // whenever someone else unpublishes a track, we'll remove it
      participant.on("trackUnsubscribed", this.unmountTrack);
    },
    participantOnDisconnect(participant) {
      Vue.delete(this.participantAudioStatus, participant.identity);
      Vue.delete(this.participantVideoStatus, participant.identity);
      this.unmountParticipantTracks(participant);
    },
    onDominantSpeakerChanged(participant) {
      this.dominantParticipantSessionID = participant ? participant.identity : null;
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
      if (this.audioDevices && this.audioDevices.output) {
        await audioElement.setSinkId(this.audioDevices.output);
      }
      document.getElementById(
        "remote-audio-div"
      ).appendChild(audioElement);
    },
    async mountVideoTrack (videoTrack) {
      console.assert(videoTrack.kind == "video");
      const videoElement = videoTrack.attach();
      // make smaller
      videoElement.height = 150;
      videoElement.width = 300;
      videoElement.controls = true; // allow the user to fullscreen
      document.getElementById("remote-video-div").appendChild(videoElement);
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
      for (const publication in participant.tracks) {
        if (publication.track) {
          this.unmountTrack(publication.track);
        }
      }
    },
    /**
     * No need to display local feedback as the browser already says "Currently sharing screen"
     */
    async shareScreen () {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia();
        const screenTrack = new Twilio.LocalVideoTrack(stream.getTracks()[0]);
        this.twilioRoom.localParticipant.publishTrack(screenTrack);
      } catch (error) {
        this.tellUserHowToFixError(error);
      }
    },
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
      token.identity = this.sessionID;

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
          Try to find the settings for your microphone, and click enable. The below steps usually works:
            1. Find a button (a lock icon or an "i" button or something else) near the left of "https://explain.mit.edu/...." 
            2. Find the settings somewhere for the audio microphone and switch to "allow" 
            3. Reload the entire website. 
          If that doesn't work, try switching browsers e.g. flip between Safari and Chrome. 
          If that still doesn't work, you can Facetime me +886 965 602 567. 
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