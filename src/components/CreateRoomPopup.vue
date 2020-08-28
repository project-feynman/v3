<template>
    <v-dialog v-model="isCreatePopupOpen" persistent max-width="600px">
        <v-card>
          <v-card-title>
            <span class="headline">
              Create Room
            </span>
          </v-card-title>

          <v-card-text>
            <v-combobox
              v-model="selectedRoomType"
              :items="roomTypes"
              :search-input.sync="selectedRoomType"
              label="Select a room category for your new room or type a new one"
              >
            </v-combobox>
          </v-card-text>

          <v-card-actions>
            <v-spacer/>

            <v-btn @click="closePopup()" color="secondary" text>
              Close
            </v-btn>

            <v-btn @click="createRoom(selectedRoomType)" color="secondary" text>
              Add Room
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
</template>
<script>
export default {
  props : {
    isCreatePopupOpen: Boolean,
    roomTypes: Array
  },
  data () {
    return {
        selectedRoomType: ""
    };
  },
  methods: {
    closePopup () {
      this.$emit('popup-closed')
    },
    createRoom (roomType) {
      this.$emit('create-room', roomType)
    }
  }
}
</script>