<template>
  <div>
    <portal to="left-side-panel-current-room">
      <div id="container-for-video-elements">

      </div>
    </portal> 

    <div id="container-for-audio-elements">

    </div>

    <p v-for="participant in participants" :key="participant.user_id + 'log'">
      {{ participant.user_name + participant.user_id }}
    </p>

    <portal to="current-room-participants">
      <template v-if="connectionState !== 'CONNECTED'">
        <v-btn @click.prevent.stop="joinConferenceRoom()" :loading="connectionState === 'CONNECTING'"
          small dark fab color="success" class="mx-2"
        >
          <v-icon>mdi-phone</v-icon>
        </v-btn>
      </template>

      <template v-else>
        <!-- Toggle Microphone -->
        <v-switch
          :input-value="isMicOn"
          @change="toggleMic(); $store.commit('SET_IS_MIC_ON', !isMicOn)"
          :prepend-icon="isMicOn ? 'mdi-microphone' : 'mdi-microphone-off'"
          hide-details dense inset class="mt-0 pt-0 grey--text" color="grey darken-3"
        />

        <!-- Toggle Camera -->
        <v-switch 
          :input-value="isCamOn" 
          @change="toggleCam(); $store.commit('SET_IS_CAMERA_ON', !isCamOn)" 
          :loading="false"
          class="ml-1 mt-0 pt-0 grey--text" color="black" prepend-icon="mdi-video" hide-details inset dense
        />

        <v-btn @click.prevent.stop="leaveConferenceRoom()" class="ml-2" x-small dark fab color="red">
          <v-icon small>mdi-phone-hangup</v-icon>
        </v-btn>

        <p>isMicOn: {{ isMicOn }}</p>
        <p>isCamOn: {{ isCamOn }}</p>
        <ol>
          <li v-for="(p, i) in participants" :key="i">
            username: {{ p.user_name }}
            audio: {{ p.audio }}
            video: {{ p.video }}
          </li>
        </ol>
      </template>
    </portal>
  </div>
</template>

<script>
import DailyIframe from '@daily-co/daily-js';

/**
 * Better than Twilio: simple, easy-to-use API, much cheaper
 * Better than Jitsi: more reliable, much easier to use than Jitsi, more reliable future
 *  
 * Problems to figure out: 
 *   - Have restrictions for how many tables you can create on explain.mit.edu, lifecycle of rooms
 *   - Why is the state not accurately reflected
 *   - UI ninja work - how to properly clean-up everything 
 *   - Testing
 * 
 * @see API guide https://docs.daily.co/reference#%EF%B8%8F-createcallobject
 * @see Github demo code https://github.com/daily-demos/call-object-react/blob/main/src/components/Call/Call.js
 */

export default {
  data () {
    return {
      CallObject: null,
      connectionState: "NOT_CONNECTED",
      participants: {}
    };
  },
  computed: {
    user () { return this.$store.state.user },
    isMicOn () { return this.participants.local.audio; },
    isCamOn () { return this.participants.local.video; }
  },
  created () {
    this.CallObject = DailyIframe.createCallObject(); 

    this.CallObject.on("joined-meeting", ({ participants }) => {
      this.updateParticipants(); 
    });

    this.CallObject.on("participant-joined", (participant) => {      
      this.updateParticipants(); 
    });

    this.CallObject.on("participant-updated", (participant) => {
      console.log("participant-updated");
      this.updateParticipants(); 
    });

    this.CallObject.on("track-started", async ({ track, participant }) => {
      this.updateParticipants(); 

      switch (track.kind) {
        case "video": 
          const videoElement = document.createElement("video"); 
          videoElement.srcObject = new MediaStream([track]);
          videoElement.id = "video" + participant.user_id; 
          videoElement.autoplay = true; 
          videoElement.muted = true; 
          videoElement.playsinline = true;
          videoElement.width = 200; 
          videoElement.height = 200; 
        
          document.getElementById("container-for-video-elements").appendChild(videoElement);
          break; 

        case "audio": 
          const audioElement = document.createElement("audio"); 
          audioElement.srcObject = new MediaStream([track]); 
          audioElement.id = "audio" + participant.user_id; 
          audioElement.playsinline = true; 
          audioElement.autoplay = true;
          document.getElementById("container-for-audio-elements").appendChild(audioElement);
          break; 
      }
    });

    this.CallObject.on("track-stopped", async ({ track, participant }) => {
      switch (track.kind) {
        case "video": 
          document.getElementById("video" + participant.user_id).remove();
          break;
        case "audio": 
          // document.getElementById("audio" + participant.user_id).remove(); 
          document.getElementById("audio" + participant.user_id).srcObject = null;
          break;
      }
      this.updateParticipants(); 
    });

    this.CallObject.on("participant-left", (payload) => {
      console.log("participant left, payload =", payload);
      // TODO: unmount all his tracks
      this.updateParticipants(); 
    });
  },
  destroyed () {
    // TODO: clean up code
  },
  methods: {
    async joinConferenceRoom () {
      this.connectionState = "CONNECTING";
      // join a room (create it if it doesn't exist);
      await this.CallObject.join({
        url: `https://feynman.daily.co/${'Ly77BmJeKWudV1FJISnD'}`,
        userName: `${this.user.firstName} ${this.user.lastName}`
      }); 
      this.connectionState = "CONNECTED"; 
      this.updateParticipants();
    },
    updateParticipants () {
      this.participants = {...this.CallObject.participants()};
    },
    toggleMic () {
      this.CallObject.setLocalAudio(!this.isMicOn);
    },
    toggleCam () {
      this.CallObject.setLocalVideo(!this.isCamOn); 
    },
    async leaveConferenceRoom () {
      // TODO: unmount my local camera stream
      await this.CallObject.leave(); 
      await this.CallObject.destroy(); 
      this.connectionState = "NOT_CONNECTED";
    }
    // recomputeSortedParticipants() {
    //   const output = [...this.CallObject.participants()]; 
    //   output.sort((p1, p2) => {
    //     // pin myself to top
    //     if ([p1.user_id, p2.user_id].includes(this.sessionID)) {
    //       return (p2.user_id === this.sessionID) - (p1.user_id === this.sessionID);
    //     }      
    //     // sort primarily by who has camera turned on
    //     else if (p1.video !== p2.video) {
    //       return p1.video - p2.video;
    //     }
    //     // sort secondarily by who is connected to audio 
    //     else if (p1.audio !== p2.audio) {
    //       return p2.audio - p1.audio; 
    //     } 
    //     // sort finally by the highest board number
    //     // else {
    //     //   return p2.currentBoardNumber - p1.currentBoardNumber;
    //     // }
    //   });
    //   this.sortedParticipants = output;
    // }
  }
};
</script>
