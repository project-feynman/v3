<template>
  <v-list>
    <v-list-item v-for="roomType in roomTypes"
      :to="(`/class/${$route.params.class_id}/section/${roomType.id}`)"
      :key="roomType.id"
    >
      {{ roomType.name }}
    </v-list-item>>

    <BasePopupButton @action-do="({ name }) => createNewRoomType(name)">
      <template v-slot:activator-button="{ on }">
        <v-btn v-on="on">New Space</v-btn>
      </template> 
    </BasePopupButton>
  </v-list>
</template>

<script>
/**
 * TODO: each section will be initialized with a common room
 */
import db from "@/database.js"; 
import { getRandomId } from "@/helpers.js"; 
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";

export default {
  mixins: [
    DatabaseHelpersMixin
  ],
  components: {
    BasePopupButton
  },
  data () {
    return {
      roomTypes: [],
      classDocRef: db.collection(`classes/${this.$route.params.class_id}`)
    };
  },
  created () {
    this.$_listenToCollection(
      db.collection(`classes/${this.$route.params.class_id}/roomTypes`), 
      this, 
      "roomTypes"
    );
  },
  methods: {
    /**
     * Create a new roomType, and initialize it with a common room. 
     */
    createNewRoomType (name) {
      // const id = getRandomId(); 
    }
  }
}
</script>