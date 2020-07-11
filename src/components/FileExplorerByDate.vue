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
            <ButtonNew @click="groupBy='date'" icon="mdi-calendar-range">Group By Date</ButtonNew>
          </v-flex>
          <v-flex>
            <ButtonNew @click="groupBy='tag'" icon="mdi-folder">Group By Folders</ButtonNew>
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
              :to="(`/class/${classId}/new?type=${type === 'question'? 'question':'post'}`)" 
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
            :open.sync="openedFoldersIndices"
            :load-children="(folder) => fetchRelevantPosts(folder)"
            :key="incrementKeyToDestroy"
            open-on-click
            @update:open="folderToggle"
          >
            <template v-slot:prepend="{ item, open }">
              <v-icon v-if="item.isFolder">
                {{ open ? 'mdi-folder-open' : 'mdi-folder' }}
              </v-icon> 
              <v-icon v-else :class="(type === 'question' && ! item.hasReplies) ? 'unanswered' : ''">
                mdi-file-document
              </v-icon>
            </template>

            <template v-slot:label="{ item }">
              <drop class="drop" @drop="handleDrop(item, ...arguments)">
                <drag class="drag" :key="item.id" :transfer-data="{ data: item }" :draggable="groupBy === 'tag'">
                  <v-list-item v-if="!item.isFolder" :to="`/class/${mitClass.id}/${type === 'question'?'questions':'posts'}/${item.id}`" dense>
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
    type: {
      type: String,
      default: 'note'
    },
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
    ...mapState([
      "user",
      "mitClass"
    ])
  },
  data: function () {
    return {
    dateList: [],
    organizedPosts: [],
    tagGroups: [],
    dateGroups: [],
    search: null,
    incrementKeyToDestroy: 0,
    openedFoldersIndices: [],
    snapshotListeners: [],
    groupBy: (this.type === 'note') ? 'tag' : 'date',
  }},
  watch: {
    mitClass: {
      immediate: true,
      deep: true,
      async handler () {
        if (!this.mitClass) return;
        await this.tagsArrayToObject();
        await this.initializeClassOrder();
        this.groupPosts();
        // An attempt to open the first folder by default. Not sure why it is not working
        console.log('mitClass');
        setTimeout(()=>{
          console.log('called finally')
          if (this.openedFoldersIndices.length===0) {
            const openThis = this.organizedPosts.filter(item => item.isFolder)[0].id;
            console.log('adding this one', openThis);
            this.openedFoldersIndices.push(openThis);
            console.log('before', this.openedFoldersIndices)
            // setTimeout(()=>{this.openedFoldersIndices.push(openThis);}, 1000);
          }
        }, 500);
      }
    },
    groupBy: function(newVal) {
      this.groupPosts();
    },
  },
  beforeDestroy () {
    for (const detachListener of this.snapshotListeners) {
      detachListener();
    }
  },
  methods: {
    // Post order update on new post
    async renamePost (payload, post) {
      const postRef = db.doc(`classes/${this.$route.params.class_id}/${this.type === 'question'?'questions':'posts'}/${post.id}`);
      await postRef.update({
        title: payload["New Name"]
      });
      this.$root.$emit("show-snackbar", "Successfully renamed the post.");
    },
    async renameTag (payload, tag) {
      const i = this.mitClass.tags.findIndex(({name}) => name ==tag.name);
      this.mitClass.tags[i].name=payload['New Name']
      const postRef = db.doc(`classes/${this.$route.params.class_id}`);
      await postRef.update({
        tags: this.mitClass.tags,
      });
      this.groupByTag(true);
      this.$root.$emit("show-snackbar", "Successfully renamed the folder.");
    },
    openThisFolder (folder) {
      if ( !this.openedFoldersIndices.includes(folder) ) {
        this.openedFoldersIndices.push(folder);
      }
    },
    /**
     * Create a new folder in the class archive via Firestore. 
     * 
     * @param name name of the new folder. 
     * @param parentID ID of the parent folder that'd contain the new folder. 
     *                 If "", a root folder is created.
     */
    async createNewFolder (name, parentID = null) {
      const newFolder = {
          id: getRandomId(),
          name,
          parent: parentID
        }
      await db.doc(`classes/${this.mitClass.id}`).update({
        tags: firebase.firestore.FieldValue.arrayUnion(newFolder)
      });
      this.mitClass.tags.push(newFolder)
      this.groupByTag(true);
      // this.incrementKeyToDestroy += 1;
      this.$root.$emit("show-snackbar", "Successfully created a new folder.");
    },
    // For better UX; To be done after some time
    dragHover (action, id, data, event) {
    //   const target = document.getElementById(id);
    //   if (target.contains(event.target)) return;
    //   if (event==='start') target.classList.add('dragOver');
    //   else target.classList.remove('dragOver');
    },
    async handleDrop (droppedAt, item) {
      if (this.groupBy === 'date') return; // Need to make the item not draggable instead of this, but that's not working
      // item.highlight = false; For better UX
      let msg = '';
      if (item.data.isFolder) {
        let parent = null;
        if (droppedAt.isFolder) {
          parent = droppedAt.id;
        } else { // If it is a post
          // Making sure it works even when some folder has been deleted
          if (this.mitClass.tags.findIndex(tag=> tag.id === droppedAt.tags[0])>=0) parent = droppedAt.tags[0];
        }
        if (parent === item.data.parent || parent === item.data.id) {
          //If there is no change in parent, or is dragged onto oneself
          msg = "No change in folder."
        } else {
          const i = this.mitClass.tags.findIndex(tag => tag.id === item.data.id);
          this.mitClass.tags[i].parent = parent;
          await db.doc(`classes/${this.mitClass.id}`).update({
            tags: this.mitClass.tags,
          }).then(function() {
            msg = "Successfully moved folder";
          }).catch(function(error) {
            msg = "Something went wrong while moving the folder";
          });
          this.groupByTag(true); // Rerender the tree with new structure
        }
      } else {
        let tag = [];
        let order = item.data.order;
        order = typeof order === 'undefined' ? 0 : order; // If order is not defined in the class yet
        if (droppedAt.isFolder) {
          tag = [droppedAt.id];
        } else {
          tag = droppedAt.tags;
          const lower = droppedAt.order;
          let upper = droppedAt.order; // Fallback in case the droppedAt item has the highest order in the class
          await db.collection(`classes/${this.$route.params.class_id}/${this.type === 'question'?'questions':'posts'}`).where("order", ">", lower).orderBy('order', 'asc').limit(1).get().then((querySnapshot)=> {
            querySnapshot.forEach((doc)=> {
              upper = doc.data().order;
            });
          });
          const avg = (lower+upper)/2;
          order = (lower === upper) ? (avg+1): avg; // when it is of highest order, the 'item' should still have order higher than it
          if (order>this.mitClass.maxOrder) {
            db.doc(`classes/${this.$route.params.class_id}`).update({
              maxOrder: order,
            });
          }
        }
        const postRef = db.doc(`classes/${this.$route.params.class_id}/${this.type === 'question'?'questions':'posts'}/${item.data.id}`);
        await postRef.update({
          tags: tag, // a file can only exist in one folder at the time (for now)
          order: order
        }).then(function() {
          msg = "Successfully moved post to the specified folder";
        }).catch(function(error) {
          msg = "Something went wrong while moving the post";
        });
      }
      this.$root.$emit("show-snackbar", msg);
    },
    folderToggle (a) {
      // this.openedFoldersIndices = a;
    },
    groupPosts() {
      if (this.groupBy === "tag") {
        this.organizedPosts = this.tagGroups;
        this.groupByTag();
      } else {
        this.organizedPosts = this.dateGroups;
        this.groupByDate();
      }
    },
    async groupByDate () {
      // This only (re)groups the posts, but doesn't rerender the UI.
      // To rerender UI, call groupPosts
      if (this.dateGroups.length!==0) return;
      await db.collection(`classes/${this.$route.params.class_id}/${this.type === 'question'?'questions':'posts'}`).get().then((querySnapshot)=> {
        querySnapshot.forEach(doc => {
          this.dateList.push(doc.data().date);
        })
        this.foldersFromDates();
      });
    },
    groupByTag (force = false) {
      // This only (re)groups the posts, but doesn't rerender the UI.
      // To rerender UI, call groupPosts
      // force: (Boolean) forces the tag tree to update even if it was already filled. We don't want ot force every single time user switches between
      // but only when a new folder is added (cause we are not listening to mitClass (but not sure if fixing that would solve the problem))
      if ((!this.mitClass || this.tagGroups.length!==0) && !force) return;
      this.tagGroups.length=0;
      for (const tag of this.mitClass.tags) {
        const tag_object = {
          id: tag.id,
          name: tag.name,
          isFolder: true,
          children: [],
          date: "999999999999999999999999999999999999999", // so it'll always appear at the top
        };
        if (tag.parent === null) {
          this.tagGroups.push(tag_object);
        } else {
          // const n = this.tagGroups.findIndex(({id}) => id == tag.parent); not sure why i wrote this function previously lol
          const n = this.mitClass.tags.findIndex(({id}) => id == tag.parent);
          if (n === -1) { // In case parent doesn't exist (maybe deleted or sth)
            this.tagGroups.push(tag_object);
          }
        }
      }
      this.fetchPostsWithNoTags(); 
    },
    fetchPostsWithNoTags () {
      const query = db.collection(`classes/${this.$route.params.class_id}/${this.type === 'question'?'questions':'posts'}`).where("tags", "==", []);
      this.bindUntaggedPostsToDatabase(query);
    },
    async fetchRelevantPosts (item) {
      const postsRef = db.collection(`classes/${this.mitClass.id}/${this.type === 'question'?'questions':'posts'}`);
      let postsQuery;
      if (this.groupBy === 'tag') {
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
      // let i;
      // if (this.groupBy === 'date') {
      //   i = this.organizedPosts.findIndex(folder => folder.name === item.name);
      // } else {
      //   i = item.id;
      // }
      // this.openedFoldersIndices.push(i);
    },
    async movePostToFolder (post, folder, closePopup) {
      const postRef = db.doc(`classes/${this.$route.params.class_id}/${this.type === 'question'?'questions':'posts'}/${post.id}`);
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
        let rootTagsLength = 0;
        for (const tag of this.mitClass.tags) {
          if (tag.parent === null) {
            rootTagsLength +=1
          } else {
            const n = this.mitClass.tags.findIndex(({id}) => id == tag.parent);
            if (n === -1) { // In case parent doesn't exist (maybe deleted or sth)
              rootTagsLength+=1
            }
          }
        }
        this.tagGroups.length = rootTagsLength;
        snapshot.forEach((doc) => {
          this.tagGroups.push({
            id: doc.id,
            name: doc.data().title,
            date: doc.data().date,
            tags: doc.data().tags,
            order: doc.data().order,
            hasReplies: doc.data().hasReplies,
          });
        });
        this.tagGroups.sort((a, b) => b.order-a.order);
        this.incrementKeyToDestroy += 1;
      });
      this.snapshotListeners.push(snapshotListener);
    },
    bindArrayToDatabase (array, id, queryRef) {
      return new Promise(resolve => {
        const snapshotListener = queryRef.onSnapshot(snapshot => {  
          // THE BELOW ARRAY RESET NO LONGER SEEMS NECESSARY, BUT KEEP HERE IN CASE
          /* we cannot use `array = [];` to reset the array 
             see explanation http://explain.mit.edu/class/mDbUrvjy4pe8Q5s5wyoD/posts/c63541e6-3df5-4b30-a96a-575585e7b181 */
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
          if (snapshot.empty) {
            resolve();
            return; 
          }
          snapshot.forEach((doc) => {
            array.push({
              id: doc.id,
              name: doc.data().title,
              date: doc.data().date,
              tags: doc.data().tags,
              order: doc.data().order,
              hasReplies: doc.data().hasReplies,
            });
          });
          snapshot.docChanges().forEach(function(change) {
            if (change.type === "added") {
              const addedPost = change.doc.data().title;
              console.log('new post', addedPost);
            }
          });
          if (this.groupBy === 'tag') array.sort((a, b) => b.order-a.order);
          else array.sort((a, b) => b.date-a.date);
          // this.incrementKeyToDestroy += 1;
          resolve();
        });
        this.snapshotListeners.push(snapshotListener);
      });
    },
    foldersFromDates () {
      this.dateGroups.length = 0;
      const weekGroups = {}
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
        const week = `${startDay}-${endDay}`;
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
    // The functions below work to make the classes existing in the database compatible with the new organization structure
    // A temporary function to convert the tags of a class from array to object when class is loaded
    async tagsArrayToObject () {
      // If the class doesn't have tags initialized yet
      if (! this.mitClass.hasOwnProperty('tags')) {
        db.doc(`classes/${this.$route.params.class_id}`).update({
          tags: [],
        });
        this.mitClass.tags = []
        this.tagPostToTagId([])
        return;
      }

      const tags = this.mitClass.tags;
      const newTags = [];
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
      db.collection(`classes/${this.$route.params.class_id}/${this.type === 'question'?'questions':'posts'}`).get().then(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
          const postTags = doc.data().tags;
          const tag_ids = [];
          if (typeof postTags !== "undefined") {
            for (let tag of postTags) {
              tag_ids.push(tags.find(({name}) => name ==tag).id);
            }
          }
          doc.ref.update({
            tags: tag_ids
          });
        });
      });
    },
    async initializeClassOrder () {
      if (this.mitClass.hasOwnProperty('maxOrder')) return;
      let order = 0;
      await db.collection(`classes/${this.$route.params.class_id}/${this.type === 'question'?'questions':'posts'}`).orderBy('date', 'asc').get().then((querySnapshot)=> {
        querySnapshot.forEach((doc)=> {
          order +=1;
          doc.ref.update({
            order: order
          });
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
.dragOver {
  background: black;
}
.unanswered {
  color: #ee5555 !important;
}
</style>