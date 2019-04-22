<template>
  <!-- https://github.com/muaz-khan/RTCMultiConnection/blob/master/demos/vuejs-video-conferencing.html -->
  <div>
    <div class="text-xs-center">
      <div>My ID: {{ myID }}</div>
      <div>{{ participants.length }} other people connected to voice chat: {{ participants }}</div>
    </div>

    <div v-show="false">
      <input type="text" id="room-id" value="abcdef" autocorrect=off autocapitalize=off size=20>
      <div id="open-room">Open Room</div> 
      <div id="join-room">Join Room</div> 
      <div id="open-or-join-room">OPEN OR JOIN ROOM</div> 
    </div>
    <!-- CONNECT/DISCONNECT BUTTONS -->
    <div class="text-xs-center">
      <v-btn @click="stopWebcam()">STOP STREAM</v-btn>
      <v-btn @click="openOrJoinRoom()">CONNECT TO VOICE CHAT</v-btn>
      <v-btn @click="leaveRoom()">DISCONNECT TO VOICE CHAT</v-btn>
    </div>
    <!-- VIDEOS -->
    <todo-item
      v-for="item in videosList"
      :todo="item"
      :key="item.id">
    </todo-item>
    <div id="room-urls" style="text-align: center;display: none;background: #F1EDED;margin: 15px -10px;border: 1px solid rgb(189, 189, 189);border-left: 0;border-right: 0;"></div>
  </div>
</template>

<script>
import TodoItem from '@/components/TodoItem.vue'

export default {
  props: ['workspaceID'],
  components: {
    TodoItem
  },
  data () {
    return {
      videosList: [],
      connection: null,
      participants: [],
      myID: ''
    }
  },
  watch: {
    workspaceID: {
      handler: 'leavePrevAndJoinNew'
    }
  },
  created () {
    this.connection = new RTCMultiConnection()
    this.connection.socketURL = 'https://rtcmulticonnection.herokuapp.com:443/'

    this.connection.socketMessageEvent = 'video-conference-demo';
    this.connection.session = {
      audio: true,
      video: false
      // video: false
    }
    console.log('this.connection.session =', this.connection.session)

    // MAGIC LINE DO NOT REMOVE
    this.connection.mediaConstraints = {
      audio: true,
      video: false
    }

    this.connection.sdpConstraints.mandatory = {
      OfferToReceiveAudio: true,
      OfferToReceiveVideo: false
    }

    this.connection.autoCreateMediaElement = false;
    this.connection.onstream = (event) => {
      setTimeout(this.showAllParticipants, 1000)
      console.log('onstream event')
      this.videosList.push({
        id: event.streamid,
        srcObject: event.stream,
        muted: event.type === 'local'
      })
    }

    this.connection.onstreamended = (event) => {
      console.log('onstreamended event')
      this.myID = this.connection.userid
      setTimeout(this.showAllParticipants, 1000)
      var newList = []
      this.videosList.forEach(item => {
        if (item.id !== event.streamid) {
          newList.push(item)
        }
      })
      this.videosList = newList
    }
  },
  mounted () {
    // document.getElementById('open-room').onclick = () => {
    //   this.disableInputButtons()
    //   this.connection.open(document.getElementById('room-id').value, () => {
    //     this.showRoomURL(this.connection.sessionid)
    //   })
    // }
    // document.getElementById('join-room').onclick = () => {
    //   this.disableInputButtons()
    //   this.connection.join(document.getElementById('room-id').value)
    // }
    document.getElementById('open-or-join-room').onclick = () => {
      this.disableInputButtons()
      this.connection.openOrJoin(document.getElementById('room-id').value, (isRoomExist, roomid) => {
        if (isRoomExist === false && this.connection.isInitiator === true) {
          // if room doesn't exist, it means that current user will create the room
          this.showRoomURL(roomid);
        }
      })
    }

    (function() {
      var params = {},
          r = /([^&=]+)=?([^&]*)/g;
      function d(s) {
        return decodeURIComponent(s.replace(/\+/g, ' '));
      }
      var match, search = window.location.search;
      while (match = r.exec(search.substring(1)))
          params[d(match[1])] = d(match[2])
      window.params = params
    })()

    var roomid = ''
    if (localStorage.getItem(this.connection.socketMessageEvent)) {
      roomid = localStorage.getItem(this.connection.socketMessageEvent)
    } else {
      roomid = this.connection.token()
    }

    // workspace ID is the server ID
    roomid = this.workspaceID
    document.getElementById('room-id').value = roomid
    document.getElementById('room-id').onkeyup = () => {
      localStorage.setItem(this.connection.socketMessageEvent, document.getElementById('room-id').value)
    }
    var hashString = location.hash.replace('#', '')
    if (hashString.length && hashString.indexOf('comment-') == 0) {
      hashString = ''
    }

    var roomid = params.roomid
    if (!roomid && hashString.length) {
      roomid = hashString
    }

    // // JOIN ROOM 
    // console.log('CALLED OPENORJOINROOM()')
    // this.openOrJoinRoom()

    this.connection.onNewParticipant = (participantId, userPreferences) => {
      console.log('NEW PARTICIPANT JOINED, LET"S UPDATE THE PARTICIPANTS LIST')
      setTimeout(this.showAllParticipants, 1000)
      // this.showAllParticipants()
      // if OfferToReceiveAudio/OfferToReceiveVideo should be enabled for specific users
      userPreferences.localPeerSdpConstraints.OfferToReceiveAudio = true
      userPreferences.localPeerSdpConstraints.OfferToReceiveVideo = false

      userPreferences.dontAttachStream = false; // according to situation
      userPreferences.dontGetRemoteStream = false;  // according to situation

      // below line must be included. Above all lines are optional.
      // if below line is NOT included; "join-request" will be considered rejected.
      this.connection.acceptParticipationRequest(participantId, userPreferences);
    }






    if (roomid && roomid.length) {
      document.getElementById('room-id').value = roomid
      localStorage.setItem(this.connection.socketMessageEvent, roomid)
      // auto-join-room
      (function reCheckRoomPresence() {
        this.connection.checkPresence(roomid, function(isRoomExist) {
          if (isRoomExist) {
              this.connection.join(roomid)
              return
          }
          setTimeout(reCheckRoomPresence, 5000)
        })
      })()
      this.disableInputButtons()
    }
  },
  methods: {
    stopWebcam () {
      this.connection.attachStreams.forEach(function(stream) {
          stream.stop();
      });
    },
    updateParticipants () {
      this.participants = []
      this.connection.getAllParticipants().forEach(participantID => {
        this.participants.push(participantID)
      })
    },
    showAllParticipants () {
      this.myID = this.connection.userid
      this.participants = [] 
      this.connection.getAllParticipants().forEach(participantId => {
        this.participants.push(participantId)
      })

    },
    leavePrevAndJoinNew() {
      this.videoList = [] 
    },
    leaveRoom () {
      // for each OTHER person, disconnect the stream with them 
      this.participants.forEach(participantID => this.connection.disconnectWith(participantID))


      // this.connection.getAllParticipants().forEach(participantId => {
      //     console.log('disconnecting participant =', participantId)
      //     this.connection.disconnectWith( participantId );
      // });
      this.videosList = [] 
    },
    openOrJoinRoom () {
      this.disableInputButtons()
      this.connection.openOrJoin(document.getElementById('room-id').value, (isRoomExist, roomid) => {
        if (isRoomExist === false && this.connection.isInitiator === true) {
          // if room doesn't exist, it means that current user will create the room
          this.showRoomURL(roomid)
        }
      })
    },
    disableInputButtons () {
      document.getElementById('room-id').onkeyup();
      document.getElementById('open-or-join-room').disabled = true;
      document.getElementById('open-room').disabled = true;
      document.getElementById('join-room').disabled = true;
      document.getElementById('room-id').disabled = true;
    },
    showRoomURL (roomid) {
      var roomHashURL = '#' + roomid
      var roomQueryStringURL = '?roomid=' + roomid
      var html = '<h2>Unique URL for your room:</h2><br>'
      html += 'Hash URL: <a href="' + roomHashURL + '" target="_blank">' + roomHashURL + '</a>'
      html += '<br>'
      html += 'QueryString URL: <a href="' + roomQueryStringURL + '" target="_blank">' + roomQueryStringURL + '</a>'
      var roomURLsDiv = document.getElementById('room-urls')
      roomURLsDiv.innerHTML = html;
      roomURLsDiv.style.display = 'block'
    }
  }
}
</script>
