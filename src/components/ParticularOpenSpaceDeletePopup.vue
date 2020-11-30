<template>
  <v-dialog :value="isDeletePopupOpen" width="500px">
    <v-card>
      <v-card-title>
        Delete this open space
      </v-card-title>    

      <v-card-text>
        Are you sure you want to delete this open space, as well as all the rooms that it contains?
        <v-text-field v-model="whatUserTyped" label="Type 'CONFIRM DELETE'"/>
      </v-card-text>

      <v-card-actions>
        <v-spacer/>
        <v-btn @click="$emit('change', false)">CANCEL</v-btn>
        <v-btn :disabled="! (whatUserTyped === 'CONFIRM DELETE')" @click="deleteRoomType(); $emit('change', false);" color="accent">
          Delete 
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import db from "@/database.js"; 

export default {
  props: {
    isDeletePopupOpen: {
      type: Boolean,
      required: true
    }
  },
  data () {
    return {
      whatUserTyped: ""
    };
  },
  methods: {
    async deleteRoomType () {
      const { class_id, section_id } = this.$route.params; 
      // redirect to lobby first so ParticularOpenSpace does not listen to a deleted document
      this.$router.push(`/class/${class_id}/section/${class_id}`);

      const roomTypeRef = db.doc(`classes/${class_id}/roomTypes/${section_id}`);
      const roomsRef = db.collection(`classes/${class_id}/rooms`).where("roomTypeID", "==", section_id);
      await Promise.all([
        roomTypeRef.delete(),
        roomsRef.get().then(async results => {
          const individualDeleteRequests = []; 
          for (const doc of results.docs) {
            individualDeleteRequests.push(
              roomTypeRef.collection("rooms").doc(doc.id).delete()
            );
          }
          await Promise.all(individualDeleteRequests)
        })
      ]); 
    }
  }
};
</script>