<template>
  <!-- This 100vh is key, it means all the subsequent <div> will maintain its size regardless of how big the blackboard is (it'll just allow for 
    horizontal and vertical scrolling), which is what we want -->
  <div style="height: 100%">
    <MyParticipantDocUpdater v-if="classID && roomID"
      :classID="classID"
      :roomID="roomID"
      :key="classID + roomID"
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
      <v-sheet class="pt-3 pl-2">    
        <div style="display: flex;">
          <v-list-item-avatar @click="$router.push('/')" tile width="47" height="42" style="cursor: pointer;" class="ma-0">
            <img src="/logo.png">
          </v-list-item-avatar>

          <ClassSwitchDropdown>
            <v-list-item @click="isAddClassPopupOpen = !isAddClassPopupOpen">
              <v-icon left class="mr-2">mdi-plus</v-icon> Add/join class
            </v-list-item>
          </ClassSwitchDropdown>

          <ClassNewPopup 
            :isAddClassPopupOpen="isAddClassPopupOpen"
            @change="(newVal) => isAddClassPopupOpen = newVal"
          />
        </div>

        <div style="display: flex; align-content: center; justify-content: space-around;" class="mt-2">
          <v-dialog 
            :value="isViewingForum" 
            @input="(newVal) => $store.commit('SET_IS_VIEWING_FORUM', newVal)"
            persistent
          >
            <template v-slot:activator>
              <v-btn @click.prevent.stop="$store.commit('SET_IS_VIEWING_FORUM', true)" class="white--text px-3" color="grey">
                <!-- orange--text -->
                <v-icon class="mr-1" style="font-size: 0.85rem; opacity: 0.9;">mdi-forum</v-icon>
                <div style="font-size: 0.9rem; 
                            font-weight: 500; 
                            color: '#424242'; 
                            opacity: 0.9;
                            text-transform: uppercase;"
                >
                  FORUM
                </div>
              </v-btn>
            </template>

            <v-card>
              <v-toolbar dark>
                <v-btn icon dark @click="$store.commit('SET_IS_VIEWING_FORUM', false)">
                  <v-icon>mdi-close</v-icon>
                </v-btn>
              </v-toolbar>

              <!--
                Without isViewingForum, the VisualForum does not get destroyed 
                even if the popup closes
              -->
              <VisualForum v-if="isViewingForum" 
                :key="$route.params.class_id"
              />
            </v-card>
          </v-dialog>

          <v-dialog 
            :value="isViewingLibrary" 
            @input="(newVal) => $store.commit('SET_IS_VIEWING_LIBRARY', newVal)"
            persistent
          >
            <template v-slot:activator>
              <v-btn @click.prevent.stop="$store.commit('SET_IS_VIEWING_LIBRARY', true)" class="ml-1 mr-2 white--text grey px-3">
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
              <v-toolbar dark>
                <v-btn icon dark @click="$store.commit('SET_IS_VIEWING_LIBRARY', false)">
                  <v-icon>mdi-close</v-icon>
                </v-btn>
              </v-toolbar>

              <ClassLibrary v-if="isViewingLibrary" 
                :key="$route.params.class_id"
              />
            </v-card>
          </v-dialog>
        </div>  
      </v-sheet>

      <!-- <v-divider class="my-5"/> -->
          
      <!-- <v-row align="center" class="d-flex px-1 mt-3">
        <v-switch @change="toggleMaplestoryMusic()"
          :input-value="$store.state.isMusicPlaying"
          color="cyan"
          prepend-icon="mdi-music-clef-treble"
          hide-details
          class="mt-0 ml-3 grey--text"
          inset
          dense
        />
      </v-row> -->  
      <portal-target name="side-drawer" style="margin-top: 35px;">

      </portal-target>
    </v-navigation-drawer>

    <!-- MAIN CONTENT / AREA (where the collaborative blackboard resides) -->
    <v-main>
      <portal-target name="main-content">
        
      </portal-target>
    </v-main>

    <div v-if="mitClass" :key="$route.params.class_id + $route.params.section_id">
      <!-- :key="...class_id" forces <router-view/> to re-render -->
      <!-- Many things from <router-view> will teleport to the portals above -->
      <!-- 
          For AllOpenSpaces, because we no longer use a bandwidth-consuming listener to the roomTypes, 
          it's okay to fetch 10 documents everytime someone switches a section. 
          It'd also help if someone ELSE created or deleted roomTypes, and we would receive the update.
       -->
      <AllOpenSpaces/>  
      <router-view/>
    </div>
  </div>
</template>

<script>
import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/storage";
import { mapState } from "vuex";

import db from "@/database.js";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import { DefaultEmailSettings } from "@/CONSTANTS.js";
import { getRandomId } from "@/helpers.js"; 

import MyParticipantDocUpdater from "@/components/MyParticipantDocUpdater.vue"; 
import GroupChat from "@/components/GroupChat.vue"; 
import BasePopupButton from "@/components/BasePopupButton.vue";
import ClassLibrary from "@/pages/ClassLibrary.vue";
import ClassSwitchDropdown from "@/components/ClassSwitchDropdown.vue";
import ClassNewPopup from "@/components/ClassNewPopup.vue";
import AllOpenSpaces from "@/pages/AllOpenSpaces.vue"; 
import BaseButton from "@/components/BaseButton.vue";
import VisualForum from "@/components/VisualForum.vue";

export default {
  name: "ClassPageLayout",
  mixins: [
    DatabaseHelpersMixin
  ],
  components: {
    BaseButton,
    BasePopupButton,
    GroupChat,
    ClassLibrary,
    ClassSwitchDropdown,
    ClassNewPopup,
    AllOpenSpaces,
    VisualForum,
    MyParticipantDocUpdater
  },
  data: () => ({
    firebaseRef: null,
    classParticipantsRef: null,
    isChatOpen: false,
    isShowingDrawer: true,
    isAddClassPopupOpen: false,
    isClassActionsMenuOpen: false
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
    classID () { return this.$route.params.class_id; },
    roomID () { return this.$route.params.room_id; }
  },
  // TODO: refactor this quickfix
  watch: {
    "$route.params.class_id": {
      deep: true,
      immediate: true,
      handler (newClassID) {
        if (this.mitClass) {
          if (newClassID === this.mitClass.id) {
            return; 
          }
        }
        const { class_id } = this.$route.params; 
        this.$store.commit("SET_CLASS", null);
        this.$store.dispatch("fetchClass", class_id); 
        db.doc(`users/${this.user.uid}`).update({
          mostRecentClassID: class_id,
          penColors: this.user.penColors ? this.user.penColors : ["#B8F2F9", "#F69637", "#A9F8BD", "#6EE2EA"]
        });
      }
    },
    isBoardFullscreen (newVal) {
      if (newVal) this.isShowingDrawer = false; 
      else this.isShowingDrawer = true; 
    }
  },
  methods: {
    async leaveClass () {
      let classToRemove = null; 
      for (const enrolledClass of this.user.enrolledClasses) {
        if (enrolledClass.id === this.$route.params.class_id) {
          classToRemove = enrolledClass;
          break; 
        }
      }
      await db.collection("users").doc(this.user.uid).update({
        enrolledClasses: firebase.firestore.FieldValue.arrayRemove(classToRemove),
        mostRecentClassID: this.user.enrolledClasses[0].id
      });
      this.$router.push("/");
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
    },   
    // async submitBug ({ "Describe your problem": title }) {
    //   if (!title) {
    //     this.$root.$emit("show-snackbar", "Error: don't forget to write something")
    //     return;
    //   }
    //   const sendEmailToTeam = firebase.functions().httpsCallable("sendEmailToCoreTeam");
    //   sendEmailToTeam({ 
    //     userEmail: this.user ? this.user.email : "anonymous@mit.edu",
    //     userFeedback: title  
    //   });
    //   await db.collection("bugs").add({ 
    //     title,
    //     email: this.user ? this.user.email : "anonymous@mit.edu"
    //   }); 
    //   this.$root.$emit("show-snackbar", "Successfully sent feedback.");
    // },
    // async leaveClass () {
    //   const emailSettingsUpdate = {};
    //   for (let emailOption of Object.keys(DefaultEmailSettings)) {
    //     emailSettingsUpdate[emailOption] = firebase.firestore.FieldValue.arrayRemove(this.mitClass.id);
    //   }
    //   const updatedEnroll = this.user.enrolledClasses.filter((course) => course.id !== this.$route.params.class_id);
    //   await db.collection("users").doc(this.user.uid).update({
    //     enrolledClasses: updatedEnroll,
    //     ...emailSettingsUpdate
    //   });
    //   this.$router.push({ path: '/' });
    //   this.$root.$emit("show-snackbar", "Successfully dropped class.");
    // }
  }
}
</script>