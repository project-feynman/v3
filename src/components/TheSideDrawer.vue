<template>
  <v-card style="zIndex:6">
    <v-navigation-drawer
      :value="value"
      @input="newValue => $emit('input', newValue)"
      app clipped
    >
    <v-list>
      <v-list-item-group>
      <v-list-item @click="$router.push(`/${classId}/room/${classId}`)" color="accent lighten-1">
        <v-list-item-icon>
          <v-icon>book</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Realtime board</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item @click="$router.push(`/${classId}/posts`)" color="accent lighten-1">
          <v-list-item-icon>
            <v-icon>book</v-icon>
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
    }
  },
  watch: {
    classId: {
      handler: "fetchPosts",
      immediate: true
    }
  },
  methods: {
    async fetchPosts () {
      this.$root.$emit("open-drawer");
      await this.$binding("posts", this.postsRef);
    },
    displayDate (date) {
      return moment(date).format('MMM Do, h:mm a');
    }
  }
};
</script>