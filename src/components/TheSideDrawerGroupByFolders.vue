<template>
  <!-- :value prop controls which item is highlighted on the UI -->
  <div>
    <v-treeview
      :items="folders"
      :search="search"
      :open.sync="openedFoldersIndices"
      :load-children="(folder) => fetchRelevantPosts(folder)"
      :key="incrementKeyToDestroy"
      open-on-click
      :active="[currentlySelectedLibraryPostID]"
      color="cyan"
      dense
    >
      <template v-slot:prepend="{ item, open }">
        <v-icon v-if="item.isFolder">
          {{ open ? 'mdi-folder-open' : 'mdi-folder' }}
        </v-icon> 
        <v-icon v-else :class="(collection === 'questions' && ! item.hasReplies) ? 'unanswered' : ''">
          mdi-file-document
        </v-icon>
      </template>

      <template v-slot:label="{ item }">
        <drop class="drop" @drop="handleDrop(item, ...arguments)">
          <drag class="drag" :key="item.id" :transfer-data="{ data: item }">
            <!-- Document -->
            <v-list-item v-if="!item.isFolder" 
              @click="$emit('post-was-clicked', item.id)" 
              dense
            >
              <v-list-item-subtitle :class="item.id === currentlySelectedLibraryPostID ? 'cyan--text' : ''" v-text="item.name"/>
            </v-list-item>

            <!-- Folder -->
            <v-list-item v-else dense>
              <v-list-item-subtitle v-text="item.name"/>
            </v-list-item>
          </drag>
        </drop>
      </template>

      <template v-slot:append="{ item }">
        <v-menu v-if="item.isFolder" bottom right>
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
        <v-menu v-else-if="user.email" bottom right>
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

    <!-- Create a root folder  -->
    <BasePopupButton actionName="Create a New Folder" 
      :inputFields="['Folder Name']"
      @action-do="({ 'Folder Name': name }) => createNewFolder(name)"
    >
      <template v-slot:activator-button="{ on }">
        <BaseButton :on="on" color="accent" icon="mdi-folder-plus">Create Folder</BaseButton>
      </template>
    </BasePopupButton>
  </div>
</template>

<script>

import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js"; 
import BasePopupButton from "@/components/BasePopupButton.vue";
import BaseButton from "@/components/BaseButton.vue"; 
import { displayDate, getRandomId } from "@/helpers.js";
import db from "@/database.js";
import firebase from "firebase/app";
import "firebase/firestore";
import { mapState } from "vuex";
import { Drag, Drop } from "vue-drag-drop";

export default {
  props: {
    collection: {
      type: String,
      default: "posts"
    },
  },
  mixins: [
    DatabaseHelpersMixin,
  ],
  components: {
    BasePopupButton,
    BaseButton,
    Drag,
    Drop
  },
  computed: {
    ...mapState([
      "user",
      "mitClass",
      "currentlySelectedLibraryPostID"
    ])
  },
  data: function () {
    return {
      folders: [],
      openedFoldersIndices: [],
      search: null,
      snapshotListeners: [],
      incrementKeyToDestroy: 0
    }
  },
  beforeDestroy () {
    for (const detachListener of this.snapshotListeners) {
      detachListener();
    }
  },
  created () {
    this.groupPosts();
  },
  methods: {
    async renamePost (payload, post) {
      const postRef = db.doc(`classes/${this.$route.params.class_id}/${this.collection}/${post.id}`);
      await postRef.update({
        title: payload["New Name"]
      });
      this.$root.$emit("show-snackbar", "Successfully renamed the post.");
    },
    async renameTag (payload, tag) {
      const i = this.mitClass.tags.findIndex(({ name }) => name == tag.name);
      this.mitClass.tags[i].name = payload['New Name']; 
      await db.doc(`classes/${this.$route.params.class_id}`).update({
        tags: this.mitClass.tags
      });
      await this.$store.dispatch("fetchClass", this.mitClass.id); 
      this.groupPosts(true);
      this.incrementKeyToDestroy += 1; 
      this.$root.$emit("show-snackbar", "Successfully renamed the folder.");
    },
    // openThisFolder (folder) {
    //   if ( !this.openedFoldersIndices.includes(folder) ) {
    //     this.openedFoldersIndices.push(folder);
    //   }
    // },
    /**
     * Create a new folder in the class archive via Firestore. 
     * 
     * @param name name of the new folder. 
     * @param parentID ID of the parent folder that'd contain the new folder. 
     *                 If "", a root folder is created.
     */
    async createNewFolder (name, parentID = null) {
      return new Promise(async (resolve) => {
        const newFolder = {
          id: getRandomId(),
          name,
          parent: parentID
        };
        await db.doc(`classes/${this.mitClass.id}`).update({
          tags: firebase.firestore.FieldValue.arrayUnion(newFolder)
        });
        await this.$store.dispatch("fetchClass", this.mitClass.id); 
        this.groupPosts(true);
        this.incrementKeyToDestroy += 1; 
        this.$root.$emit("show-snackbar", "Successfully created a new folder.");
        resolve();
      });
    },
    async handleDrop (droppedAt, item) {
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
          this.groupPosts(true); // Rerender the tree with new structure
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
          await db.collection(`classes/${this.$route.params.class_id}/${this.collection}`).where("order", ">", lower).orderBy('order', 'asc').limit(1).get().then((querySnapshot)=> {
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
        const postRef = db.doc(`classes/${this.$route.params.class_id}/${this.collection}/${item.data.id}`);
        await postRef.update({
          tags: tag, // a file can only exist in one folder at the time (for now)
          order: order
        }).then(() => {
          msg = "Successfully moved post to the specified folder";
          this.incrementKeyToDestroy += 1; 
        }).catch((error) => {
          msg = error;
        });
      }
      this.$root.$emit("show-snackbar", msg);
    },
    async groupPosts (force = false) {
      // force: (Boolean) forces the tag tree to update even if it was already filled. We don't want ot force every single time user switches between
      // but only when a new folder is added (cause we are not listening to mitClass (but not sure if fixing that would solve the problem))
      if ((!this.mitClass || this.folders.length !== 0) && !force) return;
      this.folders.length = 0;

      for (const tag of this.mitClass.tags) {
        const tag_object = {
          id: tag.id,
          name: tag.name,
          isFolder: true,
          children: [],
          date: "999999999999999999999999999999999999999", // so it'll always appear at the top
        };
        if (tag.parent === null) {
          this.folders.push(tag_object);
        } else {
          // const n = this.folders.findIndex(({id}) => id == tag.parent); not sure why i wrote this function previously lol
          const n = this.mitClass.tags.findIndex(({id}) => id == tag.parent);
          if (n === -1) { // In case parent doesn't exist (maybe deleted or sth)
            this.folders.push(tag_object);
          }
        }
      }
    },
    fetchPostsWithNoTags () {
      const query = db.collection(`classes/${this.$route.params.class_id}/${this.collection}`).where("tags", "==", []);
      this.bindUntaggedPostsToDatabase(query);
    },
    async fetchRelevantPosts (item) {
      const postsRef = db.collection(`classes/${this.mitClass.id}/${this.collection}`);
      const postsQuery = postsRef.where("tags", "array-contains", item.id);
      await this.bindArrayToDatabase(item.children, item.id, postsQuery);

    },
    async movePostToFolder (post, folder, closePopup) {
      const postRef = db.doc(`classes/${this.$route.params.class_id}/${this.collection}/${post.id}`);
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
        // let rootTagsLength = 0;
        // for (const tag of this.mitClass.tags) {
        //   if (tag.parent === null) {
        //     rootTagsLength +=1
        //   } else {
        //     const n = this.mitClass.tags.findIndex(({id}) => id == tag.parent);
        //     if (n === -1) { // In case parent doesn't exist (maybe deleted or sth)
        //       rootTagsLength+=1
        //     }
        //   }
        // }
        // this.folders.length = rootTagsLength;
        this.folders.length = 0; 
        snapshot.forEach(doc => {
          this.folders.push({
            id: doc.id,
            name: doc.data().title,
            date: doc.data().date,
            tags: doc.data().tags,
            order: doc.data().order,
            hasReplies: doc.data().hasReplies,
          });
        });
        this.folders.sort((a, b) => b.order-a.order);
        // this.incrementKeyToDestroy += 1;
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

          // fetch sub-folders
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

          // fetch the folder's contents
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
            }
          });
          array.sort((a, b) => b.order-a.order);
          resolve();
        });
        this.snapshotListeners.push(snapshotListener);
      });
    },

  }
}
</script>