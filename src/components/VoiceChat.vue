<template>
  <div>
    <p>{{ debug }}</p>
    <v-btn
      @click="connected ? endVoiceChat() : joinVoiceChat()"
    >{{connected ? "End Voice Chat":"Join Voice Chat"}}</v-btn>
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
      debug: 'debug'
    };
  },
  methods: {
    endVoiceChat() {
      this.myPeer.destroy();
    },
    async joinVoiceChat() {
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

      this.myPeer.on("signal", async function(data) {
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
            console.log("signaldata");
            console.log(data);
            console.log(isPeerDataOnFirestore);
            if (!isPeerDataOnFirestore) {
              console.log("firsttimesetting signal data");
              peersRef
                .doc(userUID)
                .set({ data })
                .then(response => {
                  // console.log("response");
                  // console.log(response);
                });
            }
          });
      });

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
          }
        }
        audioElement.play();
      });
      this.myPeer.on("data", data => console.log(data));
    }
  }
};
</script>
