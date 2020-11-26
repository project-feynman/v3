<template>
  <div>
    <portal to="side-drawer">
      <v-list>
        <div class="d-flex align-center pb-0" style="padding-left: 12px;">
          <p class="text-uppercase font-weight-bold mb-0" style="opacity: 35%; font-size: 0.65rem;">
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
                  <v-icon color="grey darken-1" small>mdi-plus</v-icon>
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

        <template v-for="roomType in sortedRoomTypes">
          <!-- Fix not getting orange highlight (or perhaps it's a feature and not a bug : )) -->
          <v-list-item :key="roomType.id"
            :to="(`/class/${classID}/section/${roomType.id}/room/${roomType.id}`)"
            active-class="accent--text"
            class="px-2" 
            dense
          >
            <v-list-item-content 
              :style="`
                font-size: 0.8rem; 
                font-weight: 400; 
                color: ${ $route.params.section_id === roomType.id ? '#ff5b24' : '#424242' }; 
                opacity: ${ $route.params.section_id === roomType.id ? '100%' : '70%' };
              `"
              class="py-1"
            >
              <div class="d-flex align-center">
                <div class="ml-2">{{ roomType.name }}</div>
                <v-spacer/>
                <portal-target v-if="$route.params.section_id === roomType.id"
                  name="current-open-space-actions"
                  class="mt-1"
                  :key="roomType.id + 'actions-portal'"
                >
                  
                </portal-target>
              </div>
              <portal-target v-if="$route.params.section_id === roomType.id" 
                name="currently-active-open-space" 
                :key="roomType.id + 'rooms-portal'"
              >

              </portal-target>
            </v-list-item-content>
            <!-- <v-list-item-action>
              <v-row> -->

                <!-- TODO: create and update operations with a dropdown menu -->
                <!-- <v-btn @click.stop.prevent="isEditPopupOpen = true; roomTypeID = roomType.id" icon>
                  <v-icon color="grey">mdi-pencil</v-icon>
                </v-btn> -->

                <!-- <v-btn v-if="isAdmin" @click.submit.prevent="deleteRoomType(roomType.id)" icon>
                  <v-icon color="red">mdi-close</v-icon>
                </v-btn> -->

              <!-- </v-row>
            </v-list-item-action> -->
          </v-list-item>
        </template>
      </v-list>
    </portal>
  </div>
</template>

<script>
/**
 * Experiment: whenever the user switches an open space, recount the number of participants in each open space. 
 * For operations that are rare, don't take up too much area. Optimize for high frequency operations.
 */

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
    },
    sortedRoomTypes () {
      return [
        ...this.roomTypes.filter(roomType => roomType.id === this.$route.params.class_id),
        ...this.roomTypes.filter(roomType => roomType.id !== this.$route.params.class_id)
      ];
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
      this.classDocRef.collection("roomTypes").doc(id).set({ id, name });
      this.classDocRef.collection("rooms").doc(id).set({
        isCommonRoom: true,
        roomTypeID: id,
        blackboards: [id]
      });
      this.classDocRef.collection("blackboards").doc(id).set({});
    },
    /** TODO: make this a proper deletion */
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