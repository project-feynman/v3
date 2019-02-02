<template>
  <div>
    <!-- <p>{{ debug }}</p> -->

    <v-btn v-if="connected" @click="endVoiceChat()">End Voice Chat</v-btn>
    <v-btn v-if="!connected && !waiting" @click="joinVoiceChat()">
      Join
      <strong v-if="waitingPeers.length>0">&nbsp;{{waitingPeers.join(", ")}}&nbsp;</strong>
      in Voice Chat
    </v-btn>
    <v-btn v-if="!connected && waiting" @click="cancelVoiceRequest()">Waiting/Cancel</v-btn>

    <audio id="vc-audio"/>
  </div>
</template>

<script>
import Peer from "simple-peer";
import firebase, { functions } from "firebase/app";
import "firebase/firestore";
import db from "@/database";

export default {
  props: ["workspaceId", "user"],
  data() {
    return {
      myPeer: null,
      connected: false,
      waiting: false,
      waitingPeers: [],
      debug: "debug"
    };
  },
  created() {
    db.collection("workspaces")
      .doc(this.workspaceId)
      .collection("peers")
      .onSnapshot(snapshot => {
        this.waitingPeers = [];
        snapshot.forEach(peer => this.waitingPeers.push(peer.data().name));
      });
    window.addEventListener(
      "beforeunload",
      (e => {
        // db.collection("workspaces")
        //   .doc(this.workspaceId)
        //   .collection("peers")
        //   .doc(this.user.uid)
        //   .delete();
        this.myPeer && this.myPeer.destroy();
      }).bind(this)
    );
  },
  beforeDestroy() {
    this.myPeer && this.myPeer.destroy();
  },
  methods: {
    cancelVoiceRequest() {
      this.myPeer.destroy();
    },
    endVoiceChat() {
      this.myPeer.destroy();
    },
    async joinVoiceChat() {
      this.waiting = true;
      const userUID = this.user.uid,
        workspaceId = this.workspaceId;
      const peersRef = db
        .collection("workspaces")
        .doc(workspaceId)
        .collection("peers");
      const isInitator = await peersRef.get().then(querySnapshot => {
        console.log("querySnapshot");
        console.log(querySnapshot);
        return querySnapshot.empty;
      });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.myPeer = new Peer({
        initiator: isInitator,
        trickle: false,
        stream: stream
      });

      this.myPeer.on(
        "signal",
        async function(data) {
          // when peer1 has signaling data, give it to peer2 somehow
          // peer2.signal(data);
          peersRef
            .doc(userUID)
            .get()
            .then(snapshot => {
              console.log(snapshot);
              return snapshot.exists;
            })
            .then(isPeerDataOnFirestore => {
              if (!isPeerDataOnFirestore) {
                peersRef.doc(userUID).set({ data, name: this.user.name });
              }
            });
        }.bind(this)
      );

      const peerUnsub = peersRef.onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          console.log("onsnapshot");
          console.log(change);
          let doc = change.doc;
          if (change.type === "added" && doc.id !== userUID) {
            console.log(doc.data().data);
            this.myPeer.signal(doc.data().data);
          }
        });
      });

      this.myPeer.on(
        "connect",
        function() {
          this.waiting = false;
          peerUnsub();
          peersRef.get().then(querySnapshot => {
            querySnapshot.forEach(doc => {
              doc.ref.delete().then(() => console.log("del"));
            });
          });
          this.connected = true;
        }.bind(this)
      );

      this.myPeer.on(
        "close",
        function() {
          this.waiting = false;
          peerUnsub();
          peersRef.get().then(querySnapshot => {
            querySnapshot.forEach(doc => {
              doc.ref.delete().then(() => console.log("del"));
            });
          });
          stream.getTracks()[0].stop();
          this.connected = false;
        }.bind(this)
      );

      this.myPeer.on("stream", stream => {
        const audioElement = document.getElementById("vc-audio");
        try {
          console.log(stream);
          audioElement.srcObject = stream;
        } catch (error) {
          audioElement.src = window.URL.createObjectURL(stream);
          // const printStatement = {}
          this.debug = {
            createObjectURLWorks: audioElement.src,
            error: error
          };
        }
        audioElement.play();
      });
      this.myPeer.on("data", data => console.log(data));
    }
  }
};
</script>
