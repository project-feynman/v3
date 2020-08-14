<template>
	<div v-if="hasJoinedMedia">
		<div class="screen-share-container" id="screen-share">

		</div>
		<portal to="video-chat" :disabled="!portalToLiveBoard">
			<v-container class="video-display">
				<v-row>
					<v-col class="video-col">
						<div :class="isMinimizedView ? 'mini-view-container' : 'video-container-wrapper'">
							<div v-show="!isMinimizedView" id="local-media" class="video-container"/>
							<div class="display-bar">
								<div class="name-container">
									{{user.firstName + " " + user.lastName}}
								</div>
								<div class="local-buttons-container">
									<v-btn @click="toggleMic()" x-small><v-icon small>{{isMicOn ? 'mdi-microphone': 'mdi-microphone-off'}}</v-icon></v-btn>
									<v-btn @click="toggleCamera()" x-small ><v-icon small>{{isCameraOn ? 'mdi-video': 'mdi-video-off'}}</v-icon></v-btn>
									<v-btn @click="startScreenShare()" x-small >SHARE</v-btn>
								</div>
							</div>
						</div>
					</v-col>
					<v-col v-for="participant in roomParticipants.filter(p => (p.sessionID !== sessionID) && p.hasJoinedMedia)" 
						:key="participant.sessionID" 
						class="video-col">
						<div :class="isMinimizedView ? 'mini-view-container' : 'video-container-wrapper'" >
							<div  v-show=" !isMinimizedView && participant.isCameraOn" :id="`remote-media-${participant.sessionID}`"  class="video-container"/>
							<v-icon v-show=" !isMinimizedView && !participant.isCameraOn" color="white" x-large style="width: 100%; height: 100%">mdi-video-off</v-icon>
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
		<MediaErrorPopup
		:popupOpen="permissionsPopupOpen"
		@exit="permissionsPopupOpen = false"
		/>
	</div>
</template> 

<script>
import firebase from "firebase/app";
import db from "@/database.js";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import MediaErrorPopup from "@/components/MediaErrorPopup.vue";
import Twilio, { connect, createLocalTracks, createLocalVideoTrack, LocalVideoTrack } from 'twilio-video';
import { twilioCreds } from "@/twiliocreds.js";
import { mapState } from "vuex";


export default {
	props: {
		roomId: String,
		classId: String,
		hasJoinedMedia: Boolean,
		roomParticipants: Array,
		portalToLiveBoard: Boolean,
		isMinimizedView: Boolean
	},
	components :{
		MediaErrorPopup
	},
	data() {
		return {
			loading: false,
			activeRoom: null,
			token: null,
			isCameraOn: false,
			isMicOn: false,
			snapshotListeners: [],
			roomParticipantsRef: null,
			permissionsPopupOpen: false
		}
	},
	computed: {
	...mapState([
			"user",
			"session"
		]),
		sessionID () {
			return this.session.currentID;
		},
		roomParticipantRef () {
			return db.doc(`classes/${this.classId}/participants/${this.sessionID}`);
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
				this.attachTracks(this.getTracks(this.activeRoom.localParticipant), this.sessionID);
				this.activeRoom.participants.forEach((participant) => {
					this.attachTracks(this.getTracks(participant), participant.identity);
				});
			}
		}
	},
	created() {
		this.token = this.getAccessToken();
	},
	beforeDestroy () {
		this.$emit('left-room');
		this.leaveRoomIfJoined();
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
			this.roomParticipantRef.get().then(doc => { 
				if (doc.exists){ //this is just to prevent errors
					this.roomParticipantRef.update({
						isMicOn: this.isMicOn,
						isCameraOn: this.isCameraOn,
						hasJoinedMedia: this.hasJoinedMedia
					})
				}
			})
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

				accessToken.identity = this.sessionID;

				// Grant access to Video
				var grant = new VideoGrant();
				grant.room = this.roomId;
				accessToken.addGrant(grant);

				// Serialize the token as a JWT
				var jwt = accessToken.toJwt();
				return jwt;
		},
		async startScreenShare (){
			const stream = await navigator.mediaDevices.getDisplayMedia();
			console.log("SCREEN SHARRE", stream.getTracks())
			let screenTrack = new LocalVideoTrack(stream.getTracks()[0], {name: "screen-share"});
			this.activeRoom.localParticipant.publishTrack(screenTrack);
		},
		// Trigger log events 
		attachTrack(track, container, isLocal, init) {
			this.detachTrack(track) //remove any duplicate tracks
				if (track.kind === "video") {
					
					if (track.isStarted) {
						scaleAndAttachVideo(track, container);
					}
					
					if (init){ //this is to prevent too many event listeners from being added
						track.on('started', (videoTrack) => { 
							scaleAndAttachVideo(track, container);
						});
					}

					function scaleAndAttachVideo (videoTrack, container) {
						console.log("track attached", videoTrack)
						var videoTag = videoTrack.attach();
						const videoHeight = videoTrack.dimensions.height;
						const videoWidth = videoTrack.dimensions.width;
						const aspectRatio = videoWidth/videoHeight;
						videoTag.setAttribute('style', 
									`${aspectRatio < (16/9) ? 'height' : 'width'}: 100%; transform: ${isLocal ? 'scale(-1, 1)': ''}`)
						if (track.name === 'screen-share'){
							videoTag.setAttribute("controls", true);
						}
						
						
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
		attachTracks(tracks, identity, init=false) {
			const isLocal = (identity === this.sessionID);
			tracks.forEach((track) => {
				const containerName = track.name === 'screen-share' ? 'screen-share' : (isLocal ? 'local-media' : `remote-media-${identity}`);
				if (!isLocal || containerName !== 'screen-share' ) {
					this.getMediaContainer(containerName).then(container => {
						this.attachTrack(track, container, isLocal, init)
					})
				}
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
			participant.tracks.forEach((publication) => {
				if (publication.trackName === 'screen-share'){
					this.getMediaContainer("screen-share").then(container => {
						this.trackPublished(publication, container);
					})
				}
				else {
					this.getMediaContainer(`remote-media-${participant.identity}`).then(container => {
						this.trackPublished(publication, container);
					})
				}
			});
			participant.on('trackPublished', (publication) => {
				if (publication.trackName === 'screen-share'){
					this.getMediaContainer("screen-share").then(container => {
						this.trackPublished(publication, container);
					})
				}
				else {
					this.getMediaContainer(`remote-media-${participant.identity}`).then(container => {
						this.trackPublished(publication, container);
					})
				}
			});
			participant.on('trackUnpublished', this.trackUnpublished);
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
			Twilio.connect(this.token, connectOptions).then((room) => {
				this.onTwilioConnect(room)
				this.$emit('media-connected')
				this.loading = false;
			}).catch(error => {
				console.log("Twilio Error", error);
				this.permissionsPopupOpen = true;
			});
			
		},
		onTwilioConnect(room) {
				console.log('Successfully joined a Room: '+ room);
				// set active toom
				
				this.activeRoom = room;
				var previewContainer = document.getElementById('local-media');
				this.attachTracks(this.getTracks(room.localParticipant), this.sessionID, true);
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
		async getMediaContainer(containerId){
			let count = 0;
			while (count < 5){
				await this.$nextTick();
				const container = document.getElementById(containerId);
				if (container){
					return container;
				}
				count++;
			}
			return "failed";
		}
	}
}
</script>

<style scoped>
.screen-share-container{
	height: 300px;
}
.video-display{
	width: 100%;
	bottom: 0%;
	/* position: fixed; */
	opacity: 1;
	z-index: 1000;
	padding-bottom: 0;
	padding-top: 0;
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