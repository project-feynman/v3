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
      },

      user: async function (newVal, oldVal) {
        if (newVal.uid !== 'anonymous' && newVal.uid !== oldVal.uid) {
          this.createPeer(newVal);
        }
      }
    },

    methods: {
      async createPeer(user) {
        const stream = await navigator.mediaDevices.getUserMedia({audio: true});
        const component = this;

        if (this.user.uid === 'anonymous') {
          console.log('Anonymous user, disabling audio chat.');
        } else {
          console.log(`Creating peer for ${user.uid}.`);
        }

        this.myPeer = new Peer(user.uid);
        this.myPeer.on('call', call => {
          console.log(`Received call from ${call.peer}.`);
          call.answer(stream);
          call.on('stream', remoteStream => {
            console.log(`Streaming call from ${call.peer}.`);
            console.log(remoteStream);
          });
        });
      },

      async connect(workspaceID) {
        console.log('Connect.');

        // Alias this component so callbacks can access it.
        const component = this;

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
          const stream = await navigator.mediaDevices.getUserMedia({audio: true});

          console.log(`Calling ${member.uid}.`);
          const call = this.myPeer.call(member.uid, stream);
          call.on('stream', remoteStream => {
            console.log(`Streaming call to ${call.peer}.`);
            console.log(remoteStream);
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