<template>
  <div id="jisti-video-conference" style="height: 60vh">

  </div>
</template>

<script>
import { mapState } from "vuex"; 

export default {
  props: {
    roomID: {
      type: String,
      required: true
    }
  },
  mounted () {
    this.connectToJisti();
  },
  data () {
    return {

    };
  },
  computed: {
    ...mapState(["user"])
  },
  methods: {
    connectToJisti () {
      const domain = 'meet.jit.si'; 
      const options = {
        parentNode: document.querySelector("#jisti-video-conference"),
        roomName: this.roomID,
        userInfo: {
          displayName: `${this.user.firstName} ${this.user.lastName} `
        }
      }; 
      const api = new JitsiMeetExternalAPI(domain, options);
    }
  }
};
</script>