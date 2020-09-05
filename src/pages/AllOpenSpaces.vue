<template>
  <v-app>
    <v-navigation-drawer app permanent width="300">
      <SmallAppBar>
        <BasePopupButton actionName="Create new open space"
          :inputFields="['name']" 
          @action-do="({ name }) => createNewRoomType(name)"
        >
          <template v-slot:activator-button="{ on }">
            <BaseButton :on="on" icon="mdi-plus" color="secondary">New Space</BaseButton>
            <!-- <v-btn v-on="on">New Space</v-btn> -->
          </template> 
        </BasePopupButton>
      </SmallAppBar>

      <v-list>
        <v-list-item v-for="roomType in roomTypes" 
          :to="(`section/${roomType.id}`)"
          append
          :key="roomType.id"
        >
          {{ roomType.name }}
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
  </v-app>
</template>

<script>
import db from "@/database.js"; 
import { getRandomId } from "@/helpers.js"; 
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import BasePopupButton from "@/components/BasePopupButton.vue"; 
import BaseButton from "@/components/BaseButton.vue";
import SmallAppBar from "@/components/SmallAppBar.vue";
import { mapState } from "vuex";

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
     * Create a new roomType, and initialize it with a common room. 
     */
    createNewRoomType (name) {
      const id = getRandomId(); 
      this.classDocRef.collection("rooms").doc(id).set({
        isCommonRoom: true,
        roomTypeID: id
      });

      this.classDocRef.collection("roomTypes").doc(id).set({
        id,
        name
      });
    }
  }
}
</script>