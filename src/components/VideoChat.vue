<template>
  <!-- https://github.com/muaz-khan/RTCMultiConnection/blob/master/demos/vuejs-video-conferencing.html -->
  <div>
    <div class="text-xs-center">
      <!-- <div>My ID: {{ myID }}</div> -->
      <template v-if="connection">
        <!-- <div>connection.sessionid = {{ connection.sessionid }}</div> -->
        <!-- <div>connection.channel = {{ connection.channel }}</div>  -->
        <div>connection.peers = {{ connection.peers }}</div>
        <!-- <div>Object.keys(connection.streamEvents).length = {{ Object.keys(connection.streamEvents) }}</div>
        <div>connection.streamEvents = {{ connection.streamEvents }}</div> -->
        <!-- <div>betaParticipants = {{ betaParticipants }}</div> -->
        <input v-show="false" type="text" id="room-id" value="abcdef" autocorrect=off autocapitalize=off size=20>
      </template>
      <div>{{ participants.length }} other people connected to voice chat: {{ participants }}</div>
    </div>

    <div v-show="true" class="text-xs-center">
      <div v-show="!isStreamingLocally">
        <v-btn v-show="!hasAudioRoom"><div id="open-room">OPEN AUDIO ROOM</div></v-btn>
        <v-btn v-show="hasAudioRoom"><div id="join-room">JOIN AUDIO ROOM</div></v-btn>
      </div>
      <v-btn 
        v-show="isStreamingLocally" 
        @click="stopAllStreams()"
      >
        STOP STREAM
      </v-btn>
      <!-- <v-btn @click="getOtherParticipants()">UPDATE PARTICIPANTS</v-btn> -->
      <div v-show="false" id="open-or-join-room">OPEN OR JOIN ROOM</div> 
    </div>
    <!-- CONNECT/DISCONNECT BUTTONS -->
    <div class="text-xs-center">
      <!-- <v-btn @click="closeSocket()">CLOSE SOCKET</v-btn> -->
      <!-- <v-btn @click="deletePeer()">DELETE PEER</v-btn> -->
      <!-- <v-btn @click="openOrJoinRoom()">OPEN OR JOIN ROOM</v-btn> -->
      <!-- <v-btn @click="disconnectEachParticipant()">DISCONNECT TO VOICE CHAT</v-btn> -->
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
  props: ['workspaceID', 'hasAudioRoom'],
  components: {
    TodoItem
  },
  data () {
    return {
      videosList: [],
      connection: null,
      participants: [],
      betaParticipants: [],
      myID: '',
      isStreamingLocally: false
    }
  },
  watch: {
    workspaceID: {
      handler: 'leavePrevAndJoinNew'
    }
  },
  created () {
    // set basic properties for RTCMulticonnection
    this.connection = new RTCMultiConnection()
    // console.log('initially, this.connection =', this.connection)
    this.connection.socketURL = 'https://rtcmulticonnection.herokuapp.com:443/'

    this.connection.socketMessageEvent = 'video-conference-demo'
    this.connection.session = {
      audio: true,
      video: false
      // video: false
    }
    // console.log('this.connection.session =', this.connection.session)

    // MAGIC LINE DO NOT REMOVE
    this.connection.mediaConstraints = {
      audio: true,
      video: false
    }

    this.connection.sdpConstraints.mandatory = {
      OfferToReceiveAudio: true,
      OfferToReceiveVideo: false
    }

    this.connection.autoCreateMediaElement = false

    // set event callbacks for the RTCMulticonnection 
    this.connection.onstream = (event) => {
      // does this mean you just received a stream or that you are 
      // emitting a stream to someone else? 
      // the distinction matters.
      setTimeout(this.updateParticipants, 1000)
      console.log('onstream event')
      console.log('event.stream =', event.stream)
      this.isStreamingLocally = true
      // modify it - so that it rejects remote streams if it comes from yourself 
      this.videosList.push({
        id: event.streamid,
        srcObject: event.stream,
        muted: event.type === 'local'
      })
    }

    this.connection.onNewParticipant = event => {
      console.log('onNewParticipant()')
    }

    this.connection.onleave = event => {
      console.log('onleave()')
    }

    this.connection.onUserStatusChanged = event => {
      console.log('onUserStatusChanged()')
    }

    this.connection.onstreamended = (event) => {
      console.log('onstreamended event')
      this.myID = this.connection.userid
      setTimeout(this.updateParticipants, 1000)
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
      // this.disableInputButtons()
      console.log(`document.getElementById('room-id').value = ${document.getElementById('room-id').value}`)
      this.connection.open(document.getElementById('room-id').value, () => {
        this.$emit('open-room')
        // console.log('this.connection.sessionid =', this.connection.sessionid)
        // this.showRoomURL(this.connection.sessionid)
      })
    }
    document.getElementById('join-room').onclick = () => {
      // this.disableInputButtons()
      this.connection.join(document.getElementById('room-id').value)
    }
    document.getElementById('open-or-join-room').onclick = () => {
      // this.disableInputButtons()
      this.connection.openOrJoin(document.getElementById('room-id').value, (isRoomExist, roomid) => {
        if (isRoomExist === false && this.connection.isInitiator === true) {
          // if room doesn't exist, it means that current user will create the room
        }
      })
    }
    // workspace ID is the server ID
    const roomid = this.workspaceID
    document.getElementById('room-id').value = roomid

    this.connection.onNewParticipant = (participantId, userPreferences) => {
      console.log('onNewParticipant()')
      setTimeout(this.updateParticipants, 1000)
      // this.updateParticipants()
      // if OfferToReceiveAudio/OfferToReceiveVideo should be enabled for specific users
      userPreferences.localPeerSdpConstraints.OfferToReceiveAudio = true
      userPreferences.localPeerSdpConstraints.OfferToReceiveVideo = false

      userPreferences.dontAttachStream = false; // according to situation
      userPreferences.dontGetRemoteStream = false;  // according to situation

      // below line must be included. Above all lines are optional.
      // if below line is NOT included; "join-request" will be considered rejected.
      this.connection.acceptParticipationRequest(participantId, userPreferences);
    }

    this.connection.onPeerStateChanged = function(state) {
      console.log('onPeerStateChanged()')
      if (state.iceConnectionState.search(/closed|failed/gi) !== -1) {
        console.error('Peer connection is closed between you & ', state.userid, state.extra, 'state:', state.iceConnectionState);
      }
    };
  },
  methods: {
    closeSocket () {
      this.connection.closeSocket()
    },
    deletePeer () {
      // close a connection with a specific user - which of course is not the same as just removing yourself from everyone 
      this.connection.deletePeer(this.myID)
    },
    getOtherParticipants () {
      this.connection.getAllParticipants().forEach(participantId => {
        this.betaParticipants.push(participantId)
        var user = this.connection.peers[participantId]
        // var hisFullName = user.extra.fullName
        // var hisUID = user.userid
        var hisNativePeer = user.peer
        var hisIncomingStreams = user.peer.getRemoteStreams()
        console.log('user =', user)
        console.log('hisNativePeer =', user.peer)
        console.log('hisIncomingStreams =', user.peer.getRemoteStreams())
        // var hisDataChannels = user.channels
      })
    },
    stopAllStreams () {
      this.connection.attachStreams.forEach(function(stream) {
        stream.stop()
      })
    },
    updateParticipants () {
      console.log('updateParticipants()')
      this.myID = this.connection.userid
      this.participants = [] 
      this.connection.getAllParticipants().forEach(participantId => {
        this.participants.push(participantId)
      })
    },
    leavePrevAndJoinNew() {
      this.videoList = [] 
    },
    disconnectEachParticipant () {
      // for each OTHER person, disconnect the stream with them 
      this.participants.forEach(participantID => this.connection.disconnectWith(participantID))
      // this.connection.getAllParticipants().forEach(participantId => {
      //     console.log('disconnecting participant =', participantId)
      //     this.connection.disconnectWith( participantId );
      // })
      this.videosList = [] 
    },
    openOrJoinRoom () {
      this.disableInputButtons()
      this.connection.openOrJoin(document.getElementById('room-id').value, (isRoomExist, roomid) => {
        if (isRoomExist === false && this.connection.isInitiator === true) {
          // if room doesn't exist, it means that current user will create the room
          // this.showRoomURL(roomid)
        }
      })
    },
    // disableInputButtons () {
    //   // document.getElementById('room-id').onkeyup();
    //   document.getElementById('open-or-join-room').disabled = true
    //   document.getElementById('open-room').disabled = true
    //   document.getElementById('join-room').disabled = true
    //   document.getElementById('room-id').disabled = true
    // }
  }
}
</script>
