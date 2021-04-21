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
                class="mr-0" style="cursor: pointer; margin-left: 2px; margin-bottom: 16px;" tile width="60" height="55"
              >
                <img src="/logo.png">
              </v-list-item-avatar>

              <v-list-item-content class="py-0">
                <v-list-item-title class="mb-0">
                  <ClassSwitchDropdown>
                    <template v-slot:add-join-leave-class>
                      <v-list-item @click="isAddClassPopupOpen = !isAddClassPopupOpen">
                        <v-icon left class="mr-2">mdi-plus</v-icon> Add/join class
                      </v-list-item>
                    </template>
                  </ClassSwitchDropdown>
                </v-list-item-title>

                <v-list-item-subtitle>
                  <AllAreas style="margin-top: 6px;"/>  
                </v-list-item-subtitle>
              </v-list-item-content>
              <portal-target name="current-open-space-actions">

              </portal-target>
            </v-list-item>
          </v-badge>

          <!-- Have the app overview, updates, news, as well as the chats -->
          <v-dialog v-model="isAppOverviewPopupOpen" width="90vw" style="height: 90vh" persistent>
            <v-card style="height: 80vh">     
              <MapleMusicPlayer v-if="isAppOverviewPopupOpen"
                :incrementToToggleMusic="incrementToToggleMusic"
                @music-fetched="incrementToToggleMusic += 1"
              />  
                <v-btn icon @click="isAppOverviewPopupOpen = false">
                  <v-icon>mdi-close</v-icon>
                </v-btn>
                <v-tabs
                  v-model="tab"
                  background-color="transparent"
                  color="accent"
                > 
                  <v-tab>School Messenger</v-tab>
                  <v-tab>Visual Forum</v-tab>
                  <v-tab>Open Library</v-tab>
                </v-tabs>

                <v-tabs-items v-model="tab" touchless>
                  <!-- <v-tab-item key="overview">
                    <v-card-text>
                      <b>Problem</b>
                      <br>
                      MIT is hard because of its relentless pace, and once you fall behind your problems exponentiate: worse sleep, worse learning, worse health, worse psychology, worse relationships. 
                      Moreover, when people are already at their limit themselves, it's near impossible to find time to help each other. 
                      <br>
                      <br>
                      <b>Solution</b>
                      <br>
                      The goal of explain.mit.edu is to make helping each other so efficient that it becomes the optimal strategy for everyone. 
                      There are four active experiments running: 
                      <ol>
                        <li>Pset Lounge: a convenient central place for people to pset together, host Office Hours, etc.</li>
                        <li>Visual forum: a blackboard-centric forum where you can draw and talk</li>
                        <li>Open Library: a visual, crowdsourced repository of explanations that outlasts each class generation</li>
                        <li>School Messenger: a centralized, distraction-free environment to message classmates</li>
                      </ol>

                      <br>
                      It is <a href="https://github.com/project-feynman/explain-mit">open source</a> and updates weekly. 
                      Contact any of the active developers for help with troubleshooting, feature requests, etc:

                      <ul>
                        <li>Elton Lin, eltonlin@mit.edu, class of 2020)</li>
                        <li>Huy Dai, huydai@mit.edu, class of 2024)</li>
                        <li>(We're recruiting!)</li>
                      </ul>
                      <br>

                      <b>Free listening for students</b>
                      <br>
                      I also provide "free-listening-as-a-service" for anyone having trouble with classes and sleeping. Talking things out to an outsider can increase happiness,
                      and I can serve as a redirect to other people and resources (mental health is why I started Explain in the first place : )
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
                  </v-tab-item> -->

                  <v-tab-item>
                    <v-card-text>
                      <SlackChats2/>
                    </v-card-text>
                  </v-tab-item>

                  <v-tab-item @click="$store.commit('SET_IS_VIEWING_FORUM', true)">
                    <VisualForum/>
                  </v-tab-item>

                  <v-tab-item @click="$store.commit('SET_IS_VIEWING_LIBRARY', true)">
                    <ClassLibrary/>
                  </v-tab-item>
                </v-tabs-items>

              <v-card-text v-if="false">
                <div v-if="false" class="pt-2" style="display: flex; justify-content: space-around;">
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
           
                <br>
              </v-card-text>
            </v-card>
          </v-dialog>

          <ClassNewPopup 
            :isAddClassPopupOpen="isAddClassPopupOpen"
            @input="(newVal) => isAddClassPopupOpen = newVal"
          />
        </div>
      </v-sheet>
      <!-- 
          For AllAreas, because we no longer use a bandwidth-consuming listener to the roomTypes, 
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

import AllAreas from "@/pages/AllAreas.vue"; 
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
    AllAreas,
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
    incrementToToggleMusic: 0,
    tab: 0, // 0, 1, 2
    isViewingMessenger: false
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
    },
    isAppOverviewPopupOpen: {
      get () {
        return (this.isViewingForum || this.isViewingLibrary || this.isViewingMessenger); 
      },
      set (newBoolean) {
        if (newBoolean) this.isViewingMessenger = true; 
        else {
          this.isViewingMessenger = false; 
          this.$store.commit("SET_IS_VIEWING_FORUM", false); 
          this.$store.commit("SET_IS_VIEWING_LIBRARY", false); 
        } 
      }
    }
  },
  // TODO: refactor this quickfix
  watch: {
    isBoardFullscreen (newVal) {
      if (newVal) this.isShowingDrawer = false; 
      else this.isShowingDrawer = true; 
    },
    // REFACTOR THIS
    // setting isViewingForum to true will display the AppOverViewPopup because it's computed property relies on it, 
    // and the right tab will be selected because the tab is set here. Not a great solution, but <v-tabs> is really hard to get to work
    isViewingForum: {
      immediate: true,
      handler () {
        this.tab = 1; 
      }
    },
    isViewingLibrary: {
      immediate: true, 
      handler () {
        this.tab = 2; 
      }
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