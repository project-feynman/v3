<template>
  <v-card style="zIndex:10">
    <v-navigation-drawer :value="value" @input="(newVal) => $emit('input', newVal)" app clipped width="350">
      <!-- <v-btn text :to="(`/class/${classId}`)" block large color="accent" class="my-1">
        <v-icon class="pr-2">mdi-home</v-icon> 
        Overview
      </v-btn> -->
      <v-tabs
        v-model="activeTab"
        grow
        active-class="orange--text"
        class="side-tabs"
        slider-color="accent"
      >
        <v-tab key="Forum">Q&A Forum</v-tab>
        <v-tab key="Blackboard">Realtime Boards</v-tab>
      </v-tabs>
      <v-tabs-items v-model="activeTab">
        <v-tab-item key="Forum">
          <v-list class="pt-0">
                 <v-list-item :to="(`/class/${classId}/posts/new`)" color="accent">
            <v-list-item-icon>
              <v-icon>mdi-plus-box</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Start a new post</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
            <template v-for="(post, i) in posts">
              <v-list-item 
                :key="post.id + i"
                :to="`/class/${classId}/posts/${post.id}`"
                three-line 
                color="accent"
              >
                <v-list-item-content>
                  <v-list-item-subtitle class="text--primary" v-text="post.title || '(No title)'"/>
                  <v-list-item-subtitle v-text="displayDate(post.date)"/>
                </v-list-item-content>
              </v-list-item>
              <v-divider
                v-if="i + 1 < posts.length"
                :key="i"
              ></v-divider>
            </template>
          </v-list>
        </v-tab-item>
        <v-tab-item key="Blackboard">
          <v-btn v-if="blackboards"
            outlined
            large
            block
            :disabled="blackboards.length > 5" 
            @click="createBlackboard()"
            color="secondary"
          >
            <v-icon class="pr-2">mdi-plus</v-icon>
            CREATE BLACKBOARD
          </v-btn>
          <v-list class="pt-0">
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
                    Blackboard {{ i }}
                    <span class="active-count accent--text">({{ blackboard.participants.length }} active)</span>
                  </v-list-item-title>
                  <div class="active-blackboard-users pl-4 pt-2">
                    <template v-for="(member, i) in blackboard.participants">
                      <div class="d-flex align-center py-2" :key="i">
                        <v-icon>mdi-account</v-icon>
                        <div :class="['pl-1', 'col', 'py-0', member.uid === user.uid ? 'font-weight-bold':'']">
                          {{ member.firstName }}
                        </div>
                        <v-btn v-if="user.uid === member.uid" 
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
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js"
import { tutorial } from "@/CONSTANTS.js";
import { displayDate } from "@/helpers.js";
import db from "@/database.js";

export default {
  props: {
    value: Boolean,
    mitClass: Object
  },
  mixins: [DatabaseHelpersMixin],
  data () {
    return {
      posts: [],
      blackboards: [],
      tutorialPost: {},
      unsubscribeRoomListener: null,
      unsubscribePostsListener: null,
      isMicOn: false,
      activeTab: "forum"
    }
  },
  computed: { 
    classId () { 
      return this.$route.params.class_id; 
    },
    user () { 
      return this.$store.state.user;
    }
  },
  async created () {
    const roomRef = db.doc(`rooms/${this.classId}`);
    const tutorialPostRef = db.doc(`classes/${tutorial.classId}/posts/${tutorial.postId}`);
    const postsRef = db.collection(`classes/${this.classId}/posts`);
    const postsQuery = postsRef.orderBy("date", "desc").limit(50);
    // this.tutorialPost = await this.$_getDoc(tutorialPostRef);
    
    const blackboardsRef = db.collection(`classes/${this.classId}/blackboards`);
    this.unsubscribeRoomListener = await this.$_listenToDoc(roomRef, this, "room");
    this.unsusbcribeBlackboardsListener = await this.$_listenToCollection(blackboardsRef, this, "blackboards");
    this.unsubscribePostsListener = await this.$_listenToCollection(postsQuery, this, "posts");;
    this.$root.$on('leftRoom', ()=> {this.isMicOn=false});
  },
  destroyed () {
    this.unsubscribeRoomListener();
    this.unsubscribePostsListener();
  },
  methods: { 
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
      this.isMicOn = !this.isMicOn
      this.$root.$emit('toggleMic', this.isMicOn);
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
</style>