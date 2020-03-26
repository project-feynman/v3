<template>
    
	<div >
		<!-- <v-btn @click="enterAudioChat()">
				Connect Audio
		</v-btn> -->
		<!-- <div class="row remote_video_container"> -->
		<div id="remote-media"></div>
		<!-- </div> -->
		<!-- <div class="spacing"></div> -->
		<div class="row">
			<div id="local-media"></div>
		</div>
	</div>
</template> 

<script>
import firebase from "firebase/app";
import db from "@/database.js";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import Twilio, { connect, createLocalTracks, createLocalVideoTrack } from 'twilio-video';
import { twilioCreds } from "@/twiliocreds.js";


export default {
	props: {
		roomId: String,
	},
	data() {
		return {
			loading: false,
			activeRoom: '',
			token: null,
			isMicOn: false
		}
	},
	computed: {
		user () { return this.$store.state.user;}
	},
	created() {
		this.token = this.getAccessToken();
		this.$root.$on('toggleMic', (micStatus) => this.toggleMic(micStatus));
	},
	destroyed() {
		this.leaveRoomIfJoined();
	},
	methods: {
		getAccessToken() {
				var AccessToken = require('twilio').jwt.AccessToken;
				var VideoGrant = AccessToken.VideoGrant;

				// Substitute your Twilio AccountSid and ApiKey details
				var ACCOUNT_SID = twilioCreds.ACCOUNT_SID;
				var API_KEY_SID = twilioCreds.API_KEY_SID;
				var API_KEY_SECRET = twilioCreds.API_KEY_SECRET;

				// Create an Access Token
				var accessToken = new AccessToken(
						ACCOUNT_SID,
						API_KEY_SID,
						API_KEY_SECRET
				);

				// Set the Identity of this token
				// let ids = ["Winston1", "Winston2", "Winston3"]
				// let id = ids[Math.floor(Math.random()*3)];
				// console.log(id);
				// accessToken.identity = id;
				accessToken.identity = this.user.uid;

				// Grant access to Video
				var grant = new VideoGrant();
				grant.room = this.roomId;
				accessToken.addGrant(grant);

				// Serialize the token as a JWT
				var jwt = accessToken.toJwt();
				return jwt;
		},
		// Trigger log events 
		attachTrack(track, container) {
				container.appendChild(track.attach());
		},
		attachTracks(tracks, container) {
				tracks.forEach((track) => {
						this.attachTrack(track, container);
				});
		},
		detachTrack(track) {
				track.detach().forEach((element) => {
						element.remove();
				});
		},
		trackPublished(publication, container) {
				if (publication.isSubscribed) {
						this.attachTrack(publication.track, container);
				}
				publication.on('subscribed', (track) => {
						console.log('Subscribed to ' + publication.kind + ' track');
						this.attachTrack(track, container);
				});
				publication.on('unsubscribed', this.detachTrack);
		},
		trackUnpublished(publication) {
				console.log(publication.kind + ' track was unpublished.');
		},
		participantConnected(participant, container) {
				let selfContainer = document.createElement('div');
				selfContainer.id = `participantContainer-${participant.identity}`;

				container.appendChild(selfContainer);

				participant.tracks.forEach((publication) => {
						this.trackPublished(publication, selfContainer);
				});
				participant.on('trackPublished', (publication) => {
						this.trackPublished(publication, selfContainer);
				});
				participant.on('trackUnpublished', this.trackUnpublished);
		},
		detachParticipantTracks(participant) {
				var tracks = this.getTracks(participant);
				tracks.forEach(this.detachTrack);
		},
		muteAudio () {
			this.getTracks(this.activeRoom.localParticipant).forEach((track) => {
				track.disable();
			});
		},
		unMuteAudio () {
			this.getTracks(this.activeRoom.localParticipant).forEach((track) => {
				console.log(track);
				track.enable();
			});
		},
		getTracks(participant) {
				return Array.from(participant.tracks.values()).filter((publication) => {
						return publication.track;
						}).map((publication) => {
						return publication.track;
						});
		},
		leaveRoomIfJoined() {
		if (this.activeRoom) {
			this.activeRoom.disconnect();
			console.log("disconnecting");
		}
		},
		log(message){
		this.x = this.x + message + '\r\n'
		}, 
		enterAudioChat() {
			this.loading = true;

			let connectOptions = {
				name: this.roomId,
				// logLevel: 'debug',
				audio: true,
				// video: { width: 400 }
			};
			// before a user enters a new room,
			// disconnect the user from they joined already
			this.leaveRoomIfJoined();
			
			// remove any remote track when joining a new room
			console.log('About to connect: ');
			Twilio.connect(this.token , connectOptions).then(
				(room) => { 
					this.onTwilioConnect(room);
					this.unMuteAudio();
				}, 
				(error) => { console.log(error.message) }
			);
		},
		onTwilioConnect(room) {
				console.log('Successfully joined a Room: '+ room);
				this.log('Successfully joined a Room: '+ room);
				// set active toom
				this.activeRoom = room;
				this.loading = false;
				var previewContainer = document.getElementById('local-media');
				this.attachTracks(this.getTracks(room.localParticipant), previewContainer);
				
				var remoteMediaContainer = document.getElementById('remote-media');

				room.participants.forEach((participant) => {
						console.log("Already in Room: '" + participant.identity + "'");
						this.participantConnected(participant, remoteMediaContainer);
				});

				room.on('participantConnected', (participant) => {
						console.log("Joining: '" + participant.identity + "'");
						this.participantConnected(participant, remoteMediaContainer);
						this.isMicOn = false;
				});

				room.on('participantDisconnected', (participant) => {
						console.log("RemoteParticipant '" + participant.identity + "' left the room");
						this.detachParticipantTracks(participant);
						// removeName(participant);
				});

				room.on('disconnected', () => {
					console.log('Left the rooom');
					this.$root.$emit('leftRoom');
					this.detachParticipantTracks(room.localParticipant);
					room.participants.forEach(this.detachParticipantTracks);
					this.activeRoom = null;
				});
		},
		toggleMic (micStatus) {
			this.isMicOn = micStatus;
			if (this.isMicOn){
				if (this.activeRoom==='') {
					this.enterAudioChat();
				} else {
					this.unMuteAudio();
				}
			}
			else {
				this.muteAudio();
			}
		}
	}
}
</script>

<style >
   /* .remote_video_container {
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
   } */
</style>