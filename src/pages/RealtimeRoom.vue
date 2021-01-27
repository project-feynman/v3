<template>
  <div>  
    <!-- Can expose an update participant function -->
    <HandleUpdatingParticipants
      :currentBoardNumber="currentBoardNumber"
      :currentPenColor="currentTool.color"
      :roomID="roomId"
      :classID="classID"
    />

    <VideoConferenceRoom
      :roomID="roomId"
    />

    <!-- For wiping all the blackboards -->
    <v-dialog v-model="isWipeBoardsPopupOpen">
      <v-card>
        <v-card-title>
          Are you sure you want to wipe the pen strokes of every blackboard in this room?
        </v-card-title>
        <v-card-actions>
          <v-spacer/>
          <v-btn @click="isWipeBoardsPopupOpen = false">CANCEL</v-btn>
          <v-btn @click="cloudFunctionsDelete(); isWipeBoardsPopupOpen = false;">
            WIPE ALL STROKES
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- For saving all the whiteboards -->
    <v-dialog v-model="isSaveBoardsPopupOpen">
      <v-card>
        <v-card-title>
          This will save your sequence of blackboard explanations into the library. 
        </v-card-title>
        <v-card-text>
          <v-text-field placeholder="Enter a title for the collection of explanations..." v-model="titleOfExplCollection"/>
        </v-card-text>
      
        <v-card-actions>
          <v-spacer/>
          <v-btn @click="isSaveBoardsPopupOpen = false">CANCEL</v-btn>
          <v-btn @click="cloudFunctionsSave(); isSaveBoardsPopupOpen = false;" color="accent">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- For wiping the PDFs -->
    <v-dialog v-model="isClearPDFsPopupOpen">
      <v-card>
        <v-card-title>
          This will remove the PDFs seeded on each blackboard, but will not wipe the pen strokes. 
        </v-card-title>
      
        <v-card-actions>
          <v-spacer/>
          <v-btn @click="isClearPDFsPopupOpen = false">CANCEL</v-btn>
          <v-btn @click="clearAllPDFs(); isClearPDFsPopupOpen = false;" color="accent">
            Wipe all PDFs
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Update status -->
    <v-dialog v-model="isRoomStatusPopupOpen" width="500">
      <v-card>
        <v-card-title>
          HELP / DONE 
        </v-card-title>

        <div style="display: flex; justify-content: center;">
          <v-chip color="blue" class="white--text" @click="newRoomStatus = 'Help!'; updateRoomStatus(); isRoomStatusPopupOpen = false;">Help!</v-chip>
          <v-chip color="blue" class="white--text" @click="newRoomStatus = 'Done.'; updateRoomStatus(); isRoomStatusPopupOpen = false;">Done.</v-chip>
          <v-chip color="blue" class="white--text" @click="newRoomStatus = ''; updateRoomStatus(); isRoomStatusPopupOpen = false;">(reset)</v-chip>
        </div>

        <!-- <v-card-text>
          <v-text-field v-model="newRoomStatus" placeholder="(You can empty the status by entering nothing.)"/>
        </v-card-text> -->
      
        <v-card-actions>
          <v-spacer/>
          <v-btn @click="isRoomStatusPopupOpen = false">CANCEL</v-btn>
          <!-- <v-btn @click="updateRoomStatus(); isRoomStatusPopupOpen = false;" color="accent">
            Update status
          </v-btn> -->
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="isRenameRoomPopupOpen">
      <v-card>
        <v-card-title>
          Rename the room to designate it for another purpose
        </v-card-title>

        <v-card-text>
          <v-text-field v-model="newRoomName" placeholder="e.g. Staff room"/>
        </v-card-text>
      
        <v-card-actions>
          <v-spacer/>
          <v-btn @click="isRenameRoomPopupOpen = false">CANCEL</v-btn>
          <v-btn @click="renameRoom(); isRenameRoomPopupOpen = false;" color="black" dark>
            Rename room
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <portal to="table-level-actions">
      <!-- @click.native.stop could enable the use of v-on from here https://github.com/vuetifyjs/vuetify/issues/3333 -->
      <!-- It sadly doesn't work here -->
      <v-menu v-model="isMenuOpen" offset-y bottom>
        <!-- Triple-dots button -->
        <template v-slot:activator>
          <BaseButton @click="isMenuOpen = true" stopPropagation icon="mdi-dots-vertical" color="black" small>
            <!-- Room actions -->
          </BaseButton>
        </template>
        
        <v-list>
          <v-list-item>
            <!-- <v-icon left color="blue">mdi-message-alert</v-icon> -->
            <v-chip color="blue" class="white--text" @click="newRoomStatus = 'Help!'; updateRoomStatus(); isRoomStatusPopupOpen = false;">Help!</v-chip>
            <v-chip color="blue" class="white--text" @click="newRoomStatus = 'Done.'; updateRoomStatus(); isRoomStatusPopupOpen = false;">Done.</v-chip>
            <v-chip color="blue" class="white--text" @click="newRoomStatus = ''; updateRoomStatus(); isRoomStatusPopupOpen = false;">(reset)</v-chip>
          </v-list-item>
          <v-list-item @click="isRenameRoomPopupOpen = true" :loading="isSavingAllBoards">
            <v-icon left color="blue">mdi-pencil</v-icon> Rename this table
          </v-list-item>
          <v-list-item @click="isSaveBoardsPopupOpen = true" :loading="isSavingAllBoards">
            <v-icon left color="purple">mdi-content-save-all</v-icon> Save sequence of boards
          </v-list-item>
          <v-list-item @click="isWipeBoardsPopupOpen = true" :loading="isClearingAllBoards">
            <v-icon left color="red darken-5">mdi-delete-alert</v-icon> Wipe all boards in table
          </v-list-item>
          <v-list-item @click="isClearPDFsPopupOpen = true" :loading="isClearingAllPDFs">
            <v-icon left color="red darken-5">mdi-file-remove-outline</v-icon> Wipe all backgrounds
          </v-list-item>
        </v-list>
      </v-menu>
    </portal>

    <!-- Display Zoom videos -->
    <portal-target name="destination">
    
    </portal-target>


      <portal to="right-side-of-my-participant-name">
        <!-- For switching between different blackboards -->
        <!-- item-color:  -->
        <!-- active-class:  -->
        <!-- hide-details: eliminates unnecessary bottom padding -->
        <div v-if="room" class="d-flex">
          <div v-if="activeBoardID">
            <v-menu v-model="isBoardsMenuOpen" fixed offset-y bottom>
              <template v-slot:activator>
                <v-btn @click.submit.prevent="isBoardsMenuOpen = true" height="30" text tile class="px-0" 
                  :style="`text-align: center; padding-top: 0; font-size: 1.1rem; font-weight: 400;`" max-width="180"
                >
                  <!-- The board switch button looks like a blackboard itself -->
                  <span class="`d-inline-block text-truncate" 
                      :style="
                        `color: ${currentTool.color}; width: 40px; height: 30px; display: flex !important; justify-content: center; align-items: center; background-color: rgb(62, 66, 66)`
                  ">
                    {{ getBoardNumberFromID(activeBoardID) }}
                  </span>
                  <v-spacer/>
                  <v-icon>mdi-menu-down</v-icon>
                </v-btn>
              </template>

              <v-list style="overflow-y: auto; max-height: 400px" class="py-0">
                <template v-for="boardID in room.blackboards">
                  <v-list-item 
                    @click="activeBoardID = boardID"
                    :key="boardID"
                    style="background-color: rgb(62, 66, 66);"
                    class="px-0"
                  >
                    <div :style="`margin: auto; color: ${currentTool.color};`">
                      {{ getBoardNumberFromID(boardID) }}
                    </div>
                  </v-list-item>
                  <v-divider class="white--text" :key="boardID + 'divider'"/>
                </template>

                <BaseButton @click="createNewBoard()" icon="mdi-plus" color="white" style="background-color: rgb(62, 66, 66);">
                  New board
                </BaseButton>
              </v-list>
            </v-menu>
          </div>
        </div>
      </portal>

    <!-- The actual blackboards -->
    <div id="room" class="room-wrapper">
      <v-tabs-items v-if="blackboardRefs.length !== 0 && room && activeBoardID" 
        v-model="activeBoardID" 
        touchless
      >
      <!-- re-render the blackboard everytime someone switches -->
        <v-tab-item v-for="(boardID, i) in room.blackboards"
          :value="boardID" :key="i"
        >
          <!-- Screensharing becomes the background of the blackboard -->
          <div id="screenshare-container" style="position: fixed; z-index: 1;">

          </div>
          <RealtimeBlackboard v-if="boardID === activeBoardID"
            :blackboardRef="blackboardRefs[i]"
          >
            <template v-slot:blackboard-toolbar>
              <BaseButton @click="$store.commit('SET_IS_BOARD_FULLSCREEN', !isBoardFullscreen)" 
                :icon="isBoardFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'" 
                color="white" small hasLargeIcon
              />
            </template>
          </RealtimeBlackboard>
        </v-tab-item>
      </v-tabs-items>
    </div>
  </div>
</template>

<script>
/**
 * CORRECTNESS ARGUMENT
 * 
 * Because RealtimeRoom is rendered by a <router-view :key="$route..."/> component
 * it will be properly destroyed, and so its children components don't require destroy keys.
 * 
 * Note, $this.$route.room_id can be mutate. It gets mutated. 
 * When you write modular code, you win against the most sophisticated and nuanced bugs that exist in the world. 
 * You immediately kill all possibilities of anything. I can never emphasize enough.
 * 
 */

import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/functions";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import db from "@/database.js";
import BaseButton from "@/components/BaseButton.vue";
import BaseIconButton from "@/components/BaseIconButton.vue";
import { mapState } from "vuex";
import RealtimeBlackboard from "@/components/RealtimeBlackboard.vue";
import HandleUpdatingParticipants from "@/components/HandleUpdatingParticipants.vue";
import { getRandomId } from "@/helpers.js";
import VideoConferenceRoom from "@/components/VideoConferenceRoom.vue";

export default {
  props: {
    roomId: {
      type: String,
      required: true
    },
    isCommonRoom: {
      type: Boolean,
      default () {
        return false;
      }
    }
  },
  components: {
    HandleUpdatingParticipants,
    RealtimeBlackboard,
    BaseButton,
    BaseIconButton,

    VideoConferenceRoom
  },
  mixins: [
    DatabaseHelpersMixin
  ],
  data () {
    return {
      room: null,
      blackboardRefs: [],
      snapshotListeners: [],
      roomRef: null,
      activeBoardID: null,
      incrementToDestroyComponent: -100000,
      isMenuOpen: false,
      isSavingAllBoards: false,
      isClearingAllBoards: false,
      isClearingAllPDFs: false,
      isWipeBoardsPopupOpen: false,
      isSaveBoardsPopupOpen: false,
      isClearPDFsPopupOpen: false,
      isRoomStatusPopupOpen: false,
      isRenameRoomPopupOpen: false,
      titleOfExplCollection: "",
      newRoomStatus: "",
      newRoomName: "",
      currentBoardNumber: 1,
      isBoardsMenuOpen: false
    }
  },
  computed: {
    ...mapState([
      "user",
      "mitClass",
      "session",
      "isBoardFullscreen",
      "currentTool"
    ]),
    classID () {
      return this.$route.params.class_id; 
    },
    sessionID () {
      return this.session.currentID;
    }
  },
  // database => state 
  watch: {
    activeBoardID (newVal) {
      // updates `currentBoardNumber`, assumes `this.room.blackboards` is hydrated
      // correct because `activeBoardID` can only be changed via user interaction, `this.room.blackboards` is defined
      this.currentBoardNumber = this.getBoardNumberFromID(newVal);
    },
    room: {
      handler (newVal, oldVal) {
        this.$store.commit("SET_ROOM", this.room);
        if (newVal.blackboards) {
          const newBlackboardRefs = []; 
          for (const blackboard of newVal.blackboards) {
            newBlackboardRefs.push(
              db.doc(`classes/${this.classID}/blackboards/${blackboard}`)
            );
          }
          this.blackboardRefs = newBlackboardRefs; 
        }
      }
    }
  },
  async created () {
    this.roomRef = db.doc(`classes/${this.classID}/rooms/${this.roomId}`);
    this.$_listenToDoc(this.roomRef, this, "room").then(unsubFunc => {
      this.activeBoardID = this.room.blackboards[0]; // TODO: perhaps it's not necessary and can be "naturally handled"
      this.snapshotListeners.push(unsubFunc);
    });

    // TODO: refactor/modularize by finding a way to NOT use a root listener
    this.$root.$on("teleport-to-board", (newBoardNumber) => {
      this.activeBoardID =  this.room.blackboards[newBoardNumber - 1];
    }); 
  },
  destroyed () {
    for (const detachListener of this.snapshotListeners) {
      detachListener();
    }
  },
  methods: { 
    getBoardNumberFromID (id) {
      for (const [i, boardID] of this.room.blackboards.entries()) {
        if (boardID === id) {
          return i + 1; 
        }
      }
    },
    renameRoom () {
      db.doc(`classes/${this.classID}/rooms/${this.roomId}`).update({ 
        name: this.newRoomName
      });
      this.newRoomName = ""; 
    },
    updateRoomStatus () {
      db.doc(`classes/${this.classID}/rooms/${this.roomId}`).update({ 
        status: this.newRoomStatus
      });
      this.newRoomStatus = ""; 
    },
    async clearAllPDFs () {
      this.isClearingAllPDFs = true;
      const promises = []; 
      for (const boardID of this.room.blackboards) {
        const boardRef = db.doc(`/classes/${this.classID}/blackboards/${boardID}`);
        promises.push(
          boardRef.update({ backgroundImageDownloadURL: "" })
        );
      }
      await Promise.all(promises); 
      this.isClearingAllPDFs = false;
      this.$root.$emit("show-snackbar", "Succesfully cleared all PDF problems in this room");
    },
    async cloudFunctionsDelete () {
      function deleteAtPath(path) {
        return new Promise((resolve, reject) => {
          var deleteFn = firebase.functions().httpsCallable('recursiveDelete');
          deleteFn({ path: path })
            .then(function(result) {
              console.log('Delete success: ' + JSON.stringify(result));
              resolve(); 
            })
            .catch(function(err) {
              console.log('Delete failed, see console,');
              console.warn(err);
              reject(); 
            });
        });
      }

      const promises = []; 
      // now try just deleting each of the blackboards in the common room
      this.$root.$emit("show-snackbar", "Wiping the boards (this might take a while)...");
      this.isClearingAllBoards = true; 
      for (const boardID of this.room.blackboards) {
        promises.push(
          deleteAtPath(`/classes/${this.$route.params.class_id}/blackboards/${boardID}/strokes`)
        );
      }
      await Promise.all(promises); 
      this.isClearingAllBoards = false; 
      this.$root.$emit("show-snackbar", "Succesfullly wiped the boards.");
    },
    async cloudFunctionsSave () {
      const titleOfExplCollection = this.titleOfExplCollection;
      function saveBoardAsExpl({ boardDbPath, explDbPath, mitClass, user, title }) {
        return new Promise(async (resolve, reject) => {
          const saveFn = firebase.functions().httpsCallable("saveExpl"); 
          try {
            const result = await saveFn({ 
              title,
              boardDbPath,
              explDbPath, 
              mitClass,
              user
            });
            console.log("Finished the upload operation, result =", result);
            resolve(); 
          } 
          catch (error) {
            console.log("Cloud Functions failed, error =", error); 
          }
        });
      }

      this.isSavingAllBoards = true; 
      // constants that'll be re-used in the for loop below
      const mitClass = {
        id: this.mitClass.id,
        name: this.mitClass.name,
        maxOrder: this.mitClass.maxOrder
      };
      const user = {
        uid: this.user.uid,
        firstName: this.user.firstName,
        lastName: this.user.lastName,
        email: this.user.email
      }; 
      
      const newPostID = getRandomId(); 
      const { class_id } = this.$route.params; 
      const newPostDbPath = `classes/${class_id}/posts/${newPostID}`;
      const newPostTitle = titleOfExplCollection ? titleOfExplCollection : `Lecture Recording (${new Date().toLocaleTimeString()})`; 

      try {
        const promises = []; 
        // save first board as a post, save the rest as replies to the first board (to conform to the legacy API of visual Piazza)
        for (const [i, boardID] of this.room.blackboards.entries()) {
          promises.push(
            saveBoardAsExpl({
              boardDbPath: `classes/${class_id}/blackboards/${boardID}`,
              title: i === 0 ? newPostTitle : "",
              explDbPath: i === 0 ? newPostDbPath : `${newPostDbPath}/replies/${getRandomId()}`,
              mitClass,
              user
            })
          );
        }
        await Promise.all(promises);
      } catch (error) {
        this.$root.$emit("show-snackbar", "Saving failed, error =", error);
      } finally {
        this.isSavingAllBoards = false; 
      }
    },
    async createNewBoard () {
      const roomRef = db.doc(`classes/${this.classID}/rooms/${this.roomId}`);
      const blackboardsRef = db.collection(`classes/${this.classID}/blackboards`);
      const newID = getRandomId();  
      await Promise.all([
        blackboardsRef.doc(newID).set({
          roomType: '',
        }),
        roomRef.update({
          blackboards: firebase.firestore.FieldValue.arrayUnion(newID)
        })
      ]);  
      this.activeBoardID = newID; 
    }
  }
};
</script>

