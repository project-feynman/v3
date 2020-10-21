<template>
  <div>
    <portal to="side-drawer">
      <v-list>
        <div class="d-flex align-center pt-2 pb-0" style="padding-left: 18px;">
          <p class="text-uppercase font-weight-bold mb-0" style="margin-top: 2px; opacity: 50%; font-size: 0.8rem;">
            Open Spaces
          </p>
          <v-spacer/>
          <div v-if="roomTypes !== []">
            <BasePopupButton actionName="Create new open space"
              :inputFields="['name']" 
              @action-do="({ name }) => createNewRoomType(name)"
            >
              <template v-slot:activator-button="{ on }">
                <v-btn class="mr-2" icon v-on="on">
                  <v-icon color="secondary">mdi-plus</v-icon>
                </v-btn>
              </template> 
            </BasePopupButton>
          </div>
        </div>
        
        <!-- 
        <v-dialog v-model="isEditPopupOpen" width="500px">
          <v-card>
            <v-card-title>
              Rename this open space
            </v-card-title>
            <v-card-text>
              <v-text-field placeholder="Enter the new name..." v-model="newRoomTypeName"/>
            </v-card-text>
          
            <v-card-actiofns>
              <v-spacer/>
              <v-btn @click="isEditPopupOpen = false">CANCEL</v-btn>
              <v-btn @click="editNameOfRoomType(); isEditPopupOpen = false;" color="accent">
                Save
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog> -->

        <v-list-item v-for="roomType in roomTypes" :key="roomType.id"
          append :to="(`section/${roomType.id}`)"
          style="padding-left: 30px; padding-right: 24px" 
        >
          <v-list-item-content style="font-size: 0.9rem; font-weight: 400; color: #424242; opacity: 70%;">
            {{ roomType.name }}
          </v-list-item-content>

          <v-list-item-action>
            <v-row>
              <!-- TODO: create and update operations with a dropdown menu -->
              <!-- <v-btn @click.stop.prevent="isEditPopupOpen = true; roomTypeID = roomType.id" icon>
                <v-icon color="grey">mdi-pencil</v-icon>
              </v-btn> -->

              <!-- <v-btn v-if="isAdmin" @click.submit.prevent="deleteRoomType(roomType.id)" icon>
                <v-icon color="red">mdi-close</v-icon>
              </v-btn> -->
            </v-row>
          </v-list-item-action>
        </v-list-item>
      </v-list>
    </portal>

    <portal to="main-content">
      <div class="ma-5">
      <h2>New changes</h2>
      <ul>
        <li>Everyone can now freely create and delete open spaces and rooms</li>
      </ul>

      <br>

      <h2>Troubleshoot tips</h2>
      <ul>
        <li>To fix most issues e.g. lag, simply <u>reload the website</u>.</li>
        <li>Otherwise, quit the browser tab and open a fresh page of explain.mit.edu.</li>
        <li>If issues persist, do a hard reset (force quit the browser, reset the cache).</li>
        <li>Feel free to contact me (email: eltonlin@mit.edu) or (Facetime audio: +886 965 602 567)</li>
      </ul>

      <br>

      <h2>Roadmap</h2>
      <ul>
        <!-- <li>Audio/video upgrades: a Zoom integration is coming</li> -->
        <li>Blackboard upgrades: arbitrary colors, backgrounds, undo/redo, color persistence across boards etc.</li>
        <li>Birds-eye view: for better vision of what's going on on all the boards</li>
      </ul>

      </div>
      <!-- <div style="font-size: 3.75rem; font-weight: 400">
        Overview
      </div>
      <ClassCalendar/> -->
    </portal>
  </div>
</template>

<script>
import db from "@/database.js"; 
import { getRandomId } from "@/helpers.js"; 
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import BasePopupButton from "@/components/BasePopupButton.vue"; 
import BaseButton from "@/components/BaseButton.vue";
import SmallAppBar from "@/components/SmallAppBar.vue";
import ClassLibrary from "@/pages/ClassLibrary.vue";
import { mapState, mapGetters } from "vuex";
import ClassCalendar from "@/components/ClassCalendar.vue"; 

export default {
  name: "AllOpenSpaces",
  mixins: [
    DatabaseHelpersMixin
  ],
  components: {
    ClassCalendar,
    ClassLibrary,
    BasePopupButton,
    BaseButton,
    SmallAppBar
  },
  data () {
    return {
      roomTypes: [],
      unsubscribeRoomTypesListener: null,
      showLibrary: false,
      // isEditPopupOpen: false,
      // newRoomTypeName: "",
      // roomTypeID: ""
    };
  },
  computed: {
    ...mapState([
      "mitClass"
    ]),
    ...mapGetters([
      "isAdmin"
    ]),
    classID () {
      return this.$route.params.class_id;
    },
    classDocRef () {
      return db.doc(`classes/${this.classID}`); 
    }
  },
  created () {
    this.unsubscribeRoomTypesListener = this.$_bindVarToDB({
      varName: "roomTypes",
      dbRef: this.classDocRef.collection("roomTypes"),
      component: this
    });
  },
  destroyed () {
    this.unsubscribeRoomTypesListener(); 
  },
  methods: {
    /**
     * Create a new roomType, and initialize it with a common room, which is initialized with a blackboard
     */
    createNewRoomType (name) {
      const id = getRandomId(); 
      this.classDocRef.collection("roomTypes").doc(id).set({
        id,
        name
      });
      this.classDocRef.collection("rooms").doc(id).set({
        isCommonRoom: true,
        roomTypeID: id,
        blackboards: [id]
      });
      this.classDocRef.collection("blackboards").doc(id).set({});
    },
    deleteRoomType (roomTypeID) {
      this.classDocRef.collection("roomTypes").doc(roomTypeID).delete();
    },
    editNameOfRoomType (newName) {
      this.classDocRef.collection("roomTypes").doc(this.roomTypeID).update({
        name: this.newRoomTypeName
      });
      this.newRoomTypeName = ""; 
      this.roomTypeID = ""; 
      console.log("editNameOfRoomType()");
    }
  }
}
</script>