<template>
  <!-- Display announcement -->
  <v-dialog v-model="isDisplayingAnnouncement" max-width="500px">
    <v-card v-if="announcement">
      <v-card-title class="headline">
        {{ announcement.author.firstName }}
        made an announcement...
      </v-card-title>
      <v-card-text>
        <h2>{{ announcement.message }}</h2>
      </v-card-text>
      <v-card-actions>
        <v-spacer/>
        <v-btn @click="isDisplayingAnnouncement = false" color="accent darken-1" text>
          CLOSE
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  props: {
    roomDoc: {
      type: Object,
      required: true
    }
  },
  data () {
    return {
      announcement: null,
      isDisplayingAnnouncement: false,
    };    
  },
  watch: {
    "roomDoc.announcementCounter" (newVal) {
      console.log("changed =", newVal)
      this.announcement = {
        message: this.roomDoc.announcement.message,
        author: this.roomDoc.announcement.author
      };
      this.isDisplayingAnnouncement = true; 
      console.log("new announcement =", this.announcement);
    }
  }
}
</script>