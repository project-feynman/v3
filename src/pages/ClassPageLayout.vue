<template>
  <!-- This 100vh is key, it means all the subsequent <div> will maintain its size regardless of how big the blackboard is (it'll just allow for 
    horizontal and vertical scrolling), which is what we want -->
  <div style="height: 100%">
    <MyParticipantDocUpdater
      :classID="classID"
      :roomID="roomID"
    />

    <!-- Elevation ranges from 0 to 24 -->
    <!-- width 240; anything below, if the scrollbar appears (for laptops), then the right margin gets squished and invaded -->
    <!-- Sets the designated mobile breakpoint for the component. This will apply alternate styles for mobile devices such as the temporary prop, or activate the bottom prop when the breakpoint value is met. Setting the value to 0 will disable this functionality. -->
    <v-navigation-drawer v-model="isShowingDrawer" 
      app 
      class="elevation-24" 
      width="240" 
      disable-resize-watcher
      mobile-breakpoint="0"
      touchless 
    >      
      <v-sheet class="py-3 pl-2" elevation="5">    
        <div style="display: flex;">
          <!-- enable user to report issues, directly email me, etc. -->
            <v-list-item-avatar @click="isTechSupportPopupOpen = true"  
              class="ma-0" style="cursor: pointer;" tile width="47" height="42"
            >
              <img src="/logo.png">
            </v-list-item-avatar>

          <v-dialog v-model="isTechSupportPopupOpen" width="700">
            <v-card>
              <v-card-title>App Overview</v-card-title>
              <v-card-actions>
                <v-spacer/>
                <v-btn large @click="$_signOut()" class="mx-5 grey darken-1 white--text">
                  <v-icon class="mr-2">mdi-logout</v-icon>
                  SIGN OUT
                </v-btn>       
              </v-card-actions>
            </v-card>
          </v-dialog>

          <ClassSwitchDropdown>
            <template v-slot:current-class-settings>
              <v-list-item @click="isClassSettingsPopupOpen = true" class="accent--text">
                <v-icon class="mr-2">mdi-settings</v-icon>
                {{ currentClass.name }} settings
              </v-list-item>
            </template>

            <template v-slot:add-join-leave-class>
              <v-list-item @click="isAddClassPopupOpen = !isAddClassPopupOpen">
                <v-icon left class="mr-2">mdi-plus</v-icon> Add/join class
              </v-list-item>
            </template>
          </ClassSwitchDropdown>

          <ClassSettingsPopup
            :isClassSettingsPopupOpen="isClassSettingsPopupOpen"
            @input="(newVal) => isClassSettingsPopupOpen = newVal"
          />

          <ClassNewPopup 
            :isAddClassPopupOpen="isAddClassPopupOpen"
            @input="(newVal) => isAddClassPopupOpen = newVal"
          />
        </div>

        <div class="pr-2 pt-2">
          <!-- FORUM BUTTON -->
          <v-btn @click.prevent.stop="$store.commit('SET_IS_VIEWING_FORUM', true)" 
            class="white--text px-3 my-1" color="grey" block
          >
            <v-icon class="mr-1" style="font-size: 0.85rem; opacity: 0.9;">mdi-forum</v-icon>
            <v-badge v-if="mitClass"
              :value="mitClass.numOfUnansweredQuestions"
              :content="mitClass.numOfUnansweredQuestions"
              right color="info" overlap style="z-index: 1;" offset-x="-5" offset-y="16"
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
                Without isViewingForum, the VisualForum does not get destroyed 
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
            width="70vw"
          >
            <template v-slot:activator>
              <v-btn @click.prevent.stop="$store.commit('SET_IS_VIEWING_LIBRARY', true)" 
                class="white--text grey px-3 my-1" block
              >
                <!-- purple--text -->
                <v-icon small class="mr-1" style="opacity: 1; font-size: 0.9">mdi-bookshelf</v-icon>
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
                <h2>LIBRARY</h2>
              </v-toolbar>

              <ClassLibrary v-if="isViewingLibrary" />
            </v-card>
          </v-dialog>
        </div>
      </v-sheet>

      <AllOpenSpaces style="margin-top: 14px;"/>  
      <!-- 
          For AllOpenSpaces, because we no longer use a bandwidth-consuming listener to the roomTypes, 
          it's okay to fetch 10 documents everytime someone switches a section. 
          It'd also help if someone ELSE created or deleted roomTypes, and we would receive the update.
       -->
      <ParticularOpenSpace 
        :sectionID="$route.params.section_id"
        :key="$route.params.section_id"
      /> 
    </v-navigation-drawer>

    <v-main>
      <RealtimeRoom 
        :roomID="$route.params.room_id" 
        :key="$route.params.room_id"
      />
    </v-main>
  </div>
</template>

<script>
import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/storage";
import { mapState } from "vuex";

import db from "@/database.js";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";

import MyParticipantDocUpdater from "@/components/MyParticipantDocUpdater.vue"; 
import BasePopupButton from "@/components/BasePopupButton.vue";
import ClassLibrary from "@/pages/ClassLibrary.vue";
import ClassSwitchDropdown from "@/components/ClassSwitchDropdown.vue";
import ClassNewPopup from "@/components/ClassNewPopup.vue";
import ClassSettingsPopup from "@/components/ClassSettingsPopup.vue"; 

import AllOpenSpaces from "@/pages/AllOpenSpaces.vue"; 
import BaseButton from "@/components/BaseButton.vue";
import VisualForum from "@/components/VisualForum.vue";
import ParticularOpenSpace from "@/pages/ParticularOpenSpace.vue"; 
import RealtimeRoom from "@/pages/RealtimeRoom.vue";
import AuthHelpers from "@/mixins/AuthHelpers.js";

export default {
  name: "ClassPageLayout",
  props: {
    classID: {
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
    ClassSettingsPopup,
    AllOpenSpaces,
    VisualForum,
    MyParticipantDocUpdater,
    ParticularOpenSpace,
    RealtimeRoom
  },
  data: () => ({
    firebaseRef: null,
    classParticipantsRef: null,
    isShowingDrawer: true,
    isAddClassPopupOpen: false,
    isClassActionsMenuOpen: false,
    isClassSettingsPopupOpen: false,
    unsubscribeClassDocListener: null,
    isTechSupportPopupOpen: false
    // isHelpPopupOpen: false
  }),
  computed: {
    ...mapState([
      "user",
      "mitClass",
      "isBoardFullscreen",
      "isViewingLibrary",
      "isViewingForum"
    ]),
    // note: these properties are not reactive, but I assume they will be re-rendered and therefore updated 
    // due to <router-view :key="$route.params.class_id> in App.vue
    roomID () { return this.$route.params.room_id; },
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