<template>
  <div>
    <video v-for="peer in connectedPeers" v-bind:key="peer.uid" :id="`video-${peer.uid}`"></video>
  </div>
</template>

<script>
  import Peer from "peerjs";
  import firebase from "firebase/app";
  import "firebase/firestore";

  import db from '@/database.js'

  export default {
    name: "VoiceChat",
    props: ["workspaceID", "user"],

    data() {
      return {
        myPeer: null,
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
      },

      user: async function (newVal, oldVal) {
        if (newVal.uid !== 'anonymous' && newVal.uid !== oldVal.uid && this.workspaceID !== undefined) {
          await this.connect(this.workspaceID);
        }
      }
    },

    methods: {
      async connect(workspaceID) {
        console.log('Connect.');

        // Create a stream.
        const stream = await navigator.mediaDevices.getUserMedia({audio: true});

        // Alias this component so callbacks can access it.
        const component = this;

        // Register listener for own queue.
        const callRef = firebase.database().ref(`/calls/${this.user.uid}`);
        callRef.on('child_added', data => {
          // Create a new peer to make the call.
          const peer = new Peer();

          // Call the peer.
          console.log(`Calling ${data.val().peerID}.`);
          const call = peer.call(data.val().peerID, stream);
          call.on('stream', remoteStream => {
            console.log(`Streaming call to ${call.peer}.`);
            console.log(remoteStream);
          });
          call.on('close', () => {
            console.log(`Closing call to ${call.peer}.`);
          });

          // Remove item from own queue.
          data.ref.remove();
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

          // Create a new peer to receive the call.
          const peer = new Peer();
          peer.on('open', async id => {
            console.log(`Created peer ${id} to receive calls.`);
            const callRef = firebase.database().ref(`/calls/${member.uid}`);
            const callItemRef = callRef.push();
            await callItemRef.set({
              userID: this.user.uid,
              peerID: peer.id
            });
          });
          peer.on('call', call => {
            console.log(`Received call from ${call.peer}.`);
            call.answer(stream);
            call.on('stream', remoteStream => {
              console.log(`Streaming call from ${call.peer}.`);
              console.log(remoteStream);
            });
            call.on('close', () => {
              console.log(`Closing call from ${call.peer}.`);
            });
          });
        }
      },

      disconnect(workspaceID) {

      },
    },
  }
</script>

<style scoped>

</style>