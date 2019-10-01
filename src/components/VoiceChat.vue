<template>

</template>

<script>
  import firebase from "firebase/app";
  import "firebase/firestore";

  export default {
    name: "VoiceChat",
    props: ["workspaceID", "user"],
    data() {
      return {
        myPeer: null,
        connectedPeers: {},
      };
    },
    watch: {
      workspaceID: async function (newVal, oldVal) {
        if (oldVal !== undefined) {
          await this.disconnect(oldVal);
        }
        if (newVal !== undefined) {
          await this.connect(newVal);
        }
      }
    },
    methods: {
      async connect(workspaceID) {
        // TODO(bobbyluig): Extract this to a helper function.
        const classID = this.$route.params.class_id;
        const firebaseClassID = classID.replace('.', '-');

        const allQueues = firebase.database().ref(`/queues/${firebaseClassID}/${workspaceID}`);
        const allQueuesSnapshot = await allQueues.once('value');
        if (allQueuesSnapshot.val()) {
          await allQueuesSnapshot.val();
          await ref.set({
            [this.user.uid]: {

            }
          })
        }

      },
      disconnect(workspaceID) {

      },
    },
  }
</script>

<style scoped>

</style>