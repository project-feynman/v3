<template>
  <portal v-if="roomTypeDoc" to="side-drawer">
    <v-list-item two-line style="padding-left: 10x">
      <v-btn @click="$router.push(`/class/${classID}`)" icon class="mr-2">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>

        <!-- <v-list-item-avatar @click="$router.push('/')" tile :width="`${40+3}px`" style="cursor: pointer;" :style="`margin-right: ${16-3}px`">
          <img src="/logo.png">
        </v-list-item-avatar> -->

        <v-list-item-content>
          <v-list-item-title style="opacity: 80%; font-size: 1.3rem">{{ roomTypeDoc.name }}</v-list-item-title>
        </v-list-item-content>

        <v-list-item-action>
          <v-dialog v-model="showLibrary" fullscreen>
            <template v-slot:activator="{ on, attrs }">
              <v-btn v-on="on" v-bind="attrs" tile style="padding: 0 8px">
                <v-icon>mdi-bookshelf</v-icon>
              </v-btn>
            </template>

            <v-toolbar dark>
              <v-btn icon dark @click="showLibrary = false">
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </v-toolbar>

            <ClassLibrary/>
          </v-dialog>
        </v-list-item-action>
      </v-list-item>
      
      <!-- <v-divider/> -->

    <portal to="app-bar">

    </portal>



    <!-- <v-row justify="center" align="center" class="px-5">
      <v-btn @click="$router.push(`/class/${classID}`)" icon>
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>

      <v-subheader style="font-size: 0.9rem; font-weight: 400; color: #424242; opacity: 81%;">
        {{ roomTypeDoc.name }}
      </v-subheader>

      <v-spacer/>
    </v-row> -->

    <v-row v-if="isAdmin" justify="center">
      <BasePopupButton actionName="Shuffle everyone" @action-do="shuffleParticipants(roomTypeDoc.id)">
        <template v-slot:activator-button="{ on }">
          <BaseButton :on="on" icon="mdi-shuffle-variant" small color="black">
            Shuffle people
          </BaseButton>
        </template>
        
        <template v-slot:message-to-user>
          <v-row>
            <v-col cols="12" sm="4">
              <v-overflow-btn 
                label="3"
                :items="[2, 3, 4, 5]"
                @change="groupSize => groupSize = groupSize"
              />
            </v-col>
            <v-col>
              <h3 class="mt-5">
                people per group
              </h3>
            </v-col>
          </v-row>
        </template> 
      </BasePopupButton>

      <BaseButton @click="showMakeAnnouncementPopup(roomTypeDoc.id)" small icon="mdi-bullhorn" color="black">
        Announce
      </BaseButton>
      
      <BaseButton @click="muteParticipantsInRooms(roomTypeDoc.id)" small icon="mdi-volume-mute" color="black">
        Mute all
      </BaseButton>

      <BaseButton @click="clearRoomStatuses(roomTypeDoc.id)" small icon="mdi-comment-remove" color="black">
        Clear statuses
      </BaseButton>

      <BaseButton small disabled icon="mdi-music-clef-treble" color="grey">
        Play music
      </BaseButton>
        
      <BaseButton @click="$refs.fileInput.click()" icon="mdi-file-pdf" color="black">
        <input 
          @change="e => seedEachRoomWithProblem (e)" 
          style="display: none" 
          type="file" 
          ref="fileInput"
        >
        Set problem
      </BaseButton>
    </v-row>

    <v-divider/>

    <div style="padding-top: 40px; padding-left: 16px; padding-bottom: 12px; font-size: 1.25rem">
      Rooms
    </div>


    <!-- COMMON ROOM-->
    <v-list-item v-if="commonRoomDoc" :key="commonRoomDoc.id"
      :to="`/class/${classID}/section/${sectionID}/`"
      exact exact-active-class="active-blackboard accent--text"
    >
      <div class="py-5" style="width: 100%">
        <div class="font-weight-medium" :class="$route.params.room_id ? 'text--secondary' : ''" style="font-size: 0.75em">
          COMMON ROOM
        </div>
        <portal-target v-if="!currentRoomID" name="current-room-participants">

        </portal-target>
         

        <!-- Quickfix  -->
        <div v-else style="width: 100%;">
          <div class="d-flex">

            <v-spacer/>

            <v-chip v-if="commonRoomDoc.status" color="blue" outlined small>
            {{ commonRoomDoc.status }}
            </v-chip>
          </div>

          <div class="pl-3">
            <p v-for="p in roomIDToParticipants[commonRoomDoc.id]" :key="p.id"
              style="font-weight: 400; font-size: 0.8em"
              class="text--secondary mb-0"
            >
              {{ p.firstName + " " + p.lastName }}
            </p>
          </div>
        </div>
      </div>
    </v-list-item> 

    <!-- OTHER ROOMS -->
    <v-list-item v-for="(room, i) in nonCommonRooms" :key="room.id"
      :to="`/class/${classID}/section/${sectionID}/room/${room.id}`"
      active-class="active-blackboard accent--text"
    >
      <!-- CASE 1: I'm in the room -->
      <template v-if="room.id === currentRoomID">
        <div class="py-5" style="width: 100%">
          <div class="text-uppercase font-weight-medium" style="font-size: 0.75em">
            Room {{ i + 1 }}
          </div>

          <div class="d-flex">
            <v-chip v-if="room.status" color="blue" class="mt-3" small outlined>
              {{ room.status }}
            </v-chip>

            <v-spacer/>

            <BaseButton @click="setRoomStatusPopup(true, room.id)" icon="mdi-message-alert" color="blue" small>
              Update status
            </BaseButton>
          </div>

          <!-- list of participants -->
          <!-- Get the current Twilio Participants -->
          <portal-target name="current-room-participants">

          </portal-target>
        </div>
      </template>

      <!-- CASE 2: I'm not in the room-->
      <template v-else>
        <div style="width: 100%;">
          <div class="d-flex">
            <div class="text-uppercase font-weight-medium text--secondary" style="font-size: 0.75em">
              Room {{ i+1 }}
            </div>
            <v-spacer/>

            <v-chip v-if="room.status" color="blue" outlined small>
            {{ room.status }}
            </v-chip>
          </div>

          <div class="pl-3">
            <p v-for="p in roomIDToParticipants[room.id]" :key="p.id"
              style="font-weight: 400; font-size: 0.8em"
              class="text--secondary mb-0"
            >
              {{ p.firstName + " " + p.lastName }}
            </p>
          </div>
        </div>
      </template>
    </v-list-item>  
<!-- 
    <BaseButton v-if="isAdmin && rooms.length !== 0" 
      @click="createNewRoom()" 
      block outlined icon="mdi-plus" color="grey"
    >
      New room
    </BaseButton> -->

    <!-- Twilio Room with Collaborative Blackboard -->
    <portal to="main-content">
      <router-view :key="$route.params.section_id + $route.params.room_id"/>
    </portal>

    <!-- Update status popup TODO: use base popupButton -->
    <template v-if="isInRoom">
      <v-dialog :value="roomStatusPopup.show" persistent max-width="600px">
        <v-card>
          <v-card-title>
            <span class="headline">
              Update status
            </span>
          </v-card-title>
          <v-card-text>
            <v-text-field v-model="roomStatusPopup.status" placeholder="(You can empty the status by entering nothing.)"/>
          </v-card-text>
          <v-card-actions>
            <v-spacer/>
            <v-btn @click="roomStatusPopup.show = false" color="secondary" text>
              Cancel
            </v-btn>
            <v-btn @click="setRoomStatus(roomStatusPopup.status)" color="secondary" text>
              Update status
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </template>
    
    <!-- TODO: Refactor into TwilioRoom -->
    <!-- Announcement creation popup -->
    <v-dialog :value="makeAnnouncementPopup.show" persistent max-width="600px">
      <v-card>
        <v-card-title>
          <span class="headline">
            Make Announcement
          </span>
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="makeAnnouncementPopup.message"
            placeholder="Type announcement here..."
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer/>
          <v-btn @click="makeAnnouncementPopup.show = false" color="secondary" text>
            Cancel
          </v-btn>
          <v-btn
            @click="makeAnnouncement(makeAnnouncementPopup.message, makeAnnouncementPopup.roomType)"
            color="secondary"
            text
          >
            Make announcement
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Refactor into RealtimeSpace -->
    <HandleAnnouncements v-if="currentRoomDoc" 
      :roomDoc="currentRoomDoc" 
      :key="currentRoomID + '1'"
    />

    <!-- CONTROL DASHBOARD -->
    <portal to="side-drawer-bottom-region">
      <v-card color="black"  >
        <v-card-title class="mb-0 pb-0 white--text">
          {{ user.firstName + " " + user.lastName }}
        </v-card-title>

        <v-card-text>
          <!-- User mute/deafen/etc. buttons -->
          <portal-target name="destination2">

          </portal-target>
        </v-card-text>
      </v-card>
    </portal>
  </portal>
</template>

<script>
import db from "@/database.js";
import { getRandomId } from "@/helpers.js";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import { mapState, mapGetters } from "vuex"; 
import BaseButton from "@/components/BaseButton.vue";
import BasePopupButton from "@/components/BasePopupButton.vue";
import HandleAnnouncements from "@/components/HandleAnnouncements.vue"; 
import SmallAppBar from "@/components/SmallAppBar.vue";
import firebase from "firebase/app";
import "firebase/firestore"; 
import ClassLibrary from "@/pages/ClassLibrary.vue";

export default {
  name: "ParticularOpenSpace",
  mixins: [
    DatabaseHelpersMixin
  ],
  components: {
    SmallAppBar,
    BaseButton,
    BasePopupButton,
    HandleAnnouncements,
    ClassLibrary
  },
  data () {
    return {
      showLibrary: false,
      roomTypeDoc: null,
      rooms: [],
      participants: [],
      updateParticipantsTimeout: null,
      unsubFuncs: [],
      makeAnnouncementPopup: {
        show: false,
        roomType: null,
        message: null
      },
      roomStatusPopup: {
        show: false,
        roomID: null,
        status: ""
      },
      groupSize: 3,
      minRoomSizeOnShuffle: 2
    }
  },
  computed: {
    ...mapState([
      "user",
      "mitClass",
      "session"
    ]),
    ...mapGetters([
      "isAdmin"
    ]),
    classID () {
      return this.$route.params.class_id; 
    },
    sessionID () {
      return this.session.currentID;
    },
    sectionID () {
      return this.$route.params.section_id;
    },
    nonCommonRooms () {
      return this.rooms.filter(room => !room.isCommonRoom)
    },
    isInRoom () { 
      return "room_id" in this.$route.params; 
    },
    currentRoomID () {
      return this.$route.params.room_id;
    },
    commonRoomDoc () {
      for (const room of this.rooms) {
        if (room.isCommonRoom) {
          return room; 
        }
      }
    },
    currentRoomDoc () {
      for (const room of this.rooms) {
        if (room.id === this.currentRoomID) {
          return room; 
        }
      }
    },
    classDocRef () {
      return db.doc(`classes/${this.classID}`);
    },
    roomIDToParticipants () {
      const out = {}; 
      for (const room of this.rooms) {
        out[room.id] = this.participants.filter(p => p.currentRoom === room.id); 
      }
      return out; 
    },
    roomTypeRef () {
      return this.classDocRef.collection("roomTypes").doc(this.$route.params.section_id); 
    }
  },
  watch: {
    "roomTypeDoc.roomAssignmentsCounter": function (newVal, oldVal) {
      if (oldVal && oldVal !== newVal) {
        for (const roomAssignment of this.roomTypeDoc.roomAssignments) {
          if (roomAssignment.assignees.includes(this.user.uid)) {
            if (this.currentRoomID !== roomAssignment.roomID) {
              this.$router.push(`/class/${this.classID}/section/${this.$route.params.section_id}/room/${roomAssignment.roomID}`);
              this.$root.$emit("show-snackbar", "You have been put in random room with other people. Have fun :)"); 
            }
          }
        }
      }
    },
    "roomTypeDoc.muteAllCounter": function (newVal, oldVal) {
      if (oldVal && oldVal !== newVal) {
        this.$store.commit("SET_IS_MIC_ON", false);
        this.$root.$emit("show-snackbar", "An admin muted everyone"); 
      }
    },
    // Performance-wise, hopefully it's just a pointer 
    roomIDToParticipants (newVal) {
      this.$store.commit("SET_ROOM_ID_TO_PARTICIPANTS", newVal); 
    }
  },
  async created () {
    this.$_listenToDoc(this.roomTypeRef, this, "roomTypeDoc")
      .then(unsubFunc => this.unsubFuncs.push(unsubFunc));

    // listen to rooms 
    this.unsubFuncs.push(
      this.$_bindVarToDB({
        varName: "rooms",
        dbRef: this.classDocRef.collection("rooms").where("roomTypeID", "==", this.$route.params.section_id),
        component: this
      })
    );

    // listen to section participants
    this.unsubFuncs.push(
      this.$_bindVarToDB({
        varName: "participants",
        dbRef: this.classDocRef.collection("participants").where("roomTypeID", "==", this.$route.params.section_id),
        component: this
      })
    );
  },
  beforeDestroy () {
    for (const unsubFunc of this.unsubFuncs) {
      unsubFunc(); 
    }
  },
  methods: {
    async seedEachRoomWithProblem (e) {
      const uploadedFile = e.target.files[0];
      if (!uploadedFile) return;
      let imageFile;  
      if (uploadedFile.type.split("/")[0] === "image") {
        imageFile = uploadedFile; 
      } else if (uploadedFile.type.split("/")[1] === "pdf") {
        imageFile = await this.convertPdfToImageFile(uploadedFile);
      } else {
        this.$root.$emit("show-snackbar", "Error: only image or pdf files are supported for now.");
        return; 
      }
      // save it to storage 
      const downloadURL = await this.$_saveToStorage(getRandomId(), imageFile);
      
      const promises = []; 
      // now for each room, put it on the blackboard 
      for (const room of this.rooms) {
        const ref = this.classDocRef.collection("blackboards").doc(room.blackboards[0]);
        promises.push(
          ref.update({
            backgroundImageDownloadURL: downloadURL
          })
        );
      }
      await Promise.all(promises);
      this.$root.$emit("show-snackbar", "Successfully planted the problem in each room :)")
    },
    async convertPdfToImageFile (src) {
      // TODO: fix npm errors and use normal imports
      const pdfjs = require("pdfjs-dist/build/pdf.js");
      pdfjs.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.4.456/pdf.worker.min.js";
      
      const doc = await pdfjs.getDocument(URL.createObjectURL(src)).promise;
      const page = await doc.getPage(1);
      
      // Render the page on a Node canvas with 100% scale.
      const viewport = page.getViewport({ scale: 1.0 });
      const dummyCanvas = document.createElement("canvas");
      dummyCanvas.width = viewport.width;
      dummyCanvas.height = viewport.height;
      const ctx = dummyCanvas.getContext("2d");
      const renderContext = {
        canvasContext: ctx,
        viewport: viewport
      };
      
      await page.render(renderContext).promise
      const dataURL = dummyCanvas.toDataURL("image/png");
      const current_date = new Date();
      const file = this.dataURLtoFile(dataURL, current_date.getTime()+'.png');
      return file;
    },
    // https://stackoverflow.com/questions/16968945/convert-base64-png-data-to-javascript-file-objects/16972036
    // function to convert dataURL from canvas to file object
    dataURLtoFile (dataurl, filename) {
      var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
      while(n--){
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new File([u8arr], filename, {type:mime});
    },
    /**
     * Creates a new room and initalized with 1 blackboard
     * TODO: rename roomType to roomTypeID
     * 
     */
    async createNewRoom () {
      const newDocID = getRandomId();
      await Promise.all([
        this.classDocRef.collection("blackboards").doc(newDocID).set({}),
        this.classDocRef.collection("rooms").add({
          roomTypeID: this.roomTypeDoc.id, 
          blackboards: [newDocID]
        })
      ])
    },
    // TODO: refactor
    setRoomStatusPopup (show, roomID) {
      this.roomStatusPopup = {
        show: show,
        roomID: roomID,
        status: ""
      };
    },
    setRoomStatus (status) {
      db.doc(`classes/${this.classID}/rooms/${this.roomStatusPopup.roomID}`).update({ 
        status 
      });
      this.roomStatusPopup['show'] = false;
    },
    async clearRoomStatuses (roomType) {
      const querySnapshot = await db
        .collection(`classes/${this.classID}/rooms`)
        .where('roomTypeID', '==', this.roomTypeDoc.id)
        .get();

      for (const docSnapshot of querySnapshot.docs) {
        docSnapshot.ref.update({
          status: ""
        });
      }
    },
    showMakeAnnouncementPopup (roomType) {
      this.makeAnnouncementPopup = {
        show: true,
        roomType: roomType
      }
    },
    async makeAnnouncement (message, roomType) {      
      if (!message) {
        this.$root.$emit("show-snackbar", "Invalid announcement message");
        return;
      }
      
      const querySnapshot = await db
        .collection(`classes/${this.classID}/rooms`)
        .where("roomTypeID", '==', this.roomTypeDoc.id)
        .get();
      for (const docSnapshot of querySnapshot.docs) {
            // TODO: Change this to just writing uid
            // To do this, we need to provide a global way to get information
            // about a user from their uid. This is needed because the author
            // could disconnect after sending an announcement.
        docSnapshot.ref.update({
          announcement: {
            message: message,
            author: {
              firstName: this.user.firstName,
              lastName: this.user.lastName,
            }
          },
          announcementCounter: firebase.firestore.FieldValue.increment(1)
        });
      }
      this.$root.$emit("show-snackbar", "Announcement sent.");
      this.makeAnnouncementPopup['show'] = false;
    },
    /**
     * Mutes all participants in rooms of roomType
     * Does this by incrementing a counter in each targeted room.
     * This counter is watched by participants inside the rooms.
     * TODO: Can be refactored such that there is a single counter for each
     *       roomType and participants all watch the roomType counter.
     * */
    async muteParticipantsInRooms(roomType) {
      this.roomTypeRef.update({
        muteAllCounter: firebase.firestore.FieldValue.increment(1)
      });
    },
     /**
     * Assigns all participants in rooms of roomType to a random room of
     * roomType. After shuffling, each room has at minimum minRoomSizeOnShuffle
     * participants.
     * */ 
    async shuffleParticipants (roomType) {
      /**
       * Shuffles array in place. ES6 version
       * @param {Array} a array containing items.
       * @see https://stackoverflow.com/a/6274381
       */
      function shuffle(a) {
        for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
      }

      const targetRooms = this.rooms; 
  
      // Get all UIDs in rooms or roomType, no duplicates
      const targetUIDSet = new Set();
      for (const participant of this.participants) {
        targetUIDSet.add(participant.uid); 
      }
       
      const targetUIDs = Array.from(targetUIDSet);
      shuffle(targetUIDs); 
    
      // initialize roomAssignments
      const roomAssignments = [];
      for (const room of targetRooms) {
        if (room.isCommonRoom) continue; 
        roomAssignments.push({
          roomID: room.id,
          assignees: []
        });
      }
      
      for (const room of roomAssignments) {
        if (targetUIDs.length === 0) break; 
        while (room.assignees.length < this.groupSize) {
          if (targetUIDs.length === 0) break; 
          else room.assignees.push(targetUIDs.pop()); 
        }
      }

      // each connected user will detect the change and be redirected.
      this.roomTypeRef.update({
        roomAssignments: roomAssignments,
        roomAssignmentsCounter: firebase.firestore.FieldValue.increment(1)
      });
    }
  }
}
</script>

<style scoped>
.active-blackboard {
  position: relative;
  /* border-left: 1px solid var(--v-accent-base); */
}
</style>