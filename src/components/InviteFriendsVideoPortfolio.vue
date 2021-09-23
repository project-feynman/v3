<template>
  <div>
    <div v-if="hisOrHerVideos === null">
      Fetching...
    </div>

    <template v-else> 
      <v-list-item v-for="video of hisOrHerVideos" :key="video.id" 
        @click="redirectToRoomOfVideo(video)"
        dense
      >
        <v-list-item-title>
          {{ video.title }}
        </v-list-item-title>
        <v-list-item-subtitle>
          {{ video.views }} views
        </v-list-item-subtitle>
      </v-list-item>

    <!-- 
      <div v-for="video of hisOrHerVideos" :key="video.id"> 
        <div>Title: {{ video.title }}</div>
        <div>Views: {{ video.views }}</div>
      </div> -->
    </template>
  </div>
</template>

<script>
import DatabaseHelpersMixin from '@/mixins/DatabaseHelpersMixin.js'
import db from '@/database.js'
import { mapState } from 'vuex'

export default {
  mixins: [
    DatabaseHelpersMixin
  ],
  props: {
    personID: {
      type: String,
      required: true
    }
  },
  computed: {
    ...mapState([
      'user',
      'mitClass'
    ])
  },
  data () {
    return {
      hisOrHerVideos: null
    }
  },
  created () {
    // the blackboards are within the class
    // so you also want to check if it has a creator ID
    this.$_bindVarToDB({
      varName: 'hisOrHerVideos',
      dbRef: db.collection(`/classes/${this.mitClass.id}/blackboards`)
        .where('creatorUID', '==', this.personID),
      component: this
    })
  },
  methods: {
    redirectToRoomOfVideo ({ roomID }) {
      console.log('redirectToRoomOfVideo()')
      // NOTE: mutations might happen to $route variables
      const { class_id, section_id } = this.$route.params;
      this.$router.push(`/class/${class_id}/section/${section_id}/room/${roomID}`)
    }
  }
}
</script>
