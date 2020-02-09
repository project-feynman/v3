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

          <template v-for="post in posts">
            <div :key="post['.key']">
              <v-list-item @click="$router.push(`/${classId}/posts/${post['.key']}`)" color="accent lighten-1" :key="post['.key']">
                <v-list-item-content>
                  <v-list-item-subtitle class="text--primary" v-text="post.title"/>
                  <v-list-item-subtitle v-text="displayDate(post.date)"/>
                </v-list-item-content>
              </v-list-item>
              <v-divider></v-divider>
            </div>
          </template>
        </v-list-item-group>
      </v-list>
    </v-navigation-drawer>
  </v-card>
</template>

<script>
import db from "@/database.js";
import firebase from "firebase/app";
import "firebase/auth";
import moment from "moment";

export default {
  props: {
    value: Boolean
  },
  data () {
    return {
      posts: [],
      room: {
        members: []
      }
    }
  },
  computed: {
    user () {
      return this.$store.state.user;
    },
    classId () {
      return this.$route.params.class_id;
    },
    postsRef () {
      return db.collection("classes").doc(this.classId).collection("posts").orderBy("date");
    },
    roomRef () {
      return db.collection("rooms").doc(this.classId);
    }
  },
  watch: {
    classId: {
      handler: "syncDataWithDb",
      immediate: true
    }
  },
  methods: {
    async syncDataWithDb () {
      this.$root.$emit("open-drawer");
      this.$binding("posts", this.postsRef);
      this.$binding("room", this.roomRef);
    },
    displayDate (date) {
      return moment(date).format('MMM Do, h:mm a');
    }
  }
};
</script>