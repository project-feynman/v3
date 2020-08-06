<template>
	<div v-if="hasJoinedMedia">
		<portal to="video-chat" :disabled="!portalToLiveBoard">
			<v-container class="video-display">
				<v-row>
					<v-col class="video-col">
						<div class="video-container-wrapper">
							<div id="local-media" class="video-container"/>
							<div class="display-bar">
								<div class="name-container">
									{{user.firstName + " " + user.lastName}}
								</div>
								<div class="local-buttons-container">
									<v-btn @click="toggleMic()" x-small><v-icon small>{{isMicOn ? 'mdi-microphone': 'mdi-microphone-off'}}</v-icon></v-btn>
									<v-btn @click="toggleCamera()" x-small ><v-icon small>{{isCameraOn ? 'mdi-video': 'mdi-video-off'}}</v-icon></v-btn>
								</div>
							</div>
						</div>
					</v-col>
					<v-col v-for="participant in roomParticipants.filter(p => (p.uid !== user.uid) && p.hasJoinedMedia)" 
						:key="participant.uid" 
						class="video-col">
						<div class="video-container-wrapper" >
							<div  v-show="participant.isCameraOn" :id="`remote-media-${participant.uid}`"  class="video-container"/>
							<v-icon v-show="!participant.isCameraOn" color="white" x-large style="width: 100%; height: 100%">mdi-video-off</v-icon>
							<div class="display-bar">
								<div class="name-container">
									{{participant.firstName + " " + participant.lastName}}
								</div>
								<v-icon class="participant-mic">
									{{participant.isMicOn ? 'mdi-microphone': 'mdi-microphone-off'}}
								</v-icon> 
							</div>
						</div>
					</v-col>
				</v-row>
			</v-container>
		</portal>
		<!-- <portal-target name="video-chat-global"/> -->
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
		roomParticipants: Array,
		portalToLiveBoard: Boolean
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
			return db.doc(`classes/${this.classId}/participants/${this.user.uid}`);
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
		},
		portalToLiveBoard () {
			if (this.activeRoom){
				this.connectAllTracksInRoom(this.activeRoom)
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
			// console.log("Updating db", this.isMicOn, this.isCameraOn, this.hasJoinedMedia)
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
		attachTrack(track, container, isLocal, init) {
			this.detachTrack(track) //remove any duplicate tracks
				if (track.kind === "video") {
					console.log("TRAK", init, track)
					
					if (track.isStarted) {
						scaleAndAttachVideo(track, container);
					}
					
					if (init){ //we dont want to set a bunch of event emitters
						track.on('dimensionsChanged', (videoTrack) => { 
							console.log("Track dimensions changed", videoTrack);
							// scaleAndAttachVideo(track, container);
						});
						track.on('started', (videoTrack) => { 
							console.log("Track started", videoTrack);
							scaleAndAttachVideo(track, container);
						});
					}

					function scaleAndAttachVideo (videoTrack, container) {
						var videoTag = videoTrack.attach();
						const videoHeight = videoTrack.dimensions.height;
						const videoWidth = videoTrack.dimensions.width;
						const aspectRatio = videoWidth/videoHeight;
						videoTag.setAttribute('style', 
									`${aspectRatio < (16/9) ? 'height' : 'width'}: 100%; transform: ${isLocal ? 'scale(-1, 1)': ''}`)
						
						// while (container.firstChild) {
						// 	container.removeChild(container.lastChild);
						// }
						container.appendChild(videoTag);
					}
					
				}
				else {
					container.appendChild(track.attach());
				}
		},
		attachTracks(tracks, container, isLocal=false, init=false) {
				tracks.forEach((track) => {
						this.attachTrack(track, container, isLocal, init);
				});
		},
		detachTrack(track) {
				track.detach().forEach((element) => {
						element.remove();
				});
		},
		trackPublished(publication, container) {
				if (publication.isSubscribed) {
						this.attachTrack(publication.track, container, false, true);
				}
				publication.on('subscribed', (track) => {
						console.log('Subscribed to ' + publication.kind + ' track');
						this.attachTrack(track, container, false, true);
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
				this.attachTracks(this.getTracks(room.localParticipant), previewContainer, true, true);
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
		},
		connectAllTracksInRoom (room) {
			this.recurseNextTickLocal(room, 0);

			room.participants.forEach((participant) => {
				this.recurseNextTickRemote(room, participant, 0);
			});
		},
		recurseNextTickLocal(room, count) {
			if (count < 5){
				this.$nextTick( () => {
					var previewContainer = document.getElementById('local-media');
					if (previewContainer) {
						this.attachTracks(this.getTracks(room.localParticipant), previewContainer, true, false);
						return;
					}
					this.recurseNextTickLocal(room, count+1)
				})
			}
		},
		recurseNextTickRemote(room, participant, count) {
			if (count < 5){
				this.$nextTick( () => {
					var previewContainer = document.getElementById(`remote-media-${participant.identity}`);
					if (previewContainer) {
						this.attachTracks(this.getTracks(participant), previewContainer, false, false);
						return;
					}
					this.recurseNextTickRemote(room, participant, count+1)
				})
			}
		}
	}
}
</script>

<style scoped>
.video-display{
	width: 100%;
	bottom: 0%;
	/* position: fixed; */
	opacity: 1;
	z-index: 1000;
	padding-bottom: 0;
	margin-left: 0%;
}
.video-col{
	flex-grow: 0;
	padding-left: 2px;
	padding-right: 2px;
}

.video-container-wrapper{
	height: 135px;
	width: 240px;
	position: relative;
	border-style: solid;
	border-color: var(--v-accent-base);
	background-color:black;
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
</style>