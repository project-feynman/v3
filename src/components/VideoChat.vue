<template>
  <!-- https://github.com/muaz-khan/RTCMultiConnection/blob/master/demos/vuejs-video-conferencing.html -->
  <div>
    <input type="text" id="room-id" value="abcdef" autocorrect=off autocapitalize=off size=20>
    <div id="open-room">Open Room</div> 
    <div id="join-room">Join Room</div> 
    <div id="open-or-join-room">Open or Join Room</div> 
    <v-btn @click="leaveRoom()">Leave voice chat</v-btn>
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
      connection: null
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
      video: true
    }

    this.connection.sdpConstraints.mandatory = {
      OfferToReceiveAudio: true,
      OfferToReceiveVideo: true
    }

    this.connection.autoCreateMediaElement = false;
    this.connection.onstream = (event) => {
      this.videosList.push({
        id: event.streamid,
        srcObject: event.stream,
        muted: event.type === 'local'
      })
    }

    this.connection.onstreamended = (event) => {
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
    document.getElementById('open-room').onclick = () => {
      this.disableInputButtons()
      this.connection.open(document.getElementById('room-id').value, () => {
        this.showRoomURL(this.connection.sessionid)
      })
    }
    document.getElementById('join-room').onclick = () => {
      this.disableInputButtons()
      this.connection.join(document.getElementById('room-id').value)
    }
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
    roomid = this.workspaceID
    document.getElementById('room-id').value = roomid
    document.getElementById('room-id').onkeyup = () => {
      localStorage.setItem(this.connection.socketMessageEvent, document.getElementById('room-id').value)
    }
    var hashString = location.hash.replace('#', '')
    if (hashString.length && hashString.indexOf('comment-') == 0) {
      hashString = ''
    }
    // console.log('params =', params)
    // console.log('hashString =', hashString)
    var roomid = params.roomid
    if (!roomid && hashString.length) {
      roomid = hashString
    }
    // JOIN ROOM 

    this.openOrJoinRoom()

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
    leavePrevAndJoinNew() {
      this.videoList = [] 
    },
    leaveRoom () {
      this.connection.getAllParticipants().forEach(participantId => {
          console.log('disconnecting participant =', participantId)
          this.connection.disconnectWith( participantId );
      });
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
