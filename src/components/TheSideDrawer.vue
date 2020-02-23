<template>
  <v-card style="zIndex:6">
    <v-navigation-drawer :value="value" @input="newVal => $emit('input', newVal)" app clipped>
      <v-list class="pt-0">
        <v-list-item-group>
          <!-- Realtime board -->
          <v-list-item @click="$router.push(`/${classId}/room/${classId}`)" color="accent lighten-1">
            <v-list-item-icon>
              <v-icon>phone_in_talk</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Realtime board</v-list-item-title>
              <!-- <template v-for="(member, i) in room.members">
                <div style="display: flex;" :key="i">
                  <v-icon color="orange">person</v-icon>
                  <p class="pl-4 pt-4">
                    {{ member.firstName }}
                  </p>
                </div>
              </template> -->
            </v-list-item-content>
          </v-list-item>
          <!-- New post -->
          <v-list-item @click="$router.push(`/${classId}/posts/new`)" color="accent lighten-1">
            <v-list-item-icon>
              <v-icon>post_add</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>New post</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          <!-- Tutorial post -->
          <v-list-item @click="$router.push(`/${classId}/posts/tutorial`)" 
            color="accent lighten-1" :key="tutorialPost.id"
          >
            <v-list-item-content>
              <v-list-item-subtitle class="text--primary" v-text="tutorialPost.title"/>
              <v-list-item-subtitle v-text="displayDate(tutorialPost.date)"/>
            </v-list-item-content>
          </v-list-item>
          <!-- Class posts -->
          <v-list-item v-for="(post, i) in posts" :key="post.id + i"
            @click="$router.push(`/${classId}/posts/${post.id}`)" color="accent lighten-1"
          >
            <v-list-item-content>
              <v-list-item-subtitle class="text--primary" v-text="post.title"/>
              <v-list-item-subtitle v-text="displayDate(post.date)"/>
            </v-list-item-content>
          </v-list-item>
        </v-list-item-group>
      </v-list>
    </v-navigation-drawer>
  </v-card>
</template>

<script>
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js"
import moment from "moment";
import db from "@/database.js";

export default {
  props: { value: Boolean },
  mixins: [DatabaseHelpersMixin],
  data () {
    return {
      posts: [],
      tutorialPost: {},
      room: { members: [] },
      unsubscribeRoomListener: null,
      unsubscribePostsListener: null
    }
  },
  computed: { classId () { return this.$route.params.class_id; } },
  async created () {
    this.$root.$emit("open-drawer");
    const roomRef = db.doc(`rooms/${this.classId}`);
    const tutorialPostRef = db.doc(`classes/FVdgjuywaFgxvyylISt2/posts/r8mhnrhd9xgt0rfberrcr`);
    const postsRef = db.collection(`classes/${this.classId}/posts`);
    const postsQuery = postsRef.orderBy("date", "desc").limit(50);
    this.tutorialPost = await this.$_getDoc(tutorialPostRef);
    this.unsubscribeRoomListener = await this.$_listenToDoc(roomRef, this, "room");
    this.unsubscribePostsListener = await this.$_listenToCollection(postsQuery, this, "posts");;
  },
  destroyed () {
    this.unsubscribeRoomListener();
    this.unsubscribePostsListener();
  },
  methods: { displayDate (date) { return moment(date).format('MMM Do, h:mm a'); } }
};
</script>