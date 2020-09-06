<template>
  <portal to="side-drawer">
    <v-list>
      <v-list-item v-for="roomType in roomTypes" :key="roomType.id"
        append :to="(`section/${roomType.id}`)"
      >
        <v-list-item-content>{{ roomType.name }}</v-list-item-content>

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

      <div v-if="roomTypes.length !== 0">
        <BasePopupButton actionName="Create new open space"
          :inputFields="['name']" 
          @action-do="({ name }) => createNewRoomType(name)"
        >
          <template v-slot:activator-button="{ on }">
            <BaseButton :on="on" icon="mdi-plus" block outlined color="grey">
              New space
            </BaseButton>
          </template> 
        </BasePopupButton>
      </div>
    </v-list>
  </portal>
</template>

<script>
import db from "@/database.js"; 
import { getRandomId } from "@/helpers.js"; 
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import BasePopupButton from "@/components/BasePopupButton.vue"; 
import BaseButton from "@/components/BaseButton.vue";
import SmallAppBar from "@/components/SmallAppBar.vue";
import { mapState, mapGetters } from "vuex";

export default {
  name: "AllOpenSpaces",
  mixins: [
    DatabaseHelpersMixin
  ],
  components: {
    BasePopupButton,
    BaseButton,
    SmallAppBar
  },
  data () {
    return {
      roomTypes: [],
      unsubscribeRoomTypesListener: null
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