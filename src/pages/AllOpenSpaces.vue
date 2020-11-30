<template>
  <div>
    <portal to="side-drawer">
      <v-list nav class="pa-2">
        
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
          <!-- accent-text counterintuitively gives the orange shading and NOT the orange text-->
          <v-list-item :key="roomType.id"
            :to="(`/class/${classID}/section/${roomType.id}`)"
            active-class="accent--text"
            class="px-0" 
          >
            <!--  color: ${ $route.params.section_id === roomType.id ? '#ff5b24' : '#424242' };  -->
            <v-list-item-content class="py-0">
              <v-row class="d-flex px-3 py-2" align="center">
                <div 
                  class="ml-3"
                  :style="`
                    font-size: 1rem; 
                    font-weight: 400; 
                    color: ${ $route.params.section_id === roomType.id ? '#424242' : '#424242' }; 
                    opacity: ${ $route.params.section_id === roomType.id ? '70%' : '50%' };
                  `"
                >
                  {{ roomType.name }}
                </div>
                <v-spacer/>
                <portal-target v-if="$route.params.section_id === roomType.id"
                  name="current-open-space-actions"
                  :key="roomType.id + 'actions-portal'"
                >
                  
                </portal-target>
              </v-row>
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

export default {
  name: "AllOpenSpaces",
  mixins: [
    DatabaseHelpersMixin
  ],
  components: {
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