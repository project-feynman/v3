<template>
  <!-- This 100vh is key, it means all the subsequent <div> will maintain its size regardless of how big the blackboard is (it'll just allow for 
    horizontal and vertical scrolling), which is what we want -->
  <div style="height: 100%">
    <MyParticipantDocUpdater
      :classID="classID"
      :roomID="tableID"
    />

    <!-- Elevation ranges from 0 to 24 -->
    <!-- width 240; anything below, if the scrollbar appears (for laptops), then the right margin gets squished and invaded -->
    <!-- Sets the designated mobile breakpoint for the component. This will apply alternate styles for mobile devices such as the temporary prop, or activate the bottom prop when the breakpoint value is met. Setting the value to 0 will disable this functionality. -->
    <v-navigation-drawer v-model="isShowingDrawer" 
      app 
      class="elevation-24" 
      width="270" 
      disable-resize-watcher
      mobile-breakpoint="0"
      touchless 
    >      
      <v-sheet class="py-1 px-1" elevation="5">    
        <div style="display: flex; align-items: center;">
          <!-- enable user to report issues, directly email me, etc. -->
          <v-badge 
            :value="numOfUnreadGlobalMsgs"
            :content="numOfUnreadGlobalMsgs"
            top left color="secondary" overlap style="z-index: 1;"
          >
            <v-list-item two-line class="px-0">
              <v-list-item-avatar @click="isAppOverviewPopupOpen = true"  
                class="mr-0" style="cursor: pointer; margin-left: 2px; margin-bottom: 15px;" tile width="50" height="45"
              >
                <img src="/logo.png">
              </v-list-item-avatar>

              <v-list-item-content class="py-0">
                <v-list-item-title>
                  <ClassSwitchDropdown>
                    <template v-slot:add-join-leave-class>
                      <v-list-item @click="isAddClassPopupOpen = !isAddClassPopupOpen">
                        <v-icon left class="mr-2">mdi-plus</v-icon> Add/join class
                      </v-list-item>
                    </template>
                  </ClassSwitchDropdown>
                </v-list-item-title>

                <v-list-item-subtitle>
                  <AllOpenSpaces style="margin-top: 6px;"/>  
                </v-list-item-subtitle>
              </v-list-item-content>
              <portal-target name="area-chat">

              </portal-target>
              <portal-target name="current-open-space-actions">

              </portal-target>
            </v-list-item>
          </v-badge>

          <!-- Have the app overview, updates, news, as well as the chats -->
          <v-dialog v-model="isAppOverviewPopupOpen" width="700">
            <MapleMusicPlayer v-if="isAppOverviewPopupOpen"
              :incrementToToggleMusic="incrementToToggleMusic"
              @music-fetched="incrementToToggleMusic += 1"
            /> 
            <v-card>
              <v-card-title>App Overview</v-card-title>
              <v-card-text>
                 explain.mit.edu is <a href="https://github.com/project-feynman/explain-mit">open source</a> and updates weekly. I'm the full-time developer (eltonlin@mit.edu, 6-14, '20, 503 250 3868) and you can ask me about feature requests, support for troubleshoot, etc.
                <br>
                <br>

                <b>Free listening for students</b>
                <br>
                This semester can be hard, so I also provide "free-listening-as-a-service" for anyone having trouble with classes and sleeping. Talking things out to an outsider can increase happiness,
                and I can serve as a redirect to other people and resources (mental health is why I started Explain in the first place : )

                <br>
                <br>
                <div class="pt-2" style="display: flex; justify-content: space-around;">
                  <!-- FORUM BUTTON -->
                  <v-btn @click.prevent.stop="$store.commit('SET_IS_VIEWING_FORUM', true)" 
                    class="white--text" color="black" 
                  >
                    <v-icon class="mr-1" style="opacity: 0.9;">mdi-draw</v-icon>
                    <v-badge v-if="mitClass"
                      :value="mitClass.numOfUnansweredQuestions"
                      :content="mitClass.numOfUnansweredQuestions"
                      right color="secondary" overlap style="z-index: 1;" offset-x="-5" offset-y="16"
                    >
                      <div style="font-size: 0.9rem; 
                                  font-weight: 500; 
                                  color: '#424242'; 
                                  opacity: 0.9;
                                  text-transform: uppercase;"
                      >
                        FORUM
                      </div>
                    </v-badge>
                  </v-btn>

                  <!-- FORUM POPUP -->
                  <v-dialog 
                    :value="isViewingForum" 
                    @input="(newVal) => $store.commit('SET_IS_VIEWING_FORUM', newVal)"
                    persistent
                    width="95vw"
                  >
                    <v-card>
                      <v-toolbar dark color="grey">
                        <v-btn icon dark @click="$store.commit('SET_IS_VIEWING_FORUM', false)">
                          <v-icon>mdi-close</v-icon>
                        </v-btn>
                        <h2>VISUAL FORUM</h2>
                      </v-toolbar>

                      <!--
                        Without v-if="isViewingForum", the VisualForum does not get destroyed 
                        even if the popup closes
                      -->
                      <VisualForum v-if="isViewingForum"/>
                    </v-card>
                  </v-dialog>

                  <!-- OPEN, CROWDSOURCED LIBRARY -->
                  <v-dialog 
                    :value="isViewingLibrary" 
                    @input="(newVal) => $store.commit('SET_IS_VIEWING_LIBRARY', newVal)"
                    persistent
                    width="95vw"
                  >
                    <template v-slot:activator>
                      <v-btn @click.prevent.stop="$store.commit('SET_IS_VIEWING_LIBRARY', true)" 
                        class="white--text black" 
                      >
                        <!-- purple--text -->
                        <v-icon small class="mr-1">mdi-folder</v-icon>
                        <div style="font-size: 0.9rem; 
                              font-weight: 500; 
                              color: '#424242'; 
                              opacity: 0.9;
                              text-transform: uppercase;">LIBRARY</div>
                      </v-btn>
                    </template>

                    <v-card>
                      <v-toolbar dark color="grey">
                        <v-btn icon dark @click="$store.commit('SET_IS_VIEWING_LIBRARY', false)">
                          <v-icon>mdi-close</v-icon>
                        </v-btn>
                        <h2>OPEN LIBRARY</h2>
                      </v-toolbar>

                      <ClassLibrary v-if="isViewingLibrary" />
                    </v-card>
                  </v-dialog>
                </div>

                <br>
                <br>
                <SlackChats2/>
                <br>
              </v-card-text>
              <v-card-actions>
                <v-spacer/>
                <v-btn v-if="user.enrolledClasses.length >= 2" large @click="leaveClass()">
                  LEAVE CLASS
                </v-btn>
                <v-btn large @click="$_signOut()" class="mx-5 grey darken-1 white--text">
                  <v-icon class="mr-2">mdi-logout</v-icon>
                  SIGN OUT
                </v-btn>       
              </v-card-actions>
            </v-card>
          </v-dialog>

          <ClassNewPopup 
            :isAddClassPopupOpen="isAddClassPopupOpen"
            @input="(newVal) => isAddClassPopupOpen = newVal"
          />
        </div>
      </v-sheet>
      <!-- 
          For AllOpenSpaces, because we no longer use a bandwidth-consuming listener to the roomTypes, 
          it's okay to fetch 10 documents everytime someone switches a section. 
          It'd also help if someone ELSE created or deleted roomTypes, and we would receive the update.
       -->
      <ParticularOpenSpace 
        :sectionID="areaID"
        :key="areaID"
      /> 
    </v-navigation-drawer>

    <v-main>
      <RealtimeRoom 
        :roomID="tableID" 
        :key="tableID"
      />
    </v-main>
  </div>
</template>

<script>
import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/storage";
import { mapState, mapGetters } from "vuex";

import db from "@/database.js";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";

import MyParticipantDocUpdater from "@/components/MyParticipantDocUpdater.vue"; 
import BasePopupButton from "@/components/BasePopupButton.vue";
import ClassLibrary from "@/pages/ClassLibrary.vue";
import ClassSwitchDropdown from "@/components/ClassSwitchDropdown.vue";
import ClassNewPopup from "@/components/ClassNewPopup.vue";

import AllOpenSpaces from "@/pages/AllOpenSpaces.vue"; 
import BaseButton from "@/components/BaseButton.vue";
import VisualForum from "@/components/VisualForum.vue";
import ParticularOpenSpace from "@/pages/ParticularOpenSpace.vue"; 
import RealtimeRoom from "@/pages/RealtimeRoom.vue";
import AuthHelpers from "@/mixins/AuthHelpers.js";
import SlackChats2 from "@/components/SlackChats2.vue"; 
import MapleMusicPlayer from "@/components/MapleMusicPlayer.vue"; 

export default {
  name: "ClassPageLayout",
  props: {
    classID: {
      type: String,
      required: true
    },
    areaID: {
      type: String,
      required: true
    },
    tableID: {
      type: String,
      required: true
    }
  },
  mixins: [
    DatabaseHelpersMixin,
    AuthHelpers
  ],
  components: {
    BaseButton,
    BasePopupButton,
    ClassLibrary,
    ClassSwitchDropdown,
    ClassNewPopup,
    AllOpenSpaces,
    VisualForum,
    MyParticipantDocUpdater,
    MapleMusicPlayer,
    ParticularOpenSpace,
    RealtimeRoom,
    SlackChats2
  },
  data: () => ({
    firebaseRef: null,
    classParticipantsRef: null,
    isShowingDrawer: true,
    isAddClassPopupOpen: false,
    isClassActionsMenuOpen: false,
    unsubscribeClassDocListener: null,
    isAppOverviewPopupOpen: false,
    incrementToToggleMusic: 0
  }),
  computed: {
    ...mapState([
      "user",
      "mitClass",
      "isBoardFullscreen",
      "isViewingLibrary",
      "isViewingForum"
    ]),
    ...mapGetters([
      "numOfUnreadGlobalMsgs"
    ]),
    currentClass () {
      for (const mitClass of this.user.enrolledClasses) {
        if (mitClass.id === this.classID) {
          return mitClass; 
        }
      }
    }
  },
  // TODO: refactor this quickfix
  watch: {
    isBoardFullscreen (newVal) {
      if (newVal) this.isShowingDrawer = false; 
      else this.isShowingDrawer = true; 
    }
  },
  created () {
    this.unsubscribeClassDocListener = db.doc(`classes/${this.classID}`).onSnapshot(classDocSnapshot => {
      this.$store.commit("SET_CLASS", { id: classDocSnapshot.id, ...classDocSnapshot.data() });
    });

    // good place to ensure backwards compatibility for new features
    const { user } = this; 

    // note the email does not exist for an anonymous user
    if (user.email) {
      db.doc(`users/${user.uid}`).update({
        mostRecentClassID: this.classID,
        penColors: user.penColors ? user.penColors : ["#B8F2F9", "#F69637", "#A9F8BD", "#6EE2EA"],
        emailOnNewQuestion: user.emailOnNewQuestion ? user.emailOnNewQuestion : [],
        emailOnNewReply: user.emailOnNewReply ? user.emailOnNewReply : []
      });
    }
  },
  destroyed () {
    this.unsubscribeClassDocListener(); 
  },
  methods: {
    async leaveClass () {
      const { user } = this; 
      let classToRemove = null; 
      for (const enrolledClass of user.enrolledClasses) {
        if (enrolledClass.id === this.$route.params.class_id) {
          classToRemove = enrolledClass;
          break; 
        }
      }

      // bad quickfix code to find a different classID to become the default redirected class
      let newDefaultRedirectedClass = null; 
      for (const enrolledClass of user.enrolledClasses) {
        if (enrolledClass.id !== classToRemove.id) {
          newDefaultRedirectedClass = enrolledClass; 
          break; 
        }
      }

      const { id } = newDefaultRedirectedClass; 
      this.$router.push(`/class/${id}/section/${id}/room/${id}`);

      await db.collection("users").doc(user.uid).update({
        enrolledClasses: firebase.firestore.FieldValue.arrayRemove(classToRemove),
        mostRecentClassID: newDefaultRedirectedClass.id,
        emailOnNewQuestion: firebase.firestore.FieldValue.arrayRemove(classToRemove.id),
        emailOnNewReply: firebase.firestore.FieldValue.arrayRemove(classToRemove.id)
      });
    },
    async toggleMaplestoryMusic () {
      const { isMusicPlaying, musicAudioElement } = this.$store.state; 
      
      if (musicAudioElement.ended) {        
        const maplestorySoundtrack = [
          "[MapleStory BGM] Lith Harbor Above the Treetops.mp3",
          "[MapleStory BGM] Singapore Boat Quay Town.mp3",
          "[MapleStory BGM] Ereve Raindrop Flower.mp3"
        ];
        const randomNumber =  Math.floor((Math.random() * maplestorySoundtrack.length) + 1);
        const pathReference = firebase.storage().ref(maplestorySoundtrack[randomNumber]); 
        const url = await pathReference.getDownloadURL(); 
        this.$store.commit("SET_MUSIC_AUDIO_ELEMENT", new Audio(url));
      }

      if (isMusicPlaying) {
        musicAudioElement.pause(); 
        this.$store.commit("SET_IS_MUSIC_PLAYING", false); 
      } else {
        musicAudioElement.play(); 
        this.$store.commit("SET_IS_MUSIC_PLAYING", true); 
      } 
    }
  }
}
</script>