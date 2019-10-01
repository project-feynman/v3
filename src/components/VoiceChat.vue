<template>
  <div>
    <video v-for="peer in connectedPeers" v-bind:key="peer.uid" :id="`video-${peer.uid}`"></video>
  </div>
</template>

<script>
  import Peer from "simple-peer";
  import firebase from "firebase/app";
  import "firebase/firestore";

  import db from '@/database.js'

  export default {
    name: "VoiceChat",
    props: ["workspaceID", "user"],

    data() {
      return {
        myPeer: null,
        queueRef: null,
        pendingPeers: [],
        connectedPeers: [],
      };
    },

    watch: {
      workspaceID: async function (newVal, oldVal) {
        if (this.user.uid === 'anonymous') {
          return;
        }

        if (oldVal !== undefined) {
          await this.disconnect(oldVal);
        }
        if (newVal !== undefined) {
          await this.connect(newVal);
        }
      }
    },

    methods: {
      async getOrCreatePeer(peerID, initiator) {
        // Alias this component so callbacks can access it.
        const component = this;

        // Get permission for audio.
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        // If already connected, do nothing.
        const connectedPeer = this.connectedPeers.find(peer => peer.uid === peerID);
        if (connectedPeer !== undefined) {
          return connectedPeer;
        }

        // If already pending, do nothing.
        const pendingPeer = this.pendingPeers.find(peer => peer.uid === peerID);
        if (pendingPeer !== undefined) {
          return pendingPeer;
        }

        // Create a new peer using the stream.
        const peer = new Peer({
          initiator: initiator,
          stream: stream,
        });

        this.pendingPeers.push(peer);

        peer.on('signal', async signal => {
          const queueItemRef = firebase.database().ref(`/queues/${peerID}/${component.user.uid}`);
          await queueItemRef.set({
            initiator: initiator,
            signal: JSON.stringify(signal),
          });
        });

        peer.on('close', () => {
          component.pendingPeers = component.pendingPeers.filter(peer => peer.uid !== peerID);
          component.connectedPeers = component.connectedPeers.filter(peer => peer.uid !== peerID);
        });

        peer.on('stream', stream => {
          component.pendingPeers = component.pendingPeers.filter(peer => peer.uid !== peerID);
          component.connectedPeers.push({
            uid: peer.uid,
            peerObject: peer,
          });

          const video = document.getElementById(`video-${peerID}`);

          if ('srcObject' in video) {
            video.srcObject = stream;
          } else {
            video.src = window.URL.createObjectURL(stream);
          }

          video.play();
        });

        return peer;
      },

      async connect(workspaceID) {
        console.log('connect');

        // Alias this component so callbacks can access it.
        const component = this;

        // Register listener for own queue.
        this.queueRef = firebase.database().ref(`/queues/${this.user.uid}`);
        this.queueRef.on('child_added', async data => {
          // Find or create the peer connection.
          const peer = await component.getOrCreatePeer(data.key, !data.val().initiator);

          // Signal the peer, which must occur whether or not this client initiated.
          peer.signal(JSON.parse(data.val().signal));

          // Remove item from own queue.
          await data.ref.remove();
        });

        // Extract the current list of members in the group.
        // TODO(bobbyluig): Rethink whether this is the best place to keep this data. There is a race condition here.
        const classID = this.$route.params.class_id;
        const workspaceRef = db.collection('classes').doc(classID).collection('workspaces').doc(workspaceID);
        const workspace = await workspaceRef.get();
        const members = workspace.data().members;

        // Create a peer connection to all members.
        for (const member of members) {
          // No need to connect to self or anonymous.
          if (member.uid === this.user.uid || member.uid === 'anonymous') {
            continue;
          }

          // Create a peer connection.
          this.getOrCreatePeer(member.uid, true);
        }
      },

      disconnect(workspaceID) {

      },
    },
  }
</script>

<style scoped>

</style>