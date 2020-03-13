<template>
    <div>

        <video v-show="false" id="yourVideo" autoplay muted playsinline></video>
      <video v-show="false" id="friendsVideo" autoplay playsinline></video>
        <v-btn @click="initAudioConnection()" ref="#cameraBtn">
            openAudio
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
        this.database = firebase.database().ref('audio');
        this.roomRef = db.doc(`rooms/${this.roomId}`).collection("audio-collection"); // TODO : create a new room here
        // const doc = await this.roomRef.add({ test: "Hello world" });

        
        this.audio = document.getElementById("yourVideo");
        this.connectedAudio = document.getElementById("friendsVideo");
        this.id = Math.floor(Math.random()*1000000000);
        this.servers = {'iceServers': [{'urls': 'stun:stun.services.mozilla.com'}, {'urls': 'stun:stun.l.google.com:19302'}, {'urls': 'turn:numb.viagenie.ca','credential': 'winston.f.321','username': 'winston.f.321@gmail.com'}]};
        this.pc = new RTCPeerConnection(this.servers);

        this.pc.onicecandidate = (event => event.candidate?this.sendMessage(this.id, JSON.stringify({'ice': event.candidate})):console.log("Sent All Ice") );
        this.pc.onaddstream = (event => this.connectedAudio.srcObject = event.stream);
        // this.roomRef.onSnapshot(async snapshot => {
        //     // console.log("snapshot", snapshot);
        //     if (snapshot.docs.length > 0){
        //         var docRef = snapshot.docs[snapshot.docs.length-1].id;
        //         // console.log("docRef", this.roomRef.doc(docRef))
        //         const data = await this.$_getDoc(this.roomRef.doc(docRef));
        //         // console.log('Got updated room:', data);
        //         this.readMessage(data);
        //         console.log("delete")
        //         // this.roomRef.doc(docRef).delete();
        //     }
        // });

        


        this.initAudio();
        this.database.on('child_added', this.readMessage);
        // this.database.on('child_added', (data) => {
        //     this.readMessage(data);
        // });
        // this.initAudioConnection();
        
        this.pc.addEventListener('connectionstatechange', () => {
            console.log('connection state change:', this.pc.connectionState)
        });

    },
    methods: {
        async sendMessage(senderId, data) {
            var msg = this.database.push({ sender: senderId, message: data });
            console.log("added",senderId)
            msg.remove();
        },
        readMessage(data) {
        var msg = JSON.parse(data.val().message);
        var sender = data.val().sender;
        if (sender != this.id) {
            if (msg.ice != undefined)
                this.pc.addIceCandidate(new RTCIceCandidate(msg.ice));
            else if (msg.sdp.type == "offer")
                this.pc.setRemoteDescription(new RTCSessionDescription(msg.sdp))
                .then(() => this.pc.createAnswer())
                .then(answer => this.pc.setLocalDescription(answer))
                .then(() => this.sendMessage(this.id, JSON.stringify({'sdp': this.pc.localDescription})));
            else if (msg.sdp.type == "answer")
                this.pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
            }
        },
        initAudio () {
            console.log("audio",this.audio)
            navigator.mediaDevices.getUserMedia({audio:true})
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