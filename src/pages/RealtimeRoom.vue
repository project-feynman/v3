<template>
  <div>  
    <HandleUpdatingParticipants
      :roomId="roomId"
    />

    <RealtimeSpaceTwilioRoom 
      :roomID="roomId"
      :willMuteByDefault="true"
      :key="incrementToDestroyComponent"
      @disconnect="incrementToDestroyComponent += 1"
    />

    <!-- For wiping all the blackboards -->
    <v-dialog v-model="isWipeBoardsPopupOpen">
      <v-card>
        <v-card-title>
          Are you sure you want to wipe all boards? 
        </v-card-title>
        <v-card-actions>
          <v-spacer/>
          <v-btn @click="isWipeBoardsPopupOpen = false">CANCEL</v-btn>
          <v-btn @click="cloudFunctionsDelete(); isWipeBoardsPopupOpen = false;">
            YES, I WANT TO WIPE EVERYTHING IN THIS ROOM
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- For saving all the whiteboards -->
    <v-dialog v-model="isSaveBoardsPopupOpen">
      <v-card>
        This will save your sequence of blackboard explanations into the library. 
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

    <portal to="current-room-buttons">
      <BaseButton @click="isWipeBoardsPopupOpen = true" :loading="isClearingAllBoards" icon="mdi-delete-alert" small>
        Wipe boards
      </BaseButton>

      <BaseButton @click="isSaveBoardsPopupOpen = true" :loading="isSavingAllBoards" icon="mdi-content-save-all" small>
        Save boards
      </BaseButton>
    </portal>

    <!-- Display videos -->
    <portal-target name="destination">
    
    </portal-target>

    <v-toolbar v-if="!isBoardFullscreen">
      <!-- Tabs for different blackboards -->
      <v-tabs v-if="user && room" 
        v-model="activeBoardID" 
        active-class="accent--text" slider-color="accent" background-color="white"
      >
        <template v-for="(board, i) in room.blackboards">
          <v-tab :href="'#' + board" :key="i">
            {{ 'BOARD #' + (i+1) }}
          </v-tab>
        </template>
        <BaseButton @click="createNewBoard()" icon="mdi-plus" small color="grey">
          New board
        </BaseButton>
      </v-tabs>
    </v-toolbar>

    <div id="room" class="room-wrapper">
        <!-- The actual blackboards -->
        <v-tabs-items v-if="blackboardRefs.length !== 0 && room" 
          v-model="activeBoardID" 
          touchless
        >
        <!-- re-render the blackboard everytime someone switches -->
          <v-tab-item v-for="(boardID, i) in room.blackboards" 
            :value="boardID" :key="i"
          >
            <RealtimeBlackboard v-if="boardID === activeBoardID"
              :blackboardRef="blackboardRefs[i]"
            />
          </v-tab-item>
        </v-tabs-items>
    </div>
  </div>
</template>

<script>
import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/functions";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import db from "@/database.js";
import BaseButton from "@/components/BaseButton.vue";
import BaseIconButton from "@/components/BaseIconButton.vue";
import { mapState } from "vuex";
import RealtimeBlackboard from "@/components/RealtimeBlackboard.vue";
import RealtimeSpaceTwilioRoom from "@/components/RealtimeSpaceTwilioRoom";
import HandleUpdatingParticipants from "@/components/HandleUpdatingParticipants.vue";
import { getRandomId } from "@/helpers.js";

export default {
  props: {
    roomId: {
      type: String,
      required: true
    }
  },
  components: {
    HandleUpdatingParticipants,
    RealtimeBlackboard,
    RealtimeSpaceTwilioRoom,
    BaseButton,
    BaseIconButton,
  },
  mixins: [
    DatabaseHelpersMixin,
  ],
  data () {
    return {
      room: null,
      blackboardRefs: [],
      snapshotListeners: [],
      roomRef: null,
      activeBoardID: null,
      boards: [],
      incrementToDestroyComponent: -100000,
      isSavingAllBoards: false,
      isClearingAllBoards: false,
      isWipeBoardsPopupOpen: false,
      isSaveBoardsPopupOpen: false,
      titleOfExplCollection: ""
    }
  },
  computed: {
    ...mapState([
      "user",
      "mitClass",
      "session",
      "isBoardFullscreen"
    ]),
    classId () {
      return this.$route.params.class_id; 
    },
    sessionID () {
      return this.session.currentID;
    }
  },
  // database => state 
  watch: {
    room: {
      handler (newVal, oldVal) {
        this.$store.commit("SET_ROOM", this.room);
        if (newVal.blackboards) {
          const newBlackboardRefs = []; 
          for (const blackboard of newVal.blackboards) {
            newBlackboardRefs.push(
              db.doc(`classes/${this.classId}/blackboards/${blackboard}`)
            );
          }
          this.blackboardRefs = newBlackboardRefs; 
        }
      }
    }
  },
  async created () {
    this.roomRef = db.doc(`classes/${this.classId}/rooms/${this.roomId}`);
    this.$_listenToDoc(this.roomRef, this, "room").then(unsubFunc => {
      this.snapshotListeners.push(unsubFunc);
    });
  },
  destroyed () {
    for (const detachListener of this.snapshotListeners) {
      detachListener();
    }
  },
  methods: { 
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
        const { class_id } = this.$route.params; 
        promises.push(
          deleteAtPath(`/classes/${class_id}/blackboards/${boardID}/strokes`)
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
    // state => database
    async createNewBoard () {
      const roomRef = db.doc(`classes/${this.classId}/rooms/${this.roomId}`);
      const blackboardsRef = db.collection(`classes/${this.classId}/blackboards`);
      const newID = getRandomId();  
      const promises = []; 

      promises.push(
        blackboardsRef.doc(newID).set({
          roomType: '',
        })
      );
      promises.push(
        roomRef.update({
          blackboards: firebase.firestore.FieldValue.arrayUnion(newID)
        })
      );
      await Promise.all(promises);
      
      this.activeBoardID = newID;
    },
  }
};
</script>

<style scoped>
.room-wrapper{
  height: 100px;
}
</style>

