<template>
  <div>
    <ul>
      <li v-for="peer in connectedPeers">
        {{ peer.uid }}
      </li>
    </ul>

    <video v-for="peer in connectedPeers" v-bind:key="peer.uid" :id="`video-${peer.uid}`" style="display: none;"></video>
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
        callRef: null,
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
        console.log(`Connect to workspace ${workspaceID} with voice.`);

        // Create a stream.
        const stream = await navigator.mediaDevices.getUserMedia({audio: true});

        // Alias this component so callbacks can access it.
        const component = this;

        // Register listener for own queue.
        this.callRef = firebase.database().ref(`/calls/${this.user.uid}`);
        this.callRef.on('child_added', data => {
          // Create a new peer to make the call.
          const peer = new Peer();

          // Fetch values.
          const peerID = data.val().peerID;
          const userID = data.val().userID;

          // Already in a call with the peer. Close the old connection.
          const oldPeer = component.connectedPeers.find(peer => peer.uid === userID);
          if (oldPeer !== undefined){
            oldPeer.call.close();
            oldPeer.peer.destroy();
            component.connectedPeers = component.connectedPeers.filter(peer => peer.uid !== userID);
          }

          // Call the peer.
          console.log(`Calling ${peerID}.`);
          const call = peer.call(peerID, stream);
          call.on('stream', remoteStream => {
            console.log(`Streaming call to ${userID}.`);
            component.connectedPeers.push({
              uid: data.val().userID,
              call: call,
              peer: peer,
            });
            document.getElementById('video-')
          });
          call.on('close', () => {
            console.log(`Closing call to ${userID}.`);
            component.connectedPeers = component.connectedPeers.filter(peer => peer.uid !== userID);
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
            console.log(`Received call from ${member.uid}.`);
            call.answer(stream);
            call.on('stream', remoteStream => {
              console.log(`Streaming call from ${member.uid}.`);
              component.connectedPeers.push({
                uid: member.uid,
                call: call,
                peer: peer,
              });
            });
            call.on('close', () => {
              console.log(`Closing call from ${member.uid}.`);
              component.connectedPeers = component.connectedPeers.filter(peer => peer.uid !== member.uid);
            });
          });
        }
      },

      disconnect(workspaceID) {
        this.callRef.off();
        this.connectedPeers.forEach(peer => {
          peer.call.close();
          peer.peer.destroy();
        });
        this.connectedPeers = [];
      },
    },
  }
</script>

<style scoped>

</style>