<template>
  <div>
    <!-- Exact Search Bar -->
    <!-- <v-sheet class="pa-4 secondary lighten-3">
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
    </v-sheet> -->

        <v-layout>
          <v-flex>
            <ButtonNew @click="groupByDate()" icon="mdi-calendar-range">Group By Date</ButtonNew>
          </v-flex>
          <v-flex>
            <ButtonNew @click="groupByConcept()" icon="mdi-folder">Group By Folders</ButtonNew>
          </v-flex>
          <v-flex>
            <BasePopupButton actionName="Create a New Folder" 
              :inputFields="['Folder Name']"
              @action-do="({ 'Folder Name': name }) => createNewFolder(name)"
            >
              <template v-slot:activator-button="{ on }">
                <ButtonNew :on="on" color="accent" icon="mdi-folder-plus">Create Folder</ButtonNew>
                <!-- <v-btn v-on="on" color="secondary" text>Create Folder</v-btn> -->
              </template>
            </BasePopupButton>
          </v-flex>
          <v-flex>
            <ButtonNew 
              icon="mdi-shape-square-plus"
              :disabled="!user"
              :to="(`/class/${classId}/new?type=${type==='question'? 'question':'post'}`)" 
              color="secondary"
            > 
              New {{ type }}
            </ButtonNew>
          </v-flex>
        </v-layout>

        <v-divider/>

          <v-treeview
            :items="organizedPosts"
            :search="search"
            :open="openedFoldersIndices"
            :load-children="(folder) => fetchRelevantPosts(folder)"
            :key="incrementKeyToDestroy"
            open-on-click
          >
            <template v-slot:prepend="{ item, open }">
              <v-icon v-if="item.isFolder">
                {{ open ? 'mdi-folder-open' : 'mdi-folder' }}
              </v-icon> 
              <v-icon v-else>
                mdi-file-document
              </v-icon>
            </template>

            <template v-slot:label="{ item }">
              <drop class="drop" @drop="handleDrop(item, ...arguments)">
                <drag class="drag" :key="item.id" :transfer-data="{ data: item }">
                  <v-list-item v-if="!item.isFolder" :to="`/class/${mitClass.id}/${type==='question'?'questions':'posts'}/${item.id}`" dense>
                    <v-list-item-subtitle v-text="item.name"/>
                  </v-list-item>
                  <v-list-item v-else dense>
                    <v-list-item-subtitle v-text="item.name"/>
                  </v-list-item>
                </drag>
              </drop>
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
                      @action-do="payload => renameTag(payload, item)"
                    >
                      <template v-slot:activator-button="{ on }">
                        <v-btn v-on="on" color="accent" text>Rename</v-btn>
                      </template>
                    </BasePopupButton>
                  </v-list-item>
                  <!-- Ability to create a sub-folder -->
                  <v-list-item>
                    <BasePopupButton actionName="Create Sub-folder"
                      :inputFields="['Folder name']"
                      @action-do="({ 'Folder name': name }) => createNewFolder(name, item.id)"
                    >
                      <template v-slot:activator-button="{ on }">
                         <v-btn v-on="on" color="accent">Create Sub-folder</v-btn>
                      </template>
                    </BasePopupButton>
                  </v-list-item>
                </v-list>
              </v-menu>
              
              <!-- Different dropdown options for pages (refactor later) -->
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
          </v-treeview>
    </div>
</template>

<script>
// TODO: Fix search; Allow user to edit; Fix the strange nesting
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js"; 
import BasePopupButton from "@/components/BasePopupButton.vue";
import ButtonNew from "@/components/ButtonNew.vue";
import { displayDate, getRandomId } from "@/helpers.js";
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
    ButtonNew,
    Drag,
    Drop
  },
  computed: {
    classId () { 
      return this.$route.params.class_id; 
    },
    groupBy: {
      get () {
        return (this.type==='note') ? 'concept' : 'date';
      },
      set (newVal) {
        if (newVal === "concept") this.groupByConcept();
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
      async handler () {
        this.tagsArrayToObject();
        // this.initializeClassOrder();
        // this.setClassMaxOrder();
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
    // Post order update on new post
    async renamePost (payload, post) {
      const postRef = db.doc(`classes/${this.$route.params.class_id}/${this.type==='question'?'questions':'posts'}/${post.id}`);
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
    /**
     * Create a new folder in the class archive via Firestore. 
     * 
     * @param name name of the new folder. 
     * @param parentID ID of the parent folder that'd contain the new folder. 
     *                 If "", a root folder is created.
     */
    async createNewFolder (name, parentID = null) {
      await db.doc(`classes/${this.mitClass.id}`).update({
        tags: firebase.firestore.FieldValue.arrayUnion({
          id: getRandomId(),
          name,
          parent: parentID
        })
      });
      this.incrementKeyToDestroy += 1;
      this.$root.$emit("show-snackbar", "Successfully created a new folder.");
    },
    async handleDrop (droppedAt, item) {
      console.log('the data', item);
      console.log('dropped at', droppedAt);
      let msg = '';
      let tag = '';
      let order = item.data.order;
      console.log('current order',order);
      if (droppedAt.isFolder) {
        tag = [droppedAt.id];
      } else {
        tag = droppedAt.tags;
        const lower = droppedAt.order;
        console.log('dragged at', lower);
        let upper = droppedAt.order; // Fallback in case the droppedAt item has the highest order in the class
        await db.collection(`classes/${this.$route.params.class_id}/${this.type==='question'?'questions':'posts'}`).where("order", ">", lower).orderBy('order', 'asc').limit(1).get().then((querySnapshot)=> {
          console.log(querySnapshot);
          querySnapshot.forEach((doc)=> {
            upper = doc.data().order;
            console.log('upper inside snapshot', upper)
          });
        });
        console.log('upper outside', upper);
        const avg = (lower+upper)/2;
        order = (lower === upper) ? (avg+1): avg; // when it is of highest order, the 'item' should still have order higher than it
        console.log('final order', order);
      }
      const postRef = db.doc(`classes/${this.$route.params.class_id}/${this.type==='question'?'questions':'posts'}/${item.data.id}`);
      await postRef.update({
        tags: tag, // a file can only exist in one folder at the time (for now)
        order: order
      }).then(function() {
        msg = "Successfully moved post to the specified folder";
      }).catch(function(error) {
        msg = "Something went wrong while moving the post";
        console.log(error);
      });
      this.$root.$emit("show-snackbar", msg);
    },
    async groupByDate () {
      console.log('grouping by date');
      this.organizedPosts = this.dateGroups;
      if (this.dateGroups.length!==0) return;
      db.collection(`classes/${this.$route.params.class_id}/${this.type==='question'?'questions':'posts'}`).get().then((querySnapshot)=> {
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
          // const n = this.conceptGroups.findIndex(({id}) => id == tag.parent); not sure why i wrote this function previously lol
          const n = this.mitClass.tags.findIndex(({id}) => id == tag.parent);
          if (n===-1) { // In case parent doesn't exist (maybe deleted or sth)
            this.conceptGroups.push(tag_object);
          }
        }

        i += 1;
      }
      this.fetchPostsWithNoTags(); 
    },
    async fetchPostsWithNoTags () {
      const query = db.collection(`classes/${this.$route.params.class_id}/${this.type==='question'?'questions':'posts'}`).where("tags", "==", []);
      this.bindUntaggedPostsToDatabase(query);
    },
    async fetchRelevantPosts (item) {
      let postsQuery;
      const postsRef = db.collection(`classes/${this.mitClass.id}/${this.type==='question'?'questions':'posts'}`);
      if (this.groupBy === 'concept') {
        postsQuery = postsRef.where("tags", "array-contains", item.id);
      } else {
        const startDate = new Date(item.name.split('-')[0]).toISOString();
        const endDate = new Date(item.name.split('-')[1]).toISOString();
        postsQuery = postsRef.where("date", ">=", startDate).where("date", "<=", endDate);
      }
      await this.bindArrayToDatabase(item.children, item.id, postsQuery);

      // because we destroy the tree everytime the data updates, we need to ensure the opened folders stay open
      // this.mitClass.tags.forEach((tag, i) => {
      //   if (item.name === tag) { 
      //     this.openedFoldersIndices.push(i);
      //   }
      // });
      // This is a temporary solution, and needs to be changed in the future
      let i;
      console.log('now managing the indices')
      if (this.groupBy === 'date') {
        i = this.organizedPosts.findIndex(folder => folder.name === item.name);
      } else {
        i = item.id;
      }
      this.openedFoldersIndices.push(i);
    },
    async movePostToFolder (post, folder, closePopup) {
      const postRef = db.doc(`classes/${this.$route.params.class_id}/${this.type==='question'?'questions':'posts'}/${post.id}`);
      await postRef.update({
        tags: [folder] // a file can only exist in one folder at the time (for now)
      });
      this.$root.$emit("show-snackbar", "Successfully moved post to the specified folder");
      closePopup();
    },
    bindUntaggedPostsToDatabase (queryRef) {
      const snapshotListener = queryRef.onSnapshot((snapshot) => {
        // clear previous data (but don't clear the folders)
        // Consider only the root folders
        // We can't just filter the classtags for root folders since folders can be deleted, but we should make better way to delete 
        let rootTagsLength = 0
        for (const tag of this.mitClass.tags) {
          if (tag.parent===null) {
            rootTagsLength +=1
          } else {
            const n = this.mitClass.tags.findIndex(({id}) => id == tag.parent);
            if (n===-1) { // In case parent doesn't exist (maybe deleted or sth)
              rootTagsLength+=1
            }
          }
        }
        this.organizedPosts.length = rootTagsLength;
        console.log('untagged');
        snapshot.forEach((doc) => {
          this.organizedPosts.push({
            id: doc.id,
            name: doc.data().title,
            date: doc.data().date,
            tags: doc.data().tags,
            order: doc.data().order,
          });
        });
        this.organizedPosts.sort((a, b) => b.order-a.order);
        this.incrementKeyToDestroy += 1;
      });
      this.snapshotListeners.push(snapshotListener);
    },
    bindArrayToDatabase (array, id, queryRef) {
      return new Promise(resolve => {
        const snapshotListener = queryRef.onSnapshot(snapshot => {  
          if (snapshot.empty) {
            array.push({ 
              id: "Push something so the folder doesn't enter an infinite loop and freeze the browser",
              name: "(Empty)",
              date: "January 3rd"
            });
            this.incrementKeyToDestroy += 1;
            resolve();
            return; 
          }
          // THE BELOW ARRAY RESET NO LONGER SEEMS NECESSARY, BUT KEEP HERE IN CASE
          /* we cannot use `array = [];` to reset the array 
             see explanation http://explain.mit.edu/class/mDbUrvjy4pe8Q5s5wyoD/posts/c63541e6-3df5-4b30-a96a-575585e7b181 */
          array.length = 0; 

          console.log('before slicing', array.slice());
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
              date: doc.data().date,
              tags: doc.data().tags,
              order: doc.data().order,
            });
          });
          array.sort((a, b) => b.order-a.order);
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
      db.collection(`classes/${this.$route.params.class_id}/${this.type==='question'?'questions':'posts'}`).get().then(function(querySnapshot) {
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
    async initializeClassOrder () {
      let order = 1;
      db.collection(`classes/${this.$route.params.class_id}/${this.type==='question'?'questions':'posts'}`).orderBy('date', 'asc').get().then(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
          doc.ref.update({
              order: order
          });
          order +=1;
        });
      });
      db.doc(`classes/${this.$route.params.class_id}`).update({
        maxOrder: order,
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