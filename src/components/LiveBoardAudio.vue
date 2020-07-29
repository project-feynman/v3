<template>
	<div v-if="hasJoinedMedia">
		<portal to="local-media">
			  <div class="video-container-wrapper">
				<div id="local-media" class="video-container"/>
				<v-container style="bottom: 1%; position: absolute; ">
					<v-row style="">
						 <v-col >
							 <div class="name-container">
								{{user.firstName + " " + user.lastName}}
							 </div>
						</v-col>
						
						<v-col >
							<div style="position:absolute; bottom: 10px; right: 10px;">
								<v-btn @click="toggleMic()" x-small><v-icon small>{{isMicOn ? 'mdi-microphone': 'mdi-microphone-off'}}</v-icon></v-btn>
								<v-btn @click="toggleCamera()" x-small ><v-icon small>{{isCameraOn ? 'mdi-video': 'mdi-video-off'}}</v-icon></v-btn>
							</div>
						</v-col>
					</v-row>
				</v-container>
			  </div>
		</portal>

		<template v-for="participant in roomParticipants.filter(p => (p.uid !== user.uid))">
			<portal :to="`remote-media-${participant.uid}`"  :key="participant.uid" >
				<div class="video-container-wrapper">
					<div :id="`remote-media-${participant.uid}`"  class="video-container"/>
					<v-container style="bottom: 1%; position: absolute; color: transparent; ">
						<v-row >
							<v-col >
								<v-icon small class="participant-mic">
									{{participant.isMicOn ? 'mdi-microphone': 'mdi-microphone-off'}}
								</v-icon> 
								<div class="name-container" style="left: 28px">
									{{participant.firstName + " " + participant.lastName}}
								</div>
							</v-col>
						</v-row>
					</v-container>
			  	</div>
			</portal>
		</template>
	</div>
</template> 

<script>
import firebase from "firebase/app";
import db from "@/database.js";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import Twilio, { connect, createLocalTracks, createLocalVideoTrack } from 'twilio-video';
import { twilioCreds } from "@/twiliocreds.js";
import { mapState } from "vuex";


export default {
	props: {
		roomId: String,
		classId: String,
		hasJoinedMedia: Boolean,
		blackboardRoom: Object,
		roomParticipants: Array
	},
	data() {
		return {
			loading: false,
			activeRoom: null,
			token: null,
			isCameraOn: false,
			isMicOn: false,
			snapshotListeners: [],
			roomParticipantsRef: null
		}
	},
	computed: {
	...mapState([
			"user"
		]),
		roomParticipantRef () {
			return db.doc(`classes/${this.classId}/blackboards/${this.roomId}/participants/${this.user.uid}`);
		}
	},
	watch: {
		hasJoinedMedia () {
			this.updateMediaStatus();
			if(this.hasJoinedMedia){
				this.enterAudioChat();
			}
			else {
				this.leaveRoomIfJoined();
			}
		},
		isMicOn: {
			// immediate: true,
			handler () {
				this.updateMediaStatus();
			}
		},
		isCameraOn: {
			// immediate: true,
			handler () {
				this.updateMediaStatus();
			}
		}
	},
	created() {
		console.log("audio created")
		this.token = this.getAccessToken();
	},
	beforeDestroy () {
		this.$emit('left-room');
		this.leaveRoomIfJoined();
		console.log('Audio destroyed',this.roomId)
	},
	methods: {
		toggleMic () {
			console.log("toggled mic", this.roomId, this.isMicOn )
			if (!this.isMicOn){
				if (this.activeRoom===null) {
					this.enterAudioChat();
				} else {
					this.enableTrack("audio");
				}
			}
			else {
				if (this.activeRoom){
					this.disableTrack("audio");
				}
			}
		},
		toggleCamera () {
			console.log("toggled camera", this.roomId, this.isCameraOn)
			if (!this.isCameraOn){
				if (this.activeRoom===null) {
					this.enterAudioChat();
				} else {
					this.enableTrack("video");
				}
			}
			else {
				if (this.activeRoom){
					this.disableTrack("video");
				}
			}
		},
		updateMediaStatus () {
			console.log("Updating db", this.isMicOn, this.isCameraOn, this.hasJoinedMedia)
			if (this.roomParticipantRef){
				this.roomParticipantRef.update({
					isMicOn: this.isMicOn,
					isCameraOn: this.isCameraOn,
					hasJoinedMedia: this.hasJoinedMedia
				})
			}
		},
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
		attachTrack(track, container, isLocal=false) {
				if (track.kind === "video") {

					if (track.isStarted) {
						scaleAndAttachVideo(track, container);
					}

					track.on('dimensionsChanged', (videoTrack) => { 
						console.log("Track dimensions changed", videoTrack);
						scaleAndAttachVideo(track, container);
					});
					track.on('started', (videoTrack) => { 
						console.log("Track started", videoTrack);
						scaleAndAttachVideo(track, container);
					});

					function scaleAndAttachVideo (videoTrack, container) {
						var videoTag = videoTrack.attach();
						const videoHeight = videoTrack.dimensions.height;
						const videoWidth = videoTrack.dimensions.width;
						console.log("video dims", videoTrack, videoHeight, videoWidth)
						const aspectRatio = videoWidth/videoHeight;
						videoTag.setAttribute('style', 
									`${aspectRatio < (16/9) ? 'height' : 'width'}: 100%; transform: ${isLocal ? 'scale(-1, 1)': ''}`)
						
						while (container.firstChild) {
							container.removeChild(container.lastChild);
						}
						container.appendChild(videoTag);
					}
					
				}
				else {
					container.appendChild(track.attach());
				}
		},
		attachTracks(tracks, container, isLocal=false) {
				tracks.forEach((track) => {
						this.attachTrack(track, container, isLocal);
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
		participantConnected(participant) {
			this.$nextTick(() => {
				var temp = document.getElementById(`remote-media-${participant.identity}`);

				participant.tracks.forEach((publication) => {
					this.trackPublished(publication, temp);
				});
				participant.on('trackPublished', (publication) => {
					this.trackPublished(publication, temp);
				});
				participant.on('trackUnpublished', this.trackUnpublished);
			})
				
		},
		detachParticipantTracks(participant) {
				var tracks = this.getTracks(participant);
				tracks.forEach(this.detachTrack);
		},
		disableTrack (type) {
			this.getTracks(this.activeRoom.localParticipant).forEach((track) => {
				if (track.kind === type) {
					track.disable();
					if (type === 'video'){
						this.isCameraOn = false;
					}
					else{
						this.isMicOn = false;
					}
				}
			});
		},
		enableTrack (type) {
			this.getTracks(this.activeRoom.localParticipant).forEach((track) => {
				if (track.kind === type) {
					track.enable();
					if (type === 'video'){
						this.isCameraOn = true;
					}
					else{
						this.isMicOn = true;
					}
				}
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
				this.isCameraOn = false;
				this.isMicOn = false;
				this.activeRoom.disconnect();
				console.log("disconnecting");
			}
		},
		async enterAudioChat() {
			this.loading = true;

			let connectOptions = {
				name: this.roomId,
				audio: true,
				video: true
			};
			this.leaveRoomIfJoined();
			
			// remove any remote track when joining a new room
			console.log('About to connect: ');
			let room = await Twilio.connect(this.token, connectOptions);
			this.onTwilioConnect(room)
			this.$emit('media-connected')
			this.loading = false;
		},
		onTwilioConnect(room) {
				console.log('Successfully joined a Room: '+ room);
				// set active toom
				
				this.activeRoom = room;
				var previewContainer = document.getElementById('local-media');
				this.attachTracks(this.getTracks(room.localParticipant), previewContainer, true);
				this.isMicOn = true;
				this.isCameraOn = true;

				room.participants.forEach((participant) => {
						console.log("Already in Room: '" + participant.identity + "'");
						// var remoteMediaContainer = document.getElementById(`remote-media-${participant.identity}`);
						this.participantConnected(participant);
				});

				room.on('participantConnected', (participant) => {
						console.log("Joining: '" + participant.identity + "'");
						// var remoteMediaContainer = document.getElementById(`remote-media-${participant.identity}`);
						this.participantConnected(participant);
				});

				room.on('participantDisconnected', (participant) => {
						console.log("RemoteParticipant '" + participant.identity + "' left the room");

						this.detachParticipantTracks(participant);
				});

				room.on('disconnected', () => {
					console.log('Left the rooom');
					this.isMicOn = false;
					this.isCameraOn = false;
					this.$emit('left-room')
					this.detachParticipantTracks(room.localParticipant);
					room.participants.forEach(this.detachParticipantTracks);
					this.activeRoom = null;
				});
		}
	}
}
</script>

<style scoped>
/* .video{
	width: 100%;
} */
.video-container{
	bottom: 0; 
	position: absolute; 
	width:100%;
	height: 100%;
	/* display: block;
	margin-left: auto;
	margin-right: auto; */
	text-align: center;
}
.video-container-wrapper{
	height: 135px;
	width: 240px;
	position: relative;
	border-style: solid;
	border-color: green;
}
.name-container{
	color: white; 
	position:absolute; 
	bottom: 10px; 
	font-size: 12px
}
.participant-mic{
	position: absolute; 
	bottom: 11px; 
	color: white; 
	left: 5px;
}
</style>