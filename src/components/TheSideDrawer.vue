<template>
  <v-card style="zIndex:6">
    <v-navigation-drawer
      :value="value"
      @input="newValue => $emit('input', newValue)"
      app clipped
    >
      <v-list class="pt-0">
        <v-list-item-group>
          <v-list-item @click="$router.push(`/${classId}/room/${classId}`)" color="accent lighten-1">
            <v-list-item-icon>
              <v-icon>phone_in_talk</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Realtime board</v-list-item-title>
              <template v-for="(member, i) in room.members">
                <div style="display: flex;" :key="i">
                  <v-icon color="orange">person</v-icon>
                  <p class="pl-4 pt-4">
                    {{ member.firstName }}
                  </p>
                </div>
              </template>
            </v-list-item-content>
          </v-list-item>

          <v-list-item @click="$router.push(`/${classId}/posts`)" color="accent lighten-1">
            <v-list-item-icon>
              <v-icon>post_add</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>New post</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <div v-for="post in posts" :key="post.id">
            <v-list-item @click="$router.push(`/${classId}/posts/${post.id}`)" color="accent lighten-1" :key="post.id">
              <v-list-item-content>
                <v-list-item-subtitle class="text--primary" v-text="post.title"/>
                <v-list-item-subtitle v-text="displayDate(post.date)"/>
              </v-list-item-content>
            </v-list-item>
            <v-divider></v-divider>
          </div>
        </v-list-item-group>
      </v-list>
    </v-navigation-drawer>
  </v-card>
</template>

<script>
import moment from "moment";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js"

export default {
  props: {
    value: Boolean
  },
  mixins: [DatabaseHelpersMixin],
  data () {
    return {
      posts: [],
      room: {
        members: []
      },
      unsubscribeRoomListener: null,
      unsubscribePostsListener: null
    }
  },
  computed: {
    classId () { return this.$route.params.class_id; }
  },
  async created () {
    this.$root.$emit("open-drawer");
    const roomRef = await this.$_getDocRef(`rooms/${this.classId}`)
    let postsRef = await this.$_getCollectionRef(`classes/${this.classId}/posts`);
    postsRef = postsRef.orderBy("date", "desc").limit(50);
    this.unsubscribeRoomListener = await this.$_dbMixin_listenToDoc(roomRef, this, "room");
    this.unsubscribePostsListener = await this.$_dbMixin_listenToDocs(postsRef, this, "posts");;
  },
  destroyed () {
    this.unsubscribeRoomListener();
    this.unsubscribePostsListener();
  },
  methods: {
    displayDate (date) {
      return moment(date).format('MMM Do, h:mm a');
    }
  }
};
</script>