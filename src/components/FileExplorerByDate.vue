<template>
    <!--<v-sheet class="pa-4 secondary lighten-3">
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
    </v-sheet>-->
      <!--<v-container>
        <v-row>
          <v-col>
            Group By
          </v-col>
          <v-col cols="auto">
            <v-select
              :items="['Concept', 'Date']"
              v-model="groupBy"
            ></v-select>
          </v-col>
        </v-row>
      </v-container>-->
      
      <v-expansion-panel :id="type">
        <v-expansion-panel-header>
          <v-menu bottom right>
            <template v-slot:activator="{ on }">
              <v-btn icon v-on="on" class="expansion-options">
                <v-icon>mdi-dots-vertical</v-icon>
              </v-btn>
            </template>

            <v-list>
              <v-list-item @click="groupBy='date'">Group By Date</v-list-item>
              <v-list-item @click="groupBy='concept'">Group By Tags</v-list-item>
              <v-list-item>
                <BasePopupButton actionName="Add a New Folder" 
                  :inputFields="['Folder Name', 'Parent']"
                  @action-do="(payload) => addNewFolder(payload)"
                >
                  <template v-slot:activator-button="{ on }">
                    <v-btn v-on="on" color="secondary" text>Add Folder</v-btn>
                  </template>
                </BasePopupButton>
              </v-list-item>
              
            </v-list>
          </v-menu>
          <h3 class="expansion-title">{{ title }}</h3>
          <v-btn
            :disabled="!user"
            :to="(`/class/${classId}/posts/new`)" 
            outlined
            color="accent"
          >
            <v-icon left>mdi-plus</v-icon>New {{ type }}
          </v-btn>
        </v-expansion-panel-header>
        <v-expansion-panel-content class="px-0">
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
                              @click="movePostToFolder(item, tagName.id, closePopup)"
                              :key="tagName.id" 
                              color="accent" 
                              class="ma-2">
                              {{ tagName.name }}
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
            <template v-slot:append="{ item }">
              <v-menu v-if="user && item.isFolder" bottom right>
                <template v-slot:activator="{ on }">
                  <v-btn icon v-on="on">
                    <v-icon>mdi-dots-vertical</v-icon>
                  </v-btn>
                </template>

                <v-list>
                  <v-list-item>
                    <BasePopupButton actionName="Rename Folder" 
                      :inputFields="['New Name']"
                      @action-do="(payload) => renameTag(payload, item)"
                    >
                      <template v-slot:activator-button="{ on }">
                        <v-btn v-on="on" color="accent" text>Rename</v-btn>
                      </template>
                    </BasePopupButton>
                  </v-list-item>
                </v-list>
              </v-menu>
            </template>
          </v-treeview>
          
        </v-expansion-panel-content>
      </v-expansion-panel>
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
import moment from "moment";
import { Drag, Drop } from 'vue-drag-drop';

export default {
  props: {
    title: String,
    type: String,
  },
  mixins: [
    DatabaseHelpersMixin
  ],
  components: {
    BasePopupButton,
    Drag,
    Drop
  },
  computed: {
    classId () { 
      return this.$route.params.class_id; 
    },
    groupBy: {
      get: function () {
        return (this.type==='note') ? 'concept' : 'date';
      },
      set: function (newVal) {
        if (newVal==="concept") this.groupByConcept();
        else this.groupByDate();
      }
    },
    ...mapState([
      "user",
      "mitClass"
    ])
  },
  data: () => ({
    dateList: [],
    organizedPosts: [],
    conceptGroups: [],
    dateGroups: [],
    search: null,
    incrementKeyToDestroy: 0,
    openedFoldersIndices: [],
    snapshotListeners: []
  }),
  watch: {
    mitClass: {
      immediate: true,
      deep: true,
      handler : async function () {
        // this.tagsArrayToObject();
        if (this.groupBy==="concept") this.groupByConcept();
        else this.groupByDate();
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
    async renameTag (payload, tag) {
      const i = this.mitClass.tags.findIndex(({name}) => name ==tag.name);
      this.mitClass.tags[i].name=payload['New Name']
      console.log(this.mitClass)
      const postRef = db.doc(`classes/${this.$route.params.class_id}`);
      await postRef.update({
        tags: this.mitClass.tags,
      });
      this.$root.$emit("show-snackbar", "Successfully renamed the folder.");
    },
    async addNewFolder (payload) {
      let parent = null;
      let error = '';
      console.log('parent '+ payload['Parent']);
      console.log('is there one?'+ payload['Parent']=='')
      if (payload['Parent']) {
        try {
          parent = this.mitClass.tags.find(({name}) => name == payload['Parent']).id;
        } catch (e) {
          error = 'But could not find the parent specified.'
        } 
      }

      this.mitClass.tags.push({
        id: Math.random().toString(16).slice(2),
        name: payload['Folder Name'],
        parent: parent
      });
      await db.doc(`classes/${this.$route.params.class_id}`).update({
        tags: this.mitClass.tags
      });
      this.$root.$emit("show-snackbar", `Successfully added folder. ${error}`);
    },
    async groupByDate () {
      console.log('grouping by date');
      this.organizedPosts = this.dateGroups;
      if (this.dateGroups.length!==0) return;
      db.collection(`classes/${this.$route.params.class_id}/posts`).get().then((querySnapshot)=> {
        querySnapshot.forEach(doc => {
          this.dateList.push(doc.data().date);
        })
        this.foldersFromDates();
      });

      console.log('current length '+this.organizedPosts.length)
    },
    async groupByConcept () {
      console.log('grouping by concept');
      this.organizedPosts = this.conceptGroups;
      if (!this.mitClass || this.conceptGroups.length!==0) return; 
      let i = 0;
      let tags = this.mitClass.tags;
      tags.sort((a,b) => a.parent === null ? 1 : (b.parent === null ? 0 : -1));
      for (const tag of this.mitClass.tags) {
        const tag_object = {
          id: tag.id,
          name: tag.name,
          isFolder: true,
          children: [],
          date: "999999999999999999999999999999999999999", // so it'll always appear at the top
        };
        if (tag.parent===null) {
          this.conceptGroups.push(tag_object);
        } else {
          const n = this.conceptGroups.findIndex(({id}) => id == tag.parent);
          if (n===-1) { // In case parent doesn't exist (maybe deleted or sth)
            this.conceptGroups.push(tag_object);
          }
        }
        
        i += 1;
      }
      this.fetchPostsWithNoTags(); 
    },
    async fetchPostsWithNoTags () {
      const query = db.collection(`classes/${this.$route.params.class_id}/posts`).where("tags", "==", []);
      this.bindUntaggedPostsToDatabase(query);
    },
    async fetchRelevantPosts (item) {
      let postsQuery;
      if (this.groupBy === 'concept') {
        const tag_id = this.mitClass.tags.find(({name}) => name === item.name).id
        postsQuery = db.collection(`classes/${this.$route.params.class_id}/posts`).where("tags", "array-contains", tag_id);
      } else {
        const startDate = new Date(item.name.split('-')[0]).toISOString()
        const endDate = new Date(item.name.split('-')[1]).toISOString()
        postsQuery = db.collection(`classes/${this.$route.params.class_id}/posts`).where("date", ">=", startDate).where("date", "<=", endDate);
      }

      /* check if the query results is non-empty, otherwise `onSnapshot` will never trigger 
        and the promise will never be resolved (and the browser freezes) */
      const results = await postsQuery.get();
      console.log('getting');
      if (results.empty) return;
      console.log('not empty')
      await this.bindArrayToDatabase(item.children, item.id, postsQuery);

      // because we destroy the tree everytime the data updates, we need to ensure the opened folders stay open
      // this.mitClass.tags.forEach((tag, i) => {
      //   if (item.name === tag) { 
      //     this.openedFoldersIndices.push(i);
      //   }
      // });
      // This is a temporary solution, and needs to be changed in the future
      let i;
      if (this.groupBy === 'date') {
        i = this.organizedPosts.findIndex(folder => folder.name === item.name);
      } else {
        i = item.id;
      }
      this.openedFoldersIndices.push(i);
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
    bindArrayToDatabase (array, id, queryRef) {
      return new Promise((resolve) => {
        const snapshotListener = queryRef.onSnapshot((snapshot) => {
          /* we cannot use `array = [];` to reset the array 
             see explanation http://explain.mit.edu/class/mDbUrvjy4pe8Q5s5wyoD/posts/c63541e6-3df5-4b30-a96a-575585e7b181 */
          console.log('before slicing', array.slice());
          array.length = 0; 
          const childrenFolders = this.mitClass.tags.filter(tag => tag.parent === id);
          for (let tag of childrenFolders) {
            array.push({
              id: tag.id,
              name: tag.name,
              isFolder: true,
              children: [],
              date: "999999999999999999999999999999999999999", // so it'll always appear at the top
            });
          }
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
    foldersFromDates () {
      this.dateGroups.length = 0;
      let weekGroups = {}
      this.dateList.sort((a, b) => (a < b) ? 1 : ((a > b) ? -1 : 0)); // First sort the date in reverse chronological order
      this.dateList.forEach( date => {
        date = moment(date)
        const startDay = moment()
          .isoWeekYear(date.year())
          .isoWeek(date.week())
          .startOf('week')
          .format('YYYY MMM D')
        const endDay = moment()
          .isoWeekYear(date.year())
          .isoWeek(date.week())
          .endOf('week')
          .format('YYYY MMM D')
        let week = `${startDay}-${endDay}`;
        if (!weekGroups[week]) {
          weekGroups[week] = 0;
        }
        weekGroups[week]++;
      });
      let i = 0;
      for (var week in weekGroups) {
        this.dateGroups.push({
            id: i,
            name: week,
            isFolder: true,
            children: [],
            date: week.split('-')[0]
          });
        i++;
      }
    },
    displayDate (date) {
      return displayDate(date);
    },
    // A temporary function to convert the tags of a class from array to object when class is loaded
    async tagsArrayToObject () {
      let tags = this.mitClass.tags;
      let newTags = [];
      if (tags.length && typeof tags[0] === 'string') {
        for (let tag of tags) {
          newTags.push({
            id: Math.random().toString(16).slice(2),
            name: tag,
            parent: null
          })
        }
        const classRef = db.doc(`classes/${this.$route.params.class_id}`);
        await classRef.update({
          tags: newTags
        });
        this.mitClass.tags = newTags;
        this.tagPostToTagId(newTags);
      }
    },
    async tagPostToTagId (tags) {
      db.collection(`classes/${this.$route.params.class_id}/posts`).get().then(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
          const postTags = doc.data().tags;
          let tag_ids = [];
          for (let tag of postTags) {
            tag_ids.push(tags.find(({name}) => name ==tag).id);
          }
          doc.ref.update({
              tags: tag_ids
          });
        });
      });
    },
  }
};
</script>

<style scoped>
.v-expansion-panel {
  position: sticky;
  top:0;
  z-index: 2;
}
.v-expansion-panel#question {
  bottom: 0;
}
.v-expansion-panel-header > *:not(.expansion-title) {
  flex: 0 0 auto;
}
.v-expansion-panel.v-expansion-panel--active {
  position: relative;
  z-index: 1;
}
.v-expansion-panel:not(.v-expansion-panel--active) .expansion-options {
  display: none;
}
.v-expansion-panel .v-expansion-panel-header {
  position: sticky;
  top: 0;
  z-index: 5;
  background: #eee;
}
.v-expansion-panel#question .v-expansion-panel-header {
  top: 68px;
}
</style>