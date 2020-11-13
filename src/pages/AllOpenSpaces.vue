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
            <BasePopupButton actionName="Create new space"
              :inputFields="['name']" 
              @action-do="({ name }) => createNewRoomType(name)"
            >
              <template v-slot:activator-button="{ on }">
                <v-btn class="mr-2" icon v-on="on">
                  <v-icon color="grey darken-2">mdi-plus</v-icon>
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
        <h2>New improvements</h2>
        <ul>
          <li>
            The blackboard is easier to use now, with a larger effective space, and is scrollable by default. 
            Switching between different blackboards will no longer reset your pen settings, and the pen strokes are finer to make it easier to write subscripts.
          </li>
          <li>
            The left-drawer has more effective space, so you can see more rooms and participants at once without having to scroll. 
          </li>
        </ul>
        
        <br>

        <h2>Tips</h2>
          <ul>
            <li>
              Sometimes, swiping left / right on the screen triggers the Safari to go back a page. 
              It's possible to disable the behavior, try "Prevent swiping left to go back page Safari".
            </li> 
          </ul>
        <br>

        <!-- <h2>Other news</h2>

        <ul>
          <li>
            For the life of me I cannot figure out why the ghost participants problem still remains, and I'm hoping 
            to get second pair of eyes to take a look at my correctness argument.
          </li>
          <li>
            Explain currently bleeds around $1k per month because of Twilio's video conferencing API it uses. 
            By switching to Jitsi, an open-source alternative, the cost would become $30/month, a 3000% reduction. 
            Previously, the switch to lib-jitsi-meet, to ensure the longevity, a major update will come and I'm working on
            lib-jitsi-vue and testing it. 
          </li>
          <li>
            I'm also going to be teaching web dev for 2021 IAP, which will be based off of lightweight fullstack (see SIPB 2020).
            The class will take place on Explain itself, and you will work on your own projects. 
          </li>
        </ul>
        <br> -->

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