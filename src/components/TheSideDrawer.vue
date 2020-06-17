<template>
  <!-- Commented out z-index so dropdown menus will show, but now tabs are submerged-->
  <v-card >
    <v-navigation-drawer 
      :value="value" 
      @input="newVal => $emit('input', newVal)" 
      app 
      clipped 
      width="350"
      class="the-side-drawer"
    >
      <!-- <v-btn text :to="(`/class/${classId}`)" block large color="accent" class="my-1">
        <v-icon class="pr-2">mdi-home</v-icon> 
        Overview
      </v-btn> -->
      <v-tabs v-model="activeTab"
        grow
        active-class="accent--text"
        class="side-tabs"
        slider-color="accent"
      >
        <v-tab key="Forum" data-qa="forum-tab">Archive</v-tab>
        <!-- Require log-in to use real-time boards -->
        <v-tab :disabled="!user" key="Blackboard" data-qa="blackboard-tab">Lounges</v-tab>
      </v-tabs>
      <v-tabs-items v-model="activeTab">
        <v-tab-item key="Forum">
          <v-list class="py-0">
            <!-- Requrie log-in to create new posts -->
            <v-list-item 
              :disabled="!user"
              :to="(`/class/${classId}/posts/new`)" 
            >
              <v-list-item-icon>
                <v-icon>mdi-plus</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>New Post</v-list-item-title>
              </v-list-item-content>
            </v-list-item> 
          </v-list>
          <!-- File Explorer -->
          <FileExplorer/>

        </v-tab-item>
        <!-- Can't use real-time blackboards unless user is logged in -->
        <v-tab-item v-if="user" key="Blackboard">
          <!-- <v-btn v-if="blackboards"
            outlined
            large
            block
            :disabled="blackboards.length > 20" 
            @click="createBlackboard()"
            color="secondary"
          >
            <v-icon class="pr-2">mdi-plus</v-icon>
            CREATE BLACKBOARD
          </v-btn> -->
          <v-list class="pt-0">
            <v-list-item 
              :to="(`/class/${classId}/room/center-table`)"
              color="accent"
              class="blackboard-item"
              active-class="active-blackboard"
            >
              MAIN LOBBY ({{ centerTableParticipants.length }} active)
            </v-list-item>
            <template v-for="(blackboard, i) in blackboards">
              <v-list-item
                :to="(`/class/${classId}/room/${blackboard.id}`)"
                :key="blackboard.id"
                color="accent"
                class="blackboard-item"
                active-class="active-blackboard"
              >
                <v-list-item-content v-if="blackboard.participants">
                  <v-list-item-title>
                    Lounge {{ i }}
                    <span class="active-count accent--text">({{ blackboard.participants.length }} active)</span>
                    <h2 v-if="blackboard.status">{{ blackboard.status }}</h2>
                  </v-list-item-title>
                  <div class="active-blackboard-users pl-4 pt-2">
                    <template v-for="(participant, i) in blackboard.participants">
                      <div class="d-flex align-center py-2" :key="i">
                        <v-icon>mdi-account</v-icon>
                        <div :class="['pl-1', 'col', 'py-0', participant.uid === user.uid ? 'font-weight-bold':'']">
                          {{ participant.firstName }}
                        </div>
                        <v-btn 
                          v-if="user.uid === participant.uid" 
                          @click="toggleHelpSignal()"  
                          color="accent lighten-1"
                          :outlined="true"
                          rounded
                          style="margin:3px">
                          <v-icon>mdi-account-alert</v-icon>
                          <!-- Signal For Help -->
                        </v-btn> 
                        <v-btn v-if="user.uid === participant.uid" 
                          @click="toggleMic()" 
                          :color="isMicOn ? 'accent' : 'accent lighten-1'" 
                          :outlined="isMicOn" 
                          rounded
                        >
                          <v-icon class="">{{ isMicOn ? 'mdi-microphone': 'mdi-microphone-off' }}</v-icon>
                        </v-btn>
                      </div>
                    </template>
                  </div>
                </v-list-item-content>
              </v-list-item>
              <v-divider v-if="i + 1 < blackboards.length" :key="i"></v-divider>
            </template>
          </v-list>
        </v-tab-item>
      </v-tabs-items>
    </v-navigation-drawer>
  </v-card>
</template>

<script>
import FileExplorer from "@/components/FileExplorer.vue";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import { tutorial } from "@/CONSTANTS.js";
import { displayDate } from "@/helpers.js";
import db from "@/database.js";
import { mapState } from "vuex";

export default {
  props: {
    value: Boolean
  },
  mixins: [
    DatabaseHelpersMixin
  ],
  components: {
    FileExplorer
  },
  data () {
    return {
      posts: [],
      blackboards: [],
      snapshotListeners: [],
      isMicOn: false,
      activeTab: this.$route.params.room_id ? 1 : 0,
      centerTableParticipants: []
    }
  },
  computed: { 
    ...mapState([
      "user",
      "blackboardRoom"
    ]),
    classId () { 
      return this.$route.params.class_id; 
    }
  },
  async created () {
    const postsRef = db.collection(`classes/${this.classId}/posts`);
    const postsQuery = postsRef.orderBy("date", "desc").limit(100);
    const blackboardsRef = db.collection(`classes/${this.classId}/blackboards`);
    const participantsRef = db.collection(`classes/${this.classId}/participants`);

    this.$_listenToCollection(blackboardsRef, this, "blackboards").then(snapshotListener => {
      this.snapshotListeners.push(snapshotListener);
    });
    this.$_listenToCollection(participantsRef, this, "centerTableParticipants").then(snapshotListener => {
      this.snapshotListeners.push(snapshotListener);
    });

    // this.$_listenToCollection(postsQuery, this, "posts").then((snapshotListener) => {
    //   this.snapshotListeners.push(snapshotListener);
    // });

    this.$root.$on("leftRoom", () => this.isMicOn = false);
  },
  destroyed () {
    for (const detachListener of this.snapshotListeners) {
      detachListener();
    }
  },
  methods: { 
    displayFullPost (post) {
      const { SearchBar } = this.$refs;
      this.$router.push(`/class/${this.classId}/posts/${post.id}`);
      SearchBar.reset();
      SearchBar.blur();
    },
    createBlackboard () {
      const blackboardsRef = db.collection(`classes/${this.classId}/blackboards`);
      const newBlackboard = blackboardsRef.add({
        participants: []
      });
    },
    displayDate (dateString) { 
      return displayDate(dateString);
    },
    toggleMic () {
      this.isMicOn = !this.isMicOn;
      this.$root.$emit('toggleMic', this.isMicOn);
    },
    async toggleHelpSignal () {
      const roomRef = db.doc(`classes/${this.classId}/blackboards/${this.$route.params.room_id}`);
      roomRef.update({
        status: this.blackboardRoom.status === "help!" ? "" : "help!"
      }); 
    }
  }
};
</script>

<style scoped>
.blackboard-item .active-count {
  font-size:0.85em;
}
.blackboard-item .active-blackboard-users {
  display:none;
}
.blackboard-item.active-blackboard .active-count {
  display:none;
}
.blackboard-item.active-blackboard .active-blackboard-users {
  display:block;
}
.side-tabs {
  position: sticky;
  top: 0;
  z-index: 1;
}
.the-side-drawer {
  z-index: 10;
  max-width: 75%;
}
</style>
