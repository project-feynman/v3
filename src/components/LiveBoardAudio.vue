<template>
    <div>
        <video v-show="false" id="yourVideo" autoplay muted playsinline></video>
        <video v-show="false" id="friendsVideo" autoplay playsinline></video>
        <v-btn @click="initAudioConnection()" ref="#cameraBtn" outlined color="accent">
            Open audio
        </v-btn>
    </div>
</template> 

<script>
import firebase from "firebase/app";
import db from "@/database.js";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";

export default {
    props: {
        roomId: String,
    },
    mixins: [DatabaseHelpersMixin],
    data () {
        return {
            audio: null,
            connectedAudio: null,
            id: null,
            servers: null,
            pc: null,
            roomRef: null,
            database: null
        }
    },
    mounted () {
        this.database = firebase.database().ref(`audio/${this.roomId}`);
        // this.roomRef = db.doc(`rooms/${this.roomId}`).collection("audio-collection"); // for switching back to Firestore
        
        this.audio = document.getElementById("yourVideo");
        this.connectedAudio = document.getElementById("friendsVideo");
        this.id = Math.floor(Math.random()*1000000000);
        this.servers = {'iceServers': [{'urls': 'stun:stun.services.mozilla.com'}, {'urls': 'stun:stun.l.google.com:19302'}, {'urls': 'turn:numb.viagenie.ca','credential': 'winston.f.321','username': 'winston.f.321@gmail.com'}]};
        this.pc = new RTCPeerConnection(this.servers);

        this.pc.onicecandidate = (event => event.candidate?this.sendMessage(this.id, JSON.stringify({'ice': event.candidate})):console.log("Sent All Ice") );
        this.pc.onaddstream = (event => this.connectedAudio.srcObject = event.stream);
        
        this.initAudio();
        this.database.on('child_added', this.readMessage);        
        this.pc.addEventListener('connectionstatechange', () => {
            if (this.pc.connectionState === "connected") {
                this.$root.$emit("show-snackbar", `Now connected to the voice chat.`)
            }
            console.log('connection state change:', this.pc.connectionState)
        });
    },
    methods: {
        async sendMessage (senderId, data) {
            const msg = this.database.push({ sender: senderId, message: data });
            msg.remove();
        },
        readMessage (data) {
            const msg = JSON.parse(data.val().message);
            const sender = data.val().sender;
            if (sender == this.id) { return; }
            if (msg.ice != undefined) {
                this.pc.addIceCandidate(new RTCIceCandidate(msg.ice));
            } else if (msg.sdp.type == "offer") {
                this.pc.setRemoteDescription(new RTCSessionDescription(msg.sdp))
                .then(() => this.pc.createAnswer())
                .then(answer => this.pc.setLocalDescription(answer))
                .then(() => this.sendMessage(this.id, JSON.stringify({ 'sdp': this.pc.localDescription })));
            } else if (msg.sdp.type == "answer") {
                this.pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
            }
        },
        initAudio () {
            navigator.mediaDevices.getUserMedia({ 
                audio: true
            })
            .then(stream => this.audio.srcObject = stream)
            .then(stream => this.pc.addStream(stream));
        },
        initAudioConnection () {
            this.pc.createOffer()
            .then(offer => this.pc.setLocalDescription(offer) )
            .then(() => this.sendMessage(this.id, JSON.stringify({'sdp': this.pc.localDescription})) );
        }
    }
}
</script>