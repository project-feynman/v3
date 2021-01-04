<template>
  <div>
    <div v-for="participant in participants" :key="participant.user_id">
      <video 
        :id="participant.user_id"
        autoplay muted playsinline width="300" height="300"
      />
      <audio :id="participant.user_id + 'audio'"/>
    </div>
    <p v-for="participant in participants" :key="participant.user-id + 'log'">
      {{ participant.user_id }}
    </p>
    <v-btn @click="joinConferenceRoom()">Join Room</v-btn>
    <v-btn @click="addFakeParticipant()">Add fake participant</v-btn>
  </div>
</template>

<script>
import DailyIframe from '@daily-co/daily-js';

/**
 * @see API guide https://docs.daily.co/reference#%EF%B8%8F-createcallobject
 * @see Github demo code https://github.com/daily-demos/call-object-react/blob/main/src/components/Call/Call.js
 */

export default {
  data () {
    return {
      CallObject: null,
      allParticipants: null,
      cameraStreams: [],
      participants: []
    };
  },
  created () {
    this.CallObject = DailyIframe.createCallObject(); 
    console.log("CallObject =", this.CallObject); 

    this.CallObject.on("joined-meeting", ({ participants }) => {
      this.participants = [...participants]; 
    });

    this.CallObject.on("participant-joined", (participant) => {
      this.participants.push(participant);
    });

    this.CallObject.on("track-started", async ({ track, participant }) => {
      console.log("track-started, track =", track);
      console.log("participant =", participant);
      await this.$nextTick(); // the new <video> or <audio> element doesn't exist yet

      switch (track.kind) {
        case "video": 
          const videoElement = document.getElementById(participant.user_id); 
          videoElement.srcObject = new MediaStream([track]);
          break; 

        case "audio": 
          const audioElement = document.getElementById(participant.user_id + 'audio');
          audioElement.srcObject = new MediaStream([track]); 
          break; 
      }
    });
  },
  destroyed () {
    // TODO: clean up code
  },
  methods: {
    async joinConferenceRoom () {
      console.log("joining room"); 
      await this.CallObject.join({
        url: "https://feynman.daily.co/Ly77BmJeKWudV1FJISnD"
      }); 
      console.log("successfully joined");
    },
    addFakeParticipant() {
      this.CallObject.addFakeParticipant(); 
    }
  }
};
</script>
