<template>
  <v-dialog v-model="isRenamePopupOpen" width="500px">
    <v-card>
      <v-card-title>
        Rename this area
      </v-card-title>
      <v-card-text>
        <v-text-field placeholder="Enter the new name..." v-model="newRoomTypeName"/>
      </v-card-text>
    
      <v-card-actions>
        <v-spacer/>
        <v-btn @click="$emit('change', false)">CANCEL</v-btn>
        <v-btn @click="renameRoomType(); $emit('change', false);" color="accent">
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import db from "@/database.js"; 

export default {
  props: {
    isRenamePopupOpen: {
      type: Boolean,
      required: true
    },
    areaID: {
      type: String,
      required: true
    }
  },
  data () {
    return {
      newRoomTypeName: ""
    };
  },
  methods: {
    async renameRoomType () {
      const { class_id } = this.$route.params; 
      const ref = db.doc(`classes/${class_id}/roomTypes/${this.areaID}`);
      await ref.update({
        name: this.newRoomTypeName
      });
      this.newRoomTypeName = ""; 
      document.location.reload() // so the website refetches the updated areaDocs
    }
  }
};
</script>