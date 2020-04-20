<template>
  <v-card class="mx-auto" max-width="500">
    <v-sheet class="pa-4 secondary lighten-3">
      <v-text-field
        v-model="search"
        label="Search existing posts..."
        dark
        flat
        solo-inverted
        hide-details
        clearable
        clear-icon="mdi-close-circle-outline"
      ></v-text-field>
    </v-sheet>
    <v-card-text>
      <v-treeview
        :items="organizedPosts"
        :search="search"
        :open="openedFoldersIndices"
        :load-children="(folder) => fetchRelevantPosts(folder)"
        open-on-click
        :key="incrementKeyToDestroy"
      >
        <template v-slot:prepend="{ item, open }">
          <v-icon v-if="item.isFolder">
            {{ open ? 'mdi-folder-open' : 'mdi-folder' }}
          </v-icon> 
          <!-- cannot move/edit posts if not logged in -->
          <v-menu v-else-if="user" bottom right>
            <template v-slot:activator="{ on }">
              <v-btn icon v-on="on">
                <v-icon>mdi-dots-vertical</v-icon>
              </v-btn>
            </template>

            <v-list>
              <v-list-item>
                <BasePopupButton>
                  <template v-slot:activator-button="{ on }">
                    <v-btn v-on="on" color="secondary" text>
                      MOVE
                    </v-btn>
                  </template>
                  <template v-slot:popup-content="{ closePopup }">
                    <h1>Select a folder</h1>
                    <template v-if="mitClass">
                      <div class="text-center mt-5">
                        <v-chip v-for="tagName in mitClass.tags" 
                          @click="movePostToFolder(item, tagName, closePopup)"
                          :key="tagName" 
                          color="accent" 
                          class="ma-2">
                          {{ tagName }}
                        </v-chip>
                      </div>
                    </template>
                  </template>
                </BasePopupButton>
              </v-list-item>
              <v-list-item>
                <BasePopupButton actionName="Rename Post" 
                  :inputFields="['New Name']"
                  @action-do="(payload) => renamePost(payload, item)"
                >
                  <template v-slot:activator-button="{ on }">
                    <v-btn v-on="on" color="secondary" text>RENAME</v-btn>
                  </template>
                </BasePopupButton>
              </v-list-item>
            </v-list>
          </v-menu>
        </template>
        <template v-slot:label="{ item }">
          <v-list-item two-line v-if="!item.isFolder" :to="`/class/${mitClass.id}/posts/${item.id}`">
            <v-list-item-content>
              <v-list-item-subtitle v-text="item.name"></v-list-item-subtitle>
              <v-list-item-subtitle v-text="displayDate(item.date)"></v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
          <v-list-item v-else>
            {{ item.name }}
          </v-list-item>
        </template>
      </v-treeview>
    </v-card-text>
  </v-card>
</template>

<script>
// TODO: Fix search; Allow user to edit; Fix the strange nesting
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js"; 
import BasePopupButton from "@/components/BasePopupButton.vue";
import { displayDate } from "@/helpers.js";
import db from "@/database.js";
import firebase from "firebase/app";
import "firebase/firestore";
import { mapState } from "vuex";

export default {
  mixins: [
    DatabaseHelpersMixin
  ],
  components: {
    BasePopupButton
  },
  computed: mapState([
    "user",
    "mitClass"
  ]),
  data: () => ({
    organizedPosts: [],
    search: null,
    incrementKeyToDestroy: 0,
    openedFoldersIndices: [],
    snapshotListeners: []
  }),
  watch: {
    mitClass: {
      immediate: true,
      handler () {
        if (!this.mitClass) return; 
        let i = 0;
        for (const tag of this.mitClass.tags) {
          this.organizedPosts.push({
            id: i,
            name: tag,
            isFolder: true,
            children: [],
            date: "999999999999999999999999999999999999999" // so it'll always appear at the top
          });
          i += 1;
        }
        this.fetchPostsWithNoTags(); 
      }
    }
  },
  beforeDestroy () {
    for (const detachListener of this.snapshotListeners) {
      detachListener();
    }
  },
  methods: {
    async renamePost (payload, post) {
      const postRef = db.doc(`classes/${this.$route.params.class_id}/posts/${post.id}`);
      await postRef.update({
        title: payload["New Name"]
      });
      this.$root.$emit("show-snackbar", "Successfully renamed the post.");
    },
    async fetchPostsWithNoTags () {
      const query = db.collection(`classes/${this.$route.params.class_id}/posts`).where("tags", "==", []);
      this.bindUntaggedPostsToDatabase(query);
    },
    async fetchRelevantPosts (item) {
      const postsQuery = db.collection(`classes/${this.$route.params.class_id}/posts`).where("tags", "array-contains", item.name);

      /* check if the query results is non-empty, otherwise `onSnapshot` will never trigger 
        and the promise will never be resolved (and the browser freezes) */
      const results = await postsQuery.get();
      if (results.empty) return;
      await this.bindArrayToDatabase(item.children, postsQuery);

      // because we destroy the tree everytime the data updates, we need to ensure the opened folders stay open
      this.mitClass.tags.forEach((tag, i) => {
        if (item.name === tag) { 
          this.openedFoldersIndices.push(i);
        }
      });
    },
    async movePostToFolder (post, folder, closePopup) {
      const postRef = db.doc(`classes/${this.$route.params.class_id}/posts/${post.id}`);
      await postRef.update({
        tags: [folder] // a file can only exist in one folder at the time (for now)
      });
      this.$root.$emit("show-snackbar", "Successfully moved post to the specified folder");
      closePopup();
    },
    bindUntaggedPostsToDatabase (queryRef) {
      const snapshotListener = queryRef.onSnapshot((snapshot) => {
        // clear previous data (but don't clear the folders)
        this.organizedPosts.length = this.mitClass.tags.length; 
        snapshot.forEach((doc) => {
          this.organizedPosts.push({
            id: doc.id,
            name: doc.data().title,
            date: doc.data().date
          });
        });
        this.organizedPosts.sort((a, b) => (a.date < b.date) ? 1 : ((a.date > b.date) ? -1 : 0));
        this.incrementKeyToDestroy += 1;
      });
      this.snapshotListeners.push(snapshotListener);
    },
    bindArrayToDatabase (array, queryRef) {
      return new Promise((resolve) => {
        const snapshotListener = queryRef.onSnapshot((snapshot) => {
          /* we cannot use `array = [];` to reset the array 
             see explanation http://explain.mit.edu/class/mDbUrvjy4pe8Q5s5wyoD/posts/c63541e6-3df5-4b30-a96a-575585e7b181 */
          array.length = 0; 
          snapshot.forEach((doc) => {
            array.push({
              id: doc.id,
              name: doc.data().title,
              date: doc.data().date
            });
          });
          array.sort((a, b) => (a.date < b.date) ? 1 : ((a.date > b.date) ? -1 : 0));
          this.incrementKeyToDestroy += 1;
          resolve();
        });
        this.snapshotListeners.push(snapshotListener);
      });
    },
    displayDate (date) {
      return displayDate(date);
    }
  }
};
</script>