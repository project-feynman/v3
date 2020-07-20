<template>
	<div v-if="hasJoinedMedia">
		<portal to="local-media">
			<v-container>
                <v-row>
                  	<div id="local-media" class="video-element"/>
                </v-row>
                  <v-row>
                    <v-col>
                      {{user.firstName}}
                    </v-col>
					<v-col>
                      <v-btn @click="toggleMic()">
                        {{isMicOn ? "Mute Mic" : "Unmute Mic"}}
                      </v-btn>
                    </v-col>
                    <v-col>
                      <v-btn @click="toggleCamera()">
                        {{isCameraOn ? "DisableVideo" : "EnableVideo"}}
                      </v-btn>
                    </v-col>
                  </v-row>
              </v-container>
			
		</portal>

		<template v-for="participant in blackboardRoom.participants">
			<template v-if="roomParticipants.includes(participant.uid)">
				<portal :to="`remote-media-${participant.uid}`"  :key="participant.uid" >
					<v-container>
					<v-row>
						<div  :id="`remote-media-${participant.uid}`"/>
					</v-row>
					<v-row>
						<v-col>{{participant.firstName}}</v-col>
						<v-col>
							<v-icon>{{participant.isMicOn ? 'mdi-microphone': 'mdi-microphone-off'}}</v-icon>
							<v-icon>{{participant.isCameraOn ? 'mdi-video': 'mdi-video-off'}}</v-icon>
						</v-col>
					</v-row>
				</v-container>
					
				</portal>
			</template>
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
		hasJoinedMedia: Boolean,
		blackboardRoom: Object
	},
	data() {
		return {
			loading: false,
			activeRoom: null,
			token: null,
			roomParticipants: [],
			isCameraOn: false,
			isMicOn: false
		}
	},
	computed: {
	...mapState([
			"user"
		]),
		classId () {
      		return this.$route.params.class_id;
    	},
	},
	watch: {
		hasJoinedMedia () {
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
				this.updateMediaStatus("audio");
			}
		},
		isCameraOn: {
			// immediate: true,
			handler () {
				this.updateMediaStatus("video");
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
		updateMediaStatus (type) {
			console.log("Updating db", this.roomId, type)
			if (this.blackboardRoom.id === this.roomId) { ///WARNING!!! This is nasty business to set the participants. probably should do it a safer way.
				var updatedParticipants = this.blackboardRoom.participants;
				if (type === "audio") {
					updatedParticipants.find(participant => participant.uid === this.user.uid).isMicOn = this.isMicOn;
				}
				else {
					updatedParticipants.find(participant => participant.uid === this.user.uid).isCameraOn = this.isCameraOn;
				}
				const blackboardRoomRef = db.doc(`classes/${this.classId}/blackboards/${this.roomId}`);
				blackboardRoomRef.update({
					participants: updatedParticipants
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
		attachTrack(track, container) {
				if (track.kind === "video") {
					var videoTag = track.attach();
					videoTag.style.width = '100%'
					container.appendChild(videoTag);
				}
				// else {
				// 	container.appendChild(track.attach());
				// }
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
		participantConnected(participant) {
			// const blackBoardUser = this.blackboardRoom.participants.find(u => u.uid === participant.identity)
			if(!this.roomParticipants.includes(participant.identity)){
				this.roomParticipants.push(participant.identity)
			}
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
				// logLevel: 'debug',
				audio: true,
				video: {width: {min: 50, max: 500}}
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
				this.attachTracks(this.getTracks(room.localParticipant), previewContainer);
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
						
						this.roomParticipants = this.roomParticipants.filter(p => p !== participant.identity)

						this.detachParticipantTracks(participant);
				});

				room.on('disconnected', () => {
					console.log('Left the rooom');
					this.$emit('left-room')
					this.detachParticipantTracks(room.localParticipant);
					room.participants.forEach(this.detachParticipantTracks);
					this.activeRoom = null;
					this.isMicOn = false;
					this.isCameraOn = false;
				});
		}
	}
}
</script>

<style scoped>

</style>