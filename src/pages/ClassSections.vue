<template>
  <v-app>
    <v-navigation-drawer app width="300" permanent>
      <v-app-bar class="mb-4">
        <img src="/logo.png" @click="$router.push('/')" height="40" class="pl-2" style="cursor: pointer;"/>

        <v-toolbar-title v-if="mitClass" :class="['headline', 'ml-2']">
          {{ mitClass.name }}
        </v-toolbar-title>
      </v-app-bar>

      <v-list-item v-for="roomType in roomTypes" :key="roomType.id"
        :to="`/class/${mitClass.id}/section/${roomType.id}`"
      >
        {{ roomType.name }}
      </v-list-item>  

      <!-- TODO: actually put some action buttons on here -->
      <BasePopupButton v-if="SUPER_USER_EMAILS.includes(user.email)"
        :inputFields="['roomTypeName']" 
        @action-do="({ roomTypeName }) => createNewRoomType(roomTypeName)"
      >
        <template v-slot:activator-button="{ on }">
          <v-btn v-on="on">Create new space</v-btn>
        </template>
      </BasePopupButton>
    </v-navigation-drawer>
  </v-app>
</template>

<script>
import { mapState } from "vuex"; 
import { getRandomId } from "@/helpers.js";
import BasePopupButton from "@/components/BasePopupButton.vue";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import { SUPER_USER_EMAILS } from "@/CONSTANTS.js";
import db from "@/database.js";
import firebase from "firebase/app";
import "firebase/firestore"; 

export default {
  components: {
    BasePopupButton
  },
  mixins: [
    DatabaseHelpersMixin
  ],
  data () {
    return {
      SUPER_USER_EMAILS,
      roomTypes: []
    };
  },
  computed: {
    ...mapState([
      "user",
      "mitClass"
    ]),
    classDocRef () {
      return db.doc(`classes/${this.$route.params.class_id}`);
    }
  },
  async created () {
    this.updateRoomTypes();
  },
  methods: {
    async createNewRoomType (roomTypeName) {
      await this.classDocRef.collection("roomTypes").add({
        name: roomTypeName
      });
      this.updateRoomTypes(); 
    },
    async updateRoomTypes () {
      this.roomTypes = await this.$_getCollection(
        this.classDocRef.collection("roomTypes")
      ); 
    }
  }
}
</script>