<template>
  <div>
    <portal to="side-drawer">
      <v-list>
        <!-- <div style="padding-top: 12px; padding-left: 24px; padding-bottom: 8px; font-size: 1.15rem">
          Open Spaces
        </div> -->

        <v-list-item v-for="roomType in roomTypes" :key="roomType.id"
          append :to="(`section/${roomType.id}`)"
          style="padding-left: 24px; padding-right: 24px"
        >
          <v-list-item-content style="font-size: 0.88rem; font-weight: 400; color: #424242; opacity: 81%;">
            {{ roomType.name }}
          </v-list-item-content>

          <v-list-item-action>
            <v-row>
              <!-- <v-btn @click.submit.prevent="editNameOfRoomType()" icon>
                <v-icon color="grey">mdi-pencil</v-icon>
              </v-btn> -->

              <!-- <v-btn v-if="isAdmin" @click.submit.prevent="deleteRoomType(roomType.id)" icon>
                <v-icon color="red">mdi-close</v-icon>
              </v-btn> -->
            </v-row>
          </v-list-item-action>
        </v-list-item>

        <div v-if="roomTypes !== []">
          <BasePopupButton actionName="Create new open space"
            :inputFields="['name']" 
            @action-do="({ name }) => createNewRoomType(name)"
          >
            <template v-slot:activator-button="{ on }">
              <v-btn v-if="isAdmin" v-on="on" block text color="grey">
                <v-icon left>mdi-plus</v-icon>
                New open space
              </v-btn>
            </template> 
          </BasePopupButton>
        </div>
      </v-list>
    </portal>

    <!-- TODO -->
    <portal to="main-content">
      <h1>New things to try</h1>
      <ul>
        <li>Directly message any class member</li>
        <li>create public message channels</li>
        <li>You can save/wipe all the boards in any given room with 1 click</li>
        <li>Browse the newly improved library</li>
        <li>Record audio with blackboards (press the purple record button)</li>
      </ul>

      <br>

      <h1>Currently fixing</h1>
      <ul>
        <li>Ghost participants</li>
        <li>Audio issues</li> 
        <li>Support arbitrary pen colors for blackboard</li>
        <li>Fix scrolling on blackboard not always working</li>
        <li>Ultra-large blackboard</li>
        <li>Pinned blackboard toolbar</li>
        <li>Cache blackboards you already opened to not have to wait for it to load</li>
        <li>Don't display initials/middle names as last names</li>
        <li>Merge multiple devices from same users into one user</li>
      </ul>
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
      showLibrary: false
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
      console.log("editNameOfRoomType()");
    }
  }
}
</script>