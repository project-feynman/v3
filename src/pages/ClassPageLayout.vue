<template>
  <!-- This 100vh is key, it means all the subsequent <div> will maintain its size regardless of how big the blackboard is (it'll just allow for 
    horizontal and vertical scrolling), which is what we want -->
  <div style="height: 100%">
    <!-- mobile-breakpoint="500": prevents the side-drawer from going into mobile mode where it's temporary -->
    <!-- Elevation ranges from 0 to 24 -->
    <!-- Sets the designated mobile breakpoint for the component. This will apply alternate styles for mobile devices such as the temporary prop, or activate the bottom prop when the breakpoint value is met. Setting the value to 0 will disable this functionality. -->
    <v-navigation-drawer v-model="isShowingDrawer" 
      app 
      class="elevation-24" 
      width="240" 
      disable-resize-watcher
      mobile-breakpoint="0"
      touchless 
    >      
      <v-sheet class="pt-2 pl-2">    
        <div class="d-flex">
          <v-list-item-avatar @click="$router.push('/')" tile width="40" height="36" style="cursor: pointer;" class="ma-0">
            <img src="/logo.png">
          </v-list-item-avatar>

          <ClassSwitchDropdown>
            <v-list-item @click="isAddClassPopupOpen = !isAddClassPopupOpen">
              <v-icon left class="mr-2">mdi-plus</v-icon> Add class
            </v-list-item>
          </ClassSwitchDropdown>

          <ClassNewPopup 
            :isAddClassPopupOpen="isAddClassPopupOpen"
            @change="(newVal) => isAddClassPopupOpen = newVal"
          />

          <v-spacer/>

          <!-- Class actions includes: 
            1. Create open space
            2. Leave class
           -->
          <v-menu v-model="isClassActionsMenuOpen" offset-y bottom>
            <template v-slot:activator>
              <BaseButton @click="isClassActionsMenuOpen = true" 
                stopPropagation 
                icon="mdi-dots-vertical" color="black" small
              />
            </template>
            
            <!-- Create new spaces -->
            <v-list>
              <BasePopupButton actionName="Create new space"
                :inputFields="['name']" 
                @action-do="({ name }) => createNewRoomType(name)"
              >
                <template v-slot:activator-button="{ on }">
                  <v-list-item v-on="on">
                    <v-icon color="grey darken-1" class="mr-2">mdi-plus</v-icon>
                    New area
                  </v-list-item>
                </template> 
              </BasePopupButton>
            
              <!-- Leave class -->
              <v-list-item v-if="user.enrolledClasses.length >= 2" @click="leaveClass()">
                <v-icon>mdi-exit</v-icon>Leave class
              </v-list-item>
            </v-list>
          </v-menu>
        </div>

        <!-- TODO: re-write these bizarre teleports -->
        <portal to="my-control-buttons">
          <div style="display: flex; justify-content: space-around" class="mt-1">
            <v-dialog 
              :value="isViewingForum" 
              @input="(newVal) => $store.commit('SET_IS_VIEWING_FORUM', newVal)"
              persistent
              fullscreen
            >
              <template v-slot:activator>
                <v-btn @click.prevent.stop="$store.commit('SET_IS_VIEWING_FORUM', true)" small class="px-2">
                  <v-icon small>mdi-forum</v-icon>
                  <div style="font-size: 0.7rem">FORUM</div>
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
              fullscreen
            >
              <template v-slot:activator>
                <v-btn @click.prevent.stop="$store.commit('SET_IS_VIEWING_LIBRARY', true)" small class="px-2">
                  <v-icon small>mdi-bookshelf</v-icon>
                  <div style="font-size: 0.7rem">LIBRARY</div>
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


          <v-row align="center" class="d-flex px-1 mt-3">
            <!-- Music -->
            <v-switch 
              :input-value="$store.state.isMusicPlaying"
              @change="toggleMaplestoryMusic()"
              color="cyan"
              prepend-icon="mdi-music-clef-treble"
              hide-details
              class="mt-0 ml-3 grey--text"
              inset
              dense
            />
          </v-row>

          <!-- Red Hangup Button -->
          <portal-target name="video-screenshare-hangup-buttons">
      
          </portal-target>  
        </portal>
      </v-sheet>
      
      <portal-target name="side-drawer">

      </portal-target>
    </v-navigation-drawer>

    <!-- Here is the main content -->
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
    VisualForum
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
    ])
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
          mostRecentClassID: class_id
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
    /**
     * Create a new roomType, and initialize it with a common room, which is initialized with a blackboard
     */
    async createNewRoomType (name) {
      const { class_id } = this.$route.params; 
      const id = getRandomId(); 
      const ref = db.doc(`classes/${class_id}`);
      await Promise.all([
        ref.collection("roomTypes").doc(id).set({ id, name }),
        ref.collection("rooms").doc(id).set({
          isCommonRoom: true,
          roomTypeID: id,
          blackboards: [id]
        }),
        ref.collection("blackboards").doc(id).set({})
      ]);
      this.$root.$emit("show-snackbar", "Successfully created new open space.")
      this.$router.push(`/class/${class_id}/section/${id}`);
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