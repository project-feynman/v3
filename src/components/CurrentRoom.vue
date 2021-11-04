<template>
  <div>  
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

    <v-dialog v-model="isRenameRoomPopupOpen" width="500">
      <v-card>
        <v-card-title>
          Rename
        </v-card-title>

        <v-card-text>
          <v-text-field v-model="newRoomName" placeholder="e.g. Staff room"/>
        </v-card-text>
      
        <v-card-actions>
          <v-spacer/>
          <v-btn @click="isRenameRoomPopupOpen = false">CANCEL</v-btn>
          <v-btn @click="renameRoom(); isRenameRoomPopupOpen = false;" color="black" dark>
            Rename
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <portal to="invite-button">
      <v-btn v-if="user.email" @click="isInviteFriendsPopupOpen = true" color="white cyan--text"
        rounded block
        class="pa-2" style="margin-top: 13px;" small
      >
        <v-icon left style="font-size: 1.1rem">mdi-account-multiple-plus</v-icon> 
        Army of Helpers
      </v-btn>
    </portal>

    <!-- INFINITE TUTORING -->
    <v-dialog v-model="isInviteFriendsPopupOpen" max-width="750">
      <InviteFriends4 v-if="isInviteFriendsPopupOpen" @emails-sent="isInviteFriendsPopupOpen = false"/>
    </v-dialog> 
  
    <!-- ROOM ACTIONS MENU -->
    <portal to="table-level-actions">
      <!-- @click.native.stop could enable the use of v-on from here https://github.com/vuetifyjs/vuetify/issues/3333 -->
      <!-- It sadly doesn't work here -->
      <v-menu offset-y bottom>
        <!-- Triple-dots button -->
        <template v-slot:activator="{ on }">
          <BaseButton v-if="user.email" :on="on" stopPropagation icon="mdi-dots-vertical" color="black" small>
            <v-badge v-if="numOfUnreadMsgsInTable" 
              :value="numOfUnreadMsgsInTable" 
              :content="numOfUnreadMsgsInTable" 
              color="green" 
              top 
              left 
              offset-x="25" 
              offset-y="-25">
            </v-badge>
          </BaseButton>
        </template>
        
        <v-list>
          <v-menu
            v-model="isChatOpen"
            :close-on-content-click="false"
            :close-on-click="false"
            max-height="225" left nudge-top="196" style="max-width: 200px; z-index: 5;"
          >
            <template v-slot:activator="{ on }">
              <v-badge 
                :value="numOfUnreadMsgsInTable"
                :content="numOfUnreadMsgsInTable"
                top right color="green" overlap style="z-index: 1;"
              >
                <v-list-item v-on="on">
                  <v-icon class="mr-2" color="green">mdi-chat</v-icon>
                  Chat
                </v-list-item>
                <!-- <BaseButton :on="on" stopPropagation icon="mdi-chat" color="black" small>
                    
                </BaseButton> -->
              </v-badge>
            </template>

            <v-card max-width="250">
              <v-card-text class="pa-0">
                <ZoomChat v-if="isChatOpen"
                  :messagesDbPath="`classes/${classID}/rooms/${roomID}/messages`"
                  :participantsDbRef="roomParticipantsRef"
                  :notifFieldName="`numOfUnreadMsgsInTable:${roomID}`"
                >
                  <v-btn icon @click="isChatOpen = false" small>
                    <v-icon color="black">mdi-close</v-icon>
                  </v-btn>
                </ZoomChat>   
              </v-card-text>
            </v-card>
          </v-menu>

          <v-list-item @click="isRenameRoomPopupOpen = true">
            <v-icon left color="blue">mdi-pencil</v-icon> Rename
          </v-list-item>

          <!-- <v-list-item> -->
            <!-- <v-chip color="blue" class="white--text" @click="newRoomStatus = 'Requesting help'; updateRoomStatus(); isRoomStatusPopupOpen = false;">Requesting help</v-chip> -->
            <!-- <v-chip color="blue" class="white--text" @click="toggleCollabStatus()">Down to collaborate</v-chip> -->
            <!-- <v-chip color="blue" class="white--text" @click="newRoomStatus = ''; updateRoomStatus(); isRoomStatusPopupOpen = false;">(reset)</v-chip> -->
          <!-- </v-list-item> -->

          <!-- <v-list-item @click="isSaveBoardsPopupOpen = true" :loading="isSavingAllBoards">
            <v-icon left color="cyan">mdi-content-save-all</v-icon> Save sequence of boards
          </v-list-item> -->

          <!-- DELETE OPERATIONS ARE RARE AND REQUIRE TWO-THREE CLICKS -->
          <v-list-item :disabled="!isAdmin" @click="deleteRoom()">
            <v-icon left color="red darken-5">mdi-delete</v-icon> 
            Delete
          </v-list-item>

          <!-- <v-list-item @click="isWipeBoardsPopupOpen = true" :loading="isClearingAllBoards">
            <v-icon left color="red darken-5">mdi-delete-alert</v-icon> Wipe all boards in table
          </v-list-item> -->
          
          <!-- <v-list-item @click="isClearPDFsPopupOpen = true" :loading="isClearingAllPDFs">
            <v-icon left color="red darken-5">mdi-file-remove-outline</v-icon> Wipe all backgrounds
          </v-list-item> -->

          <!-- Can't delete the default room -->
          <!-- <v-list-item :disabled="roomID === classID" @click="deleteThisRoom()">
            <v-icon left color="red">mdi-delete</v-icon> Delete this room
          </v-list-item> -->
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
        <div v-if="currentBoardID">
          <!-- `click.native.stop` is the workaround for the menu causing the entire page to reload https://github.com/vuetifyjs/vuetify/issues/3333#issuecomment-366832774 -->
          <v-menu @click.prevent.stop fixed offset-y bottom>
            <template v-slot:activator="{ on }">
              <!-- `click.prevent.stop` is important -->
              <v-btn v-on="on" @click.prevent.stop height="33" text tile class="px-0" 
                style="
                  text-align: center; 
                  padding-top: 0; 
                  font-size: 1.1rem; 
                  font-weight: 400; 
                  margin-right: 12px
                " 
                max-width="180"
              > 
                <!-- The board switch button looks like a blackboard itself -->
                <span class="`d-inline-block text-truncate px-0" 
                    :style="
                      `color: ${currentTool.color}; 
                       width: 42px; 
                       height: 32.5px; 
                       display: flex !important; 
                       justify-content: center; 
                       align-items: center; 
                       background-color: rgb(62, 66, 66);
                       box-shadow: 0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23);
                      `
                ">
                  <div style="margin-left: 15px">{{ 1 + room.blackboards.indexOf(currentBoardID) }}</div>
                  <v-icon class="ml-0" small>mdi-menu-down</v-icon>
                </span>
              </v-btn>
            </template>

            <!-- TODO
              Drag and drop doesn't even work for Surface Book II 
              But it works for the iPad.
              Without `overflow-x: hidden`, there is a weird offset scroll behavior
             -->
            <v-list v-if="room" style="overflow-y: auto; max-height: 80vh; overflow-x: hidden;" class="py-0">
              <template v-for="(boardID, i) in room.blackboards">
                <Drop @drop="handleDrop({ droppedTo: i }, ...arguments)" :key="boardID">
                  <span class="d-inline-block text-truncate mt-1 px-1" style="max-width: 140px; font-size: 0.8rem; margin-bottom: 0">
                    <portal-target :name="`title-of-blackboard-${i}`">

                    </portal-target>
                  </span>
                  <div style="display: flex; align-content: center">
                    <v-list-item @click="scrollToThisBoard(boardID)"
                      style="background-color: rgb(62, 66, 66); height: 30px; width: 60px;"
                      class="px-0 ml-1"
                    >
                      <div style="margin: auto; color: white">
                        {{ 1 + i }}
                      </div>
                    </v-list-item>

                    <Drag :transfer-data="{ draggedFrom: i }" style="width: 80px;">
                      <v-icon color="grey" x-large style="margin-left: 5px">
                        <!-- mdi-reorder-horizontal -->
                        mdi-menu
                      </v-icon>
                      <div style="font-size: 0.4rem; margin-bottom: 0px; margin-left: 7px; color: grey">
                        RE-ARRANGE
                      </div>
                    </Drag>
                  </div>
                  <v-divider class="mt-2"/>
              
                </Drop>
              </template>

              <BaseButton v-if="room.blackboards.length < 10" @click="createNewBoard()" icon="mdi-plus" color="white" style="background-color: rgb(62, 66, 66);" block>
                New board
              </BaseButton>
            </v-list>
          </v-menu>
        </div>
      </div>
    </portal>

    <template v-if="room">
      <template v-for="(boardID, i) of room.blackboards">
        <RenderlessListenToBlackboard :blackboardRef="classRef.collection('blackboards').doc(boardID)" :key="boardID">
          <!-- TODO: expose functions here for:
            3. adding a comment
          -->
          <template v-slot="{ boardDoc, upvote }">
            <div v-if="boardDoc" :id="boardID" :key="boardID" v-intersect="{
              handler (entries, observer, isIntersecting) {
                if (isIntersecting) {
                  updateCurrentBoardID(boardID)
                }
              },
              options: {
                threshold: 1.0
              }
            }"
            >
              <portal :to="`title-of-blackboard-${i}`">
                {{ boardDoc.title }}
              </portal>

              <!-- only fetch videos when they're visible (notice `.once` -->
              <RenderlessFetchStrokes v-if="boardDoc.date && boardDoc.creator"
                :strokesRef="classRef.collection('blackboards').doc(boardDoc.id).collection('strokes')"
                :imageDownloadUrl="boardDoc.backgroundImageDownloadURL"
                v-slot="{ fetchStrokes, strokesArray, imageBlob, isLoading }"
              >
                <div style="position: relative;" v-intersect.once="{
                  handler (entries, observer, isIntersecting) {
                    if (isIntersecting) fetchStrokes()
                  },
                  options: {
                    threshold: 0.5
                  }
                }"
                > 
                  <v-card class="mb-5">
                    <template>
                      <v-card-title class="mt-1 mb-3 py-1">
                        <v-text-field 
                            :value="boardDoc.title"
                            @input="newTitle => debouncedEditTitle(newTitle, boardDoc.id)"
                            placeholder="Title here"
                            style="font-size: 1.6rem; opacity: 77%; width: 150px"
                            class="font-weight-normal"
                            hide-details
                        ></v-text-field>
                      </v-card-title>
                    </template>
                    <v-card-text>
                      <ReusableTextEditor
                        :value="boardDoc.descriptionHtml || ''"
                        @input="newDescriptionHtml => debouncedEditDesc(newDescriptionHtml, boardDoc.id)"
                        class="html-paragraph-styles"
                        style="margin-top: 10px; margin-left: 2px"
                      />
                      <DoodleVideo v-if="boardDoc.audioDownloadURL"
                        :strokesArray="strokesArray"
                        :imageBlob="imageBlob"
                        :audioUrl="boardDoc.audioDownloadURL"
                        :aspectRatio="4/3"
                        style="margin-top: 5px"
                        @play="incrementNumOfViewsOnExpl(boardDoc.id)"
                        @delete="deleteVideo({ audioDownloadURL: boardDoc.audioDownloadURL, creator: boardDoc.creator, videoRef: classRef.collection('blackboards').doc(boardDoc.id) })"
                      />
                      <DoodleAnimation v-else
                        :strokesArray="strokesArray"
                        :backgroundUrl="boardDoc.backgroundImageDownloadURL"
                        :aspectRatio="4/3"
                        style="margin-top: 5px"
                        @play="incrementNumOfViewsOnExpl(boardDoc.id)"
                        @delete="deleteAnimation({ creator: boardDoc.creator, animationRef: classRef.collection('blackboards').doc(boardDoc.id) })"
                      />
                      <!-- TODO: collapsible comments -->
                      <v-card-subtitle class="my-0 pb-0 pt-3 ml-1 px-0">
                         {{ boardDoc.upvoterUIDs ? boardDoc.upvoterUIDs.length : 0 }} eurekas 
                        <v-btn v-if="boardDoc.upvoterUIDs && boardDoc.upvoterUIDs.includes(user.uid)"
                          @click="cancelUpvoteOnExpl(boardDoc.id)"
                          style="margin-bottom: 2px" icon
                        >
                         <v-icon color="orange lighten-1">mdi-lightbulb</v-icon>
                        </v-btn>

                        <v-btn v-else
                          @click="upvoteExpl(boardDoc.id)"
                          style="margin-bottom: 2px" icon
                        >                       
                          <v-icon color="grey darken-2">mdi-lightbulb-outline</v-icon>
                        </v-btn>
                        <v-icon class="ml-1 mr-2" style="font-size: 0.2rem">mdi-circle</v-icon> 
                        {{ boardDoc.views }} views                     
                        <v-icon class="mx-2" style="font-size: 0.2rem">mdi-circle</v-icon> 
                        {{ boardDoc.creator.firstName + ' ' + boardDoc.creator.lastName }}
                        <v-icon class="mx-2" style="font-size: 0.2rem">mdi-circle</v-icon> 
                        {{ displayDate(boardDoc.date) }}
                        <v-icon class="mx-2" style="font-size: 0.2rem">mdi-circle</v-icon> 
             
                        {{ boardDoc.numOfComments || 0 }} comments
                        <v-btn
                          icon
                          @click="show = !show"
                          style="margin-bottom: 2px"
                          color="grey darken-2"
                        >
                          <v-icon>{{ show ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
                        </v-btn>
                      </v-card-subtitle>
                      <v-spacer/>
                    </v-card-text>
                    <v-expand-transition>
                      <div v-show="show">
                        <v-card-text>
                          Coming soon!
                        </v-card-text>
                      </div>
                    </v-expand-transition>
                  </v-card>
                </div>
              </RenderlessFetchStrokes>
              
              <template v-else>
                <v-card class="mb-5">
                  <v-card-title class="mt-1 mb-3 py-1">
                    <v-text-field 
                      :value="boardDoc.title || ''"
                      @input="newTitle => debouncedEditTitle(newTitle, boardDoc.id)"
                      placeholder="Title"
                      style="font-size: 1.6rem; opacity: 77%; width: 150px"
                      class="font-weight-normal"
                      hide-details
                    ></v-text-field>
                  </v-card-title>

                  <v-card-text style="margin-top: 16px">
                    <ReusableTextEditor
                      :value="boardDoc.descriptionHtml || ''"
                      @input="newDescriptionHtml => debouncedEditDesc(newDescriptionHtml, boardDoc.id)"
                      class="html-paragraph-styles"
                    />
                    <RealtimeBlackboard
                      :blackboardRef="classRef.collection('blackboards').doc(boardDoc.id)" 
                      :key="boardDoc.id"
                      style="margin-top: 5px"
                    />
                  </v-card-text>
                </v-card>
              </template>
            </div>
          </template>
        </RenderlessListenToBlackboard>
      </template>

      <v-btn v-if="room.blackboards.length < 10"
        @click="createNewBoard()"
        block x-large class="white--text" style="background-color: rgb(46, 49, 49); margin-top: 5px;"
      >
        <v-icon class="mr-2">mdi-plus</v-icon>New Blackboard
      </v-btn>
    </template>
    <!-- End of `v-if="room"` template -->
  </div>
</template>

<script>
/**
 *  TODO: 
 *    - Confirm exit popup so you don't interrupt a long audio recording because of a misclick/mis-swipe
 * 
 *  CORRECTNESS ARGUMENT
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
import { mapState, mapGetters } from "vuex";
import RealtimeBlackboard from "@/components/RealtimeBlackboard.vue";
import { getRandomId, displayDate } from "@/helpers.js";
import ZoomChat from "@/components/ZoomChat.vue";
import InviteFriends4 from '@/components/InviteFriends4.vue'
import DoodleAnimation from '@/components/DoodleAnimation.vue'
import DoodleVideo from '@/components/DoodleVideo.vue'
import RenderlessListenToBlackboard from '@/components/RenderlessListenToBlackboard.vue'
import RenderlessFetchStrokes from '@/components/RenderlessFetchStrokes.vue'
import ReusableTextEditor from '@/components/ReusableTextEditor.vue'
import { Drag, Drop } from 'vue-drag-drop'

export default {
  props: {
    roomID: {
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
    RealtimeBlackboard,
    BaseButton,
    BaseIconButton,
    ZoomChat,
    InviteFriends4,
    DoodleAnimation,
    DoodleVideo,
    Drag,
    Drop,
    RenderlessListenToBlackboard,
    RenderlessFetchStrokes,
    ReusableTextEditor
  },
  mixins: [
    DatabaseHelpersMixin
  ],
  data () {
    return {
      room: null,
      roomListener: null,
      blackboardRefs: [],
      blackboardDocs: [],
      snapshotListeners: [],
      roomRef: null,
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
      isInviteFriendsPopupOpen: false,

      titleOfExplCollection: "",
      newRoomStatus: "",
      newRoomName: "",

      isChatOpen: false,

      show: false,
      editDescTimeout: null,
      editTitleTimeout: null
    }
  },
  computed: {
    ...mapState([
      "user",
      "mitClass",
      "session",
      'micStream',
      "isBoardFullscreen",
      "currentTool",
      "currentBoardID",
      "currentBoardNumber"
    ]),
    ...mapGetters([
      'isAdmin',
      "numOfUnreadMsgsInTable"
    ]),
    classID () { return this.$route.params.class_id; },
    roomParticipantsRef () {
      const { classID, roomID } = this; 
      return db.collection(`classes/${classID}/participants`).where("currentRoom", "==", roomID); 
    },
    classRef () {
      return db.doc(`classes/${this.$route.params.class_id}`)
    }
  },
  // database => state 
  watch: {
    // boardNumber is just useful for UI, so the boardID => boardNumber sufficies, and there is no need yet for boardNumber => boardID
    currentBoardID (newVal) {
      // updates `currentBoardNumber`, assumes `this.room.blackboards` is hydrated
      // correct because `activeBoardID` can only be changed via user interaction, `this.room.blackboards` is defined
      this.$store.commit(
        'SET_CURRENT_BOARD_NUMBER', 
        1 + this.room.blackboards.indexOf(newVal)
      )
    }
  },
  async created () {
    this.roomRef = db.doc(`classes/${this.classID}/rooms/${this.roomID}`);
    this.roomListener = this.roomRef.onSnapshot(snapshot => {
      this.room = snapshot.data()
    })
  },
  destroyed () {
    if (this.roomListener) this.roomListener()
  },
  methods: { 
    displayDate (dateString) {
      // this is from the import statement, sort of redundant...should have been a mixin
      return displayDate(dateString)
    },
    async deleteRoom () {
      // for each blackboard, do a proper deletion of the boards
      const deleteRecursively = firebase.functions().httpsCallable('recursiveDelete')
      const p = []
      for (const blackboardID of this.room.blackboards) {
        const blackboardDoc = await this.$_getDoc(db.doc(`classes/${this.classID}/blackboards/${blackboardID}`))
        console.log('blackboardDoc =', blackboardDoc)
        const { audioDownloadURL, backgroundImageDownloadURL } = blackboardDoc
        console.log('audio, background =', audioDownloadURL, backgroundImageDownloadURL)
        if (audioDownloadURL) {
          const audioRef = firebase.storage().refFromURL(audioDownloadURL)
          try {
            p.push(
              audioRef.delete().then(console.log('Deleted audio.'))
            )
          } catch (error) {
            console.error(error)
          }
        }
        if (backgroundImageDownloadURL) {
          const imageRef = firebase.storage().refFromURL(backgroundImageDownloadURL)
          try {
            p.push(
              imageRef.delete().then(console.log('Deleted background.')).catch(error => console.error(error))
            )
          } catch (error) {
            console.error(error)
          }
        }
        // then delete the blackboard doc itself and strokes
        p.push(
          deleteRecursively({ path: `blackboards/${blackboardID}` }).then(console.log('Recursively deleted blackboard'))
        )
      }
      // move user to the area's lobby
      p.push( 
        this.roomRef.delete()
      )
      await Promise.all(p)
      this.$root.$emit('show-snackbar', 'Succesfully deleted room.')

      // const { section_id } = this.$route.params
      // this.$router.push(`/class/${this.classID}/section/${section_id}/room/${section_id}}`)

      // then move the user to the lobby
      // then delete the room itself 
    },
    scrollToThisBoard (boardID) {
      const blackboardElement = document.getElementById(boardID)
      blackboardElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
      // That's all we need to do, 
      // because the intersection API above will call `updateCurrentBoardID`, and `currentBoardID` => `currentBoardNumber`
    },
    updateCurrentBoardID (boardID) {
      this.$store.commit(
        'SET_CURRENT_BOARD_ID', 
        boardID
      )
    },
    async handleDrop ({ droppedTo }, { draggedFrom }) {
      const i = draggedFrom
      const j = droppedTo
      const blackboardsCopy = [...this.room.blackboards]
      const draggedBoardID = blackboardsCopy[i]

      // remove 
      const removeOneElement = 1
      blackboardsCopy.splice(i, removeOneElement)

      // insert
      const removeNoElement = 0
      blackboardsCopy.splice(j, removeNoElement, draggedBoardID)  
        
      // make an update operation
      await this.roomRef.update({
        blackboards: blackboardsCopy
      })
      this.$root.$emit('show-snackbar', 'Rearranged order.')
    },
    toggleCollabStatus () {
      if (this.room.status === 'Down to collaborate') {
        this.newRoomStatus = ''
      } else {
        this.newRoomStatus = 'Down to collaborate'
      }
      this.updateRoomStatus()
      this.isRoomStatusPopupOpen = false 
    },
    debouncedEditTitle (newTitle, explID) {
      if (this.editTitleTimeout) clearTimeout(this.editTitleTimeout) 
      this.editTitleTimeout = setTimeout(() => {
        const ref = db.doc(`classes/${this.mitClass.id}/blackboards/${explID}`)
        ref.update({
          title: newTitle
        })
      }, 500)
    },
    debouncedEditDesc (newDescriptionHtml, explID) {
      if (this.editDescTimeout) clearTimeout(this.editDescTimeout)
      this.editDescTimeout = setTimeout(() => {
        const ref = db.doc(`classes/${this.mitClass.id}/blackboards/${explID}`)
        ref.update({
          descriptionHtml: newDescriptionHtml
        })
      }, 500)
    },
    upvoteExpl (boardID) {
      const ref = db.doc(`classes/${this.mitClass.id}/blackboards/${boardID}`);
      ref.update({
        upvoterUIDs: firebase.firestore.FieldValue.arrayUnion(this.user.uid)
      })
    },
    cancelUpvoteOnExpl (boardID) {
      const ref = db.doc(`classes/${this.mitClass.id}/blackboards/${boardID}`);
      ref.update({
        upvoterUIDs: firebase.firestore.FieldValue.arrayRemove(this.user.uid)
      })
    },
    incrementNumOfViewsOnExpl (id) {
      const ref = db.doc(`classes/${this.mitClass.id}/blackboards/${id}`);
      ref.update({
        views: firebase.firestore.FieldValue.increment(1)
      });
    },
    // TODO: 
    //   - be able to delete blackboards
    //   - delete the blackboard doc itself 
    //   - delete its subcollections with Cloud Functions
    // the reference to the blackboard is deleted from the parent: try to extract the id and do an array remove operation
    async deleteAnimation ({ creator, animationRef }) {
      if (creator.email && creator.email !== this.user.email) {
        alert('You need to be the creator to unsave this animation')
        return
      }

      // use db batch
      const batch = db.batch()
      batch.update(animationRef, { 
        creator: firebase.firestore.FieldValue.delete(),
        creatorUID: firebase.firestore.FieldValue.delete(),
        date: firebase.firestore.FieldValue.delete()
      })  
      if (this.user.email) {
        const updateObj = {}
        updateObj[`numOfVideosInClass:${this.mitClass.id}`] = firebase.firestore.FieldValue.increment(-1)
        batch.update(db.doc(`users/${this.user.uid}`), updateObj)
      }
      
      await batch.commit()
      this.$root.$emit('show-snackbar', 'Reverted animation to blackboard')
    },
    /**
     * Resets it into a blackboard (no need to delete the strokes)
     *   - note: this operation can't be atomic because db.batch() only works for Firestore and not for Storage
     */
    async deleteVideo ({ videoRef, creator, audioDownloadURL }) {
      // check permissions for delete 
      if (creator.email && creator.email !== this.user.email) {
        alert('Not allowed to delete video')
        return
      }
      const storage = firebase.storage()
      const audioRef = storage.refFromURL(audioDownloadURL);  
      try {
        await audioRef.delete()
        console.log('successfully deleted the audio')
        // File deleted successfully
      } catch (error) {
        console.error(error)
      }  

      const batch = db.batch()
      // otherwise anonymous users cannot delete their own videos or other anonymous users' videos
      if (this.user.email) {
        const userUpdateObj = {}
        userUpdateObj[`numOfVideosInClass:${this.mitClass.id}`] = firebase.firestore.FieldValue.increment(-1)
        batch.update(db.doc(`users/${this.user.uid}`), userUpdateObj)
      }
      batch.update(videoRef, {
        audioDownloadURL: '',
        creator: firebase.firestore.FieldValue.delete(),
        creatorUID: firebase.firestore.FieldValue.delete(),
        date: firebase.firestore.FieldValue.delete()
      })
      await batch.commit()

      console.log('removed reference to audioURL and deleted creator and date fields')
      this.$root.$emit('show-snackbar', 'Reverted video to blackboard')
    },
    async deleteThisRoom () {
      // warning: the strokes will remain, but find a fix later as Feynman is way more likely to die from other things
      const batch = db.batch();
      console.log("roomRef =", this.roomRef); 
      batch.delete(this.roomRef); 
      for (const boardID of this.room.blackboards) {
        console.log("boardID =", boardID); 
        batch.delete(
          db.doc(`classes/${this.classID}/blackboards/${boardID}`)
        );
      }
      console.log("batch is committing =", batch); 
      await batch.commit(); 
      this.$root.$emit("show-snackbar", "Room was deleted.")
    },
    async createNewBoard () {
      const roomRef = db.doc(`classes/${this.classID}/rooms/${this.roomID}`);
      const blackboardsRef = db.collection(`classes/${this.classID}/blackboards`);
      const newID = getRandomId();  
      // TODO: use batch operation
      await Promise.all([
        blackboardsRef.doc(newID).set({
          roomType: '',
        }),
        roomRef.update({
          blackboards: firebase.firestore.FieldValue.arrayUnion(newID)
        })
      ]);  
      await this.$nextTick()
      this.scrollToThisBoard(newID)
    },
    renameRoom () {
      db.doc(`classes/${this.classID}/rooms/${this.roomID}`).update({ 
        name: this.newRoomName
      });
      this.newRoomName
    },
    updateRoomStatus () {
      db.doc(`classes/${this.classID}/rooms/${this.roomID}`).update({ 
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
    }
  }
};
</script>

<style scoped>
/* .html-paragraph-styles >>> h2 {
  font-size: 2rem
} */

.html-paragraph-styles >>> p {
  font-size: 1.1rem
}

.overlay-item {
  position: absolute; 
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
