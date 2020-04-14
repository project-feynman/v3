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
        :load-children="(folder) => fetchRelevantPosts(folder)"
        :key="incrementKeyToDestroy"
      >
        <template v-slot:prepend="{ item, open }">
          <v-icon v-if="item.isFolder">
            {{ open ? 'mdi-folder-open' : 'mdi-folder' }}
          </v-icon> 
          <v-menu v-else bottom>
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
                      Move
                    </v-btn>
                  </template>
                  <template v-slot:popup-content="{ closePopup }">
                    <h1>Select a folder</h1>
                    <template v-if="mitClass">
                      <div class="text-center mt-5">
                        <v-chip v-for="tagName in mitClass.tags" 
                          @click="movePostToFolder(item, tagName, closePopup)"
                          :key="tagName" 
                          large
                          color="accent" 
                          class="mx-2">
                          {{ tagName }}
                        </v-chip>
                      </div>
                    </template>
                  </template>
                  <!-- <template v-slot:popup-action-buttons>
                    <v-btn @click="" color="secondary" text>Confirm Move</v-btn>
                  </template> -->
                </BasePopupButton>
              </v-list-item>
              <!-- <v-list-item>
                <BasePopupButton>
                  <template v-slot:activator-button="{ on }">
                    <v-btn v-on="on" color="secondary" text>Delete</v-btn>
                  </template>
                </BasePopupButton>
              </v-list-item> -->
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

export default {
  mixins: [
    DatabaseHelpersMixin
  ],
  components: {
    BasePopupButton
  },
  computed: {
    mitClass () {
      return this.$store.state.mitClass;
    }
  },
  data: () => ({
    organizedPosts: [],
    search: null,
    incrementKeyToDestroy: 0
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
  methods: {
    async fetchPostsWithNoTags () {
      const query = db.collection(`classes/${this.$route.params.class_id}/posts`).where("tags", "==", []);
      this.bindUntaggedPostsToDatabase(query);
    },
    async fetchRelevantPosts (item) {
      const { class_id }  = this.$route.params; 
      const postsQuery = db.collection(`classes/${class_id}/posts`).where("tags", "array-contains", item.name);
      await this.bindArrayToDatabase(item.children, postsQuery);
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
      queryRef.onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const post = {
              id: change.doc.id,
              name: change.doc.data().title,
              date: change.doc.data().date
            };
            this.organizedPosts.push(post);
            this.organizedPosts.sort((a, b) => (a.date < b.date) ? 1 : ((a.date > b.date) ? -1 : 0));
          } else if (change.type === "removed") {
            for (let i = 0; i < this.organizedPosts.length; i++) {
              const post = this.organizedPosts[i];
              if (post.id === change.doc.id) {
                this.organizedPosts.splice(i, 1); // removes `1` element from position `i`
                this.incrementKeyToDestroy += 1; // re-render the tree
              }
            }
          }
        });
      });
    },
    bindArrayToDatabase (array, queryRef) {
      return new Promise((resolve) => {
        queryRef.onSnapshot((snapshot) => {
          const temporaryArray = []; // so we hydrate `array` all at once after we collected each "added" document
          snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
              temporaryArray.push({
                id: change.doc.id,
                name: change.doc.data().title,
                date: change.doc.data().date 
              });
            } else if (change.type === "removed") {
              // below hack is necessary because <treeview> only reacts to `.push()` and not removal operations
              let arrayCopy = [...array];
              arrayCopy = arrayCopy.filter((post) => post.id !== change.doc.id);
              array.length = 0; // empty the array
              array.push(...arrayCopy);
              this.incrementKeyToDestroy += 1;
            }
          });
          array.push(...temporaryArray);
          array.sort((a, b) => (a.date < b.date) ? 1 : ((a.date > b.date) ? -1 : 0));
          resolve();
        });
      })
    },
    displayDate (date) {
      return displayDate(date);
    }
  }
};
</script>