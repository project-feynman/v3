<template>
    
    <div class="col-md-6 box">
        <div>
            Your ID is {{this.userInd}}
        </div>
        <v-btn @click="createChat(`my-room`)">
            Enter Room
        </v-btn>
       <div class="roomTitle" >
           <span v-if="loading"> Loading... {{roomName}}</span>
           <span v-else-if="!loading && roomName"> Connected to {{roomName}}</span>
           <span v-else>Select a room to get started</span>
       </div>
       <div class="row remote_video_container">
           <div id="remote-media"></div>
       </div>
       <div class="spacing"></div>
       <div class="row">
           <div id="local-media"></div>
       </div>
       <div>
           {{x}}
       </div>
   </div>
</template> 

<script>
import firebase from "firebase/app";
import db from "@/database.js";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import Twilio, { connect, createLocalTracks, createLocalVideoTrack } from 'twilio-video';
// import axios from 'axios';


export default {
    props: {
        roomId: String,
    },
 data() {
   return {
     loading: false,
     data: {},
     localTrack: false,
     remoteTrack: '',
     activeRoom: '',
     previewTracks: '',
     identity: '',
     roomName: null,
     token: null,
     userInd: null,
     x: ''
   }
 },
 props: ['username'], // props that will be passed to this component
 created() {
    this.roomName = this.roomId;

    let tokens = ["eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiIsImN0eSI6InR3aWxpby1mcGE7dj0xIn0.eyJqdGkiOiJTS2E1OTBjNzk4ZTUwMmViM2Y5NjJjMjliMzJmNjIxNDVmLTE1ODQ5OTY5NTYiLCJpc3MiOiJTS2E1OTBjNzk4ZTUwMmViM2Y5NjJjMjliMzJmNjIxNDVmIiwic3ViIjoiQUNhNGQyMjY2MjhlZjIyZjRjNzQ0YTc2MzUxN2U5MDgzNiIsImV4cCI6MTU4NTAwMDU1NiwiZ3JhbnRzIjp7ImlkZW50aXR5IjoiVTEiLCJ2aWRlbyI6eyJyb29tIjoibXktcm9vbSJ9fX0.MVqpYHgaoiRvLAluWIY7xAQ_eg14idciW5tEEC9TeDg",
                  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiIsImN0eSI6InR3aWxpby1mcGE7dj0xIn0.eyJqdGkiOiJTS2E1OTBjNzk4ZTUwMmViM2Y5NjJjMjliMzJmNjIxNDVmLTE1ODQ5OTcwMjEiLCJpc3MiOiJTS2E1OTBjNzk4ZTUwMmViM2Y5NjJjMjliMzJmNjIxNDVmIiwic3ViIjoiQUNhNGQyMjY2MjhlZjIyZjRjNzQ0YTc2MzUxN2U5MDgzNiIsImV4cCI6MTU4NTAwMDYyMSwiZ3JhbnRzIjp7ImlkZW50aXR5IjoiVTIiLCJ2aWRlbyI6eyJyb29tIjoibXktcm9vbSJ9fX0.prvTPtAEw9cCG1tuq0O9ZlJY8pl5cVO1pqu4gNSFEQg",
                  "",
                  ""
                  ]
    this.userInd = Math.floor(Math.random() * 2);
    this.token = tokens[this.userInd];
    console.log("ind", this.userInd);
 },
    mounted () {
        // this.createChat(this.roomName);
        // navigator.mediaDevices.getUserMedia({audio:true})
    },
    methods: {
    async getAccessToken() {
    //   return await axios.get(`http://localhost:3000/token?identity=${this.username}`);
        const AccessToken = require('twilio-video').jwt.AccessToken;
        const VoiceGrant = AccessToken.VoiceGrant;

        // Used when generating any kind of tokens

        // Used specifically for creating Voice tokens
        const outgoingApplicationSid = 'APxxxxxxxxxxxxx';
        const identity = 'user';

        // Create a "grant" which enables a client to use Voice as a given user
        const voiceGrant = new VoiceGrant({
        outgoingApplicationSid: outgoingApplicationSid,
        incomingAllow: true, // Optional: add to allow incoming calls
        });

        // Create an access token which we will sign and return to the client,
        // containing the grant we just created
        const token = new AccessToken(twilioAccountSid, twilioApiKey, twilioApiSecret);
    },
    // Trigger log events 
   dispatchLog(message) {
       EventBus.$emit('new_log', message);
   },
    // Attach the Tracks to the DOM.
//    attachTracks(tracks, container) {
//        tracks.forEach(function(track) {
//            console.log("adding track:", track)
//            container.appendChild(track.attach());
//        });
//    },
    attachTrack(track, container) {
        container.appendChild(track.attach());
    },
    attachTracks(tracks, container) {
        let VueThis = this;
        tracks.forEach(function(track) {
            VueThis.attachTrack(track, container);
        });
    },
    detachTrack(track) {
        track.detach().forEach(function(element) {
            element.remove();
        });
    },
      // Attach the Participant's Tracks to the DOM.
    // attachParticipantTracks(participant, container) {
    //    let tracks = Array.from(participant.tracks.values()).filter(function(publication) {
    //   return publication.track;
    // }).map(function(publication) {
    //   return publication.track;
    // });
    //    this.attachTracks(tracks, container);
    // },
    //   // Detach the Tracks from the DOM.
    // detachTracks(tracks) {
    //    tracks.forEach( (track) => {
    //        track.detach().forEach((detachedElement) => {
    //           detachedElement.remove();
    //        });
    //    });
    // },

    trackPublished(publication, container) {
        if (publication.isSubscribed) {
            this.attachTrack(publication.track, container);
        }
        let VueThis = this
        publication.on('subscribed', function(track) {
            console.log('Subscribed to ' + publication.kind + ' track');
            VueThis.attachTrack(track, container);
        });
        publication.on('unsubscribed', VueThis.detachTrack);
    },

    trackUnpublished(publication) {
        console.log(publication.kind + ' track was unpublished.');
    },

    participantConnected(participant, container) {
        let selfContainer = document.createElement('div');
        selfContainer.id = `participantContainer-${participant.identity}`;

        container.appendChild(selfContainer);
        // appendName(participant.identity, selfContainer);
        let VueThis= this;
        participant.tracks.forEach(function(publication) {
            VueThis.trackPublished(publication, selfContainer);
        });
        participant.on('trackPublished', function(publication) {
            VueThis.trackPublished(publication, selfContainer);
        });
        participant.on('trackUnpublished', VueThis.trackUnpublished);
    },
    detachParticipantTracks(participant) {
        var tracks = this.getTracks(participant);
        tracks.forEach(this.detachTrack);
    },
    getTracks(participant) {
        return Array.from(participant.tracks.values()).filter(function(publication) {
            return publication.track;
            }).map(function(publication) {
            return publication.track;
            });
    },
      // Detach the Participant's Tracks from the DOM.
//    detachParticipantTracks(participant) {
//        let tracks =Array.from(participant.tracks.values()).filter(function(publication) {
//       return publication.track;
//     }).map(function(publication) {
//       return publication.track;
//     });;
//        this.detachTracks(tracks);
//    },
      // Leave Room.
   leaveRoomIfJoined() {
       
       if (this.activeRoom) {
           this.activeRoom.disconnect();
           console.log("disconnecting")
       }
   },
   log(message){
       this.x = this.x + message + '\r\n'
   },
   
    
    createChat(room_name) {
        this.loading = true;
        const VueThis = this;
    //   this.getAccessToken().then( (data) => {
          VueThis.roomName = null;
          
          
          let connectOptions = {
              name: room_name,
              // logLevel: 'debug',
              audio: true,
            //   video: { width: 400 }
          };
          // before a user enters a new room,
          // disconnect the user from they joined already
          this.leaveRoomIfJoined();
        
          // remove any remote track when joining a new room
        //   document.getElementById('remoteTrack').innerHTML = "";
        VueThis.log('About to connect: ');
        Twilio.connect(this.token , connectOptions).then(function(room) {
              // console.log('Successfully joined a Room: ', room);
            console.log('Successfully joined a Room: '+ room);
            VueThis.log('Successfully joined a Room: '+ room);
              // set active toom
            VueThis.activeRoom = room;
            VueThis.roomName = room_name;
            VueThis.loading = false;

            var previewContainer = document.getElementById('local-media');
                // if (!previewContainer.querySelector('video')) {
                VueThis.attachTracks(VueThis.getTracks(room.localParticipant), previewContainer);
                // }

            var remoteMediaContainer = document.getElementById('remote-media');
            room.participants.forEach(function(participant) {
                console.log("Already in Room: '" + participant.identity + "'");
                VueThis.participantConnected(participant, remoteMediaContainer);
            });

            room.on('participantConnected', function(participant) {
                console.log("Joining: '" + participant.identity + "'");
                VueThis.participantConnected(participant, remoteMediaContainer);
            });

            room.on('participantDisconnected', function(participant) {
                console.log("RemoteParticipant '" + participant.identity + "' left the room");
                VueThis.detachParticipantTracks(participant);
                // removeName(participant);
            });

            room.on('disconnected', function() {
                console.log('Left');
                // if (previewTracks) {
                // previewTracks.forEach(function(track) {
                //     track.stop();
                // });
                // previewTracks = null;
                // }
                VueThis.detachParticipantTracks(room.localParticipant);
                room.participants.forEach(VueThis.detachParticipantTracks);
                // room.participants.forEach(removeName);
                VueThis.activeRoom = null;
                // document.getElementById('button-join').style.display = 'block';
                // document.getElementById('button-leave').style.display = 'none';
            });


              // Attach the Tracks of the Room's Participants.
            //   console.log("partic", room);
            //    room.participants.forEach(function(participant) {
            //        console.log("attaching partic tracks", participant);
            //        let previewContainer = document.getElementById('remoteTrack');
            //        VueThis.attachParticipantTracks(participant, previewContainer);
            //    });
            //    // When a Participant joins the Room, log the event.
            //    room.on('participantConnected', function(participant) {
            //        console.log("Joining: '" + participant.identity + "'");
            //        let previewContainer = document.getElementById('remoteTrack');
            //        VueThis.attachParticipantTracks(participant, previewContainer);
            //    });
            //    // When a Participant adds a Track, attach it to the DOM.
            //    room.on('trackAdded', function(track, participant) {
            //        console.log(participant.identity + " added track: " + track.kind);
            //        let previewContainer = document.getElementById('remoteTrack');
            //        VueThis.attachTracks([track], previewContainer);
            //    });
            //    // When a Participant removes a Track, detach it from the DOM.
            //    room.on('trackRemoved', function(track, participant) {
            //        console.log(participant.identity + " removed track: " + track.kind);
            //        VueThis.detachTracks([track]);
            //    });
            //                   // When a Participant leaves the Room, detach its Tracks.
            //    room.on('participantDisconnected', function(participant) {
            //        console.log("Participant '" + participant.identity + "' left the room");
            //        VueThis.detachParticipantTracks(participant);
            //    });
            //     // if local preview is not active, create it
            //    if(!VueThis.localTrack) {
            //        createLocalVideoTrack().then(track => {
            //          let localMediaContainer = document.getElementById('localTrack');
            //          localMediaContainer.appendChild(track.attach());
            //          VueThis.localTrack = true;
            //        });
            //    }
         }, function(error) { VueThis.log(error.message) });
    //   })
   },
   }
}
</script>

<style >
   .remote_video_container {
     left: 0;
     margin: 0;
     border: 1px solid rgb(124, 129, 124);
   }
   #localTrack video {
       border: 3px solid rgb(124, 129, 124);
       margin: 0px;
       max-width: 50% !important;
       background-repeat: no-repeat;
   }
   .spacing {
     padding: 20px;
     width: 100%;
   }
   .roomTitle {
       border: 1px solid rgb(124, 129, 124);
       padding: 4px;
       color: dodgerblue;
   }
</style>