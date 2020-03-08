<template>
    <div>
        <v-btn @click="openUserMedia()" ref="#cameraBtn">
            openUserMedia
        </v-btn>
        <v-btn @click="createRoom()">
            createRoom
        </v-btn>
        <v-btn @click="joinRoom()">
            joinRoom
        </v-btn>
    </div>
</template>

<script>
import db from "@/database.js";

export default {
    data () {
        return {
        configuration: null,
        peerConnection: null,
        localStream: null,
        remoteStream: null,
        roomDialog: null,
        roomId: null,
        }
    },
    created () {
        this.configuration = {
            iceServers: [
                {
                    urls: [
                    'stun:stun1.l.google.com:19302',
                    'stun:stun2.l.google.com:19302',
                    ],
                },
            ],
            iceCandidatePoolSize: 10,
        }
    },
    methods: {
        init() {
            document.querySelector('#cameraBtn').addEventListener('click', openUserMedia);
            document.querySelector('#hangupBtn').addEventListener('click', hangUp);
            document.querySelector('#createBtn').addEventListener('click', createRoom);
            document.querySelector('#joinBtn').addEventListener('click', joinRoom);
            this.roomDialog = new mdc.dialog.MDCDialog(document.querySelector('#room-dialog'));
        },

        async createRoom() {
            document.querySelector('#createBtn').disabled = true;
            document.querySelector('#joinBtn').disabled = true;
            // const db = firebase.firestore();

            console.log('Create PeerConnection with configuration: ', this.configuration);
            this.peerConnection = new RTCPeerConnection(this.configuration);

            registerPeerConnectionListeners();

            // Add code for creating a room here
            
            const offer = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(offer);

            const roomWithOffer = {
                offer: {
                    type: offer.type,
                    sdp: offer.sdp
                }
            }
            const roomRef = await db.collection('rooms').add(roomWithOffer);
            const roomId = roomRef.id;
            document.querySelector('#currentRoom').innerText = `Current room is ${roomId} - You are the caller!`


            roomRef.onSnapshot(async snapshot => {
                console.log('Got updated room:', snapshot.data());
                const data = snapshot.data();
                if (!peerConnection.currentRemoteDescription && data.answer) {
                    console.log('Set remote description: ', data.answer);
                    const answer = new RTCSessionDescription(data.answer)
                    await peerConnection.setRemoteDescription(answer);
                }
            });

            // Code for creating room above
            
            this.localStream.getTracks().forEach(track => {
                this.peerConnection.addTrack(track, this.localStream);
            });

            // Code for creating a room below

            // Code for creating a room above

            // Code for collecting ICE candidates below

            // Code for collecting ICE candidates above

            this.peerConnection.addEventListener('track', event => {
                console.log('Got remote track:', event.streams[0]);
                event.streams[0].getTracks().forEach(track => {
                console.log('Add a track to the remoteStream:', track);
                this.remoteStream.addTrack(track);
                });
            });

            // Listening for remote session description below

            

            // Listening for remote session description above

            // Listen for remote ICE candidates below

            // Listen for remote ICE candidates above
        },

        joinRoom() {
            document.querySelector('#createBtn').disabled = true;
            document.querySelector('#joinBtn').disabled = true;

            document.querySelector('#confirmJoinBtn').
                addEventListener('click', async () => {
                    roomId = document.querySelector('#room-id').value;
                    console.log('Join room: ', roomId);
                    document.querySelector(
                        '#currentRoom').innerText = `Current room is ${roomId} - You are the callee!`;
                    await joinRoomById(roomId);
                }, {once: true});
            this.roomDialog.open();
        },

        async joinRoomById(roomId) {
            // const db = firebase.firestore();
            const roomRef = db.collection('rooms').doc(`${roomId}`);
            const roomSnapshot = await roomRef.get();
            console.log('Got room:', roomSnapshot.exists);

            if (roomSnapshot.exists) {
                console.log('Create PeerConnection with configuration: ', this.configuration);
                this.peerConnection = new RTCPeerConnection(this.configuration);
                registerPeerConnectionListeners();
                this.localStream.getTracks().forEach(track => {
                this.peerConnection.addTrack(track, this.localStream);
                });

                // Code for collecting ICE candidates below
                
                // Code for collecting ICE candidates above

                this.peerConnection.addEventListener('track', event => {
                console.log('Got remote track:', event.streams[0]);
                event.streams[0].getTracks().forEach(track => {
                    console.log('Add a track to the remoteStream:', track);
                    this.remoteStream.addTrack(track);
                });
                });

                const offer = roomSnapshot.data().offer;
                await peerConnection.setRemoteDescription(offer);
                const answer = await peerConnection.createAnswer();
                await peerConnection.setLocalDescription(answer);

                const roomWithAnswer = {
                    answer: {
                        type: answer.type,
                        sdp: answer.sdp
                    }
                }
                await roomRef.update(roomWithAnswer);

                // Listening for remote ICE candidates below

                // Listening for remote ICE candidates above
            }
        },

        async openUserMedia(e) {
            const stream = await navigator.mediaDevices.getUserMedia(
                {video: true, audio: true});
            document.querySelector('#localVideo').srcObject = stream;
            this.localStream = stream;
            this.remoteStream = new MediaStream();
            document.querySelector('#remoteVideo').srcObject = this.remoteStream;

            console.log('Stream:', document.querySelector('#localVideo').srcObject);
            document.querySelector('#cameraBtn').disabled = true;
            document.querySelector('#joinBtn').disabled = false;
            document.querySelector('#createBtn').disabled = false;
            document.querySelector('#hangupBtn').disabled = false;
        },

        async hangUp(e) {
            const tracks = document.querySelector('#localVideo').srcObject.getTracks();
            tracks.forEach(track => {
                track.stop();
            });

            if (this.remoteStream) {
                this.remoteStream.getTracks().forEach(track => track.stop());
            }

            if (this.peerConnection) {
                this.peerConnection.close();
            }

            document.querySelector('#localVideo').srcObject = null;
            document.querySelector('#remoteVideo').srcObject = null;
            document.querySelector('#cameraBtn').disabled = false;
            document.querySelector('#joinBtn').disabled = true;
            document.querySelector('#createBtn').disabled = true;
            document.querySelector('#hangupBtn').disabled = true;
            document.querySelector('#currentRoom').innerText = '';

            // Delete room on hangup
            if (roomId) {
                // const db = firebase.firestore();
                const roomRef = db.collection('rooms').doc(roomId);
                const calleeCandidates = await roomRef.collection('calleeCandidates').get();
                calleeCandidates.forEach(async candidate => {
                await candidate.delete();
                });
                const callerCandidates = await roomRef.collection('callerCandidates').get();
                callerCandidates.forEach(async candidate => {
                await candidate.delete();
                });
                await roomRef.delete();
            }

            document.location.reload(true);
        },

        registerPeerConnectionListeners() {
            this.peerConnection.addEventListener('icegatheringstatechange', () => {
                console.log(
                    `ICE gathering state changed: ${this.peerConnection.iceGatheringState}`);
            });

            this.peerConnection.addEventListener('connectionstatechange', () => {
                console.log(`Connection state change: ${this.peerConnection.connectionState}`);
            });

            this.peerConnection.addEventListener('signalingstatechange', () => {
                console.log(`Signaling state change: ${this.peerConnection.signalingState}`);
            });

            this.peerConnection.addEventListener('iceconnectionstatechange ', () => {
                console.log(
                    `ICE connection state change: ${this.peerConnection.iceConnectionState}`);
            });
        },
        async collectIceCandidates(roomRef, peerConnection,    
                                    localName, remoteName) {
            const candidatesCollection = roomRef.collection(localName);

            peerConnection.addEventListener('icecandidate', event => {
                if (event.candidate) {
                    const json = event.candidate.toJSON();
                    candidatesCollection.add(json);
                }
            });

            roomRef.collection(remoteName).onSnapshot(snapshot => {
                snapshot.docChanges().forEach(change => {
                    if (change.type === "added") {
                        const candidate = new RTCIceCandidate(change.doc.data());
                        peerConneciton.addIceCandidate(candidate);
                    }
                });
            })
        },
    }
}
</script>