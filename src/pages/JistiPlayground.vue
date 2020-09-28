<template>
  <v-app>
    <div id="jisti-video-conference" style="height: 100vh">

    </div>
  </v-app>
</template>

<script>
export default {
  mounted () {
    // this.connectToJisti2(); 
    this.connectToJisti();
  },
  data () {
    return {

    };
  },
  methods: {
    connectToJisti2 () {
      console.log("JistiMeetJS =", JistiMeetJS);
      // JitsiMeetJS.init();
      // var connection = new JitsiMeetJS.JitsiConnection(null, null, options);
    },
    connectToJisti () {
      const domain = 'meet.jit.si'; 
      const options = {
        parentNode: document.querySelector("#jisti-video-conference"),
        roomName: "my-explain-room-id",
        userInfo: {
          display: "Richard Feynman"
        }
      }; 
      const api = new JitsiMeetExternalAPI(domain, options);
      console.log("jisti initialized, api =", api);
      console.log("Jisti initialized!");
    }
  }
};
</script>