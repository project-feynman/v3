<template>
  <div>
    <v-layout>
      <v-flex>
        <BaseButton @click="groupBy='date'" icon="mdi-calendar-range">Group By Date</BaseButton>
      </v-flex>
      <v-flex>
        <BaseButton @click="groupBy='tag'" icon="mdi-folder">Group By Folders</BaseButton>
      </v-flex>
      <v-flex>
        <BasePopupButton actionName="Create a New Folder" 
          :inputFields="['Folder Name']"
          @action-do="({ 'Folder Name': name }) => createNewFolder(name)"
        >
          <template v-slot:activator-button="{ on }">
            <BaseButton :on="on" color="accent" icon="mdi-folder-plus">Create Folder</BaseButton>
            <!-- <v-btn v-on="on" color="secondary" text>Create Folder</v-btn> -->
          </template>
        </BasePopupButton>
      </v-flex>
      <!--<v-flex>
        <BaseButton 
          icon="mdi-shape-square-plus"
          :disabled="!user"
          :to="(`/class/${classId}/new?type=${type === 'question'? 'question':'post'}`)" 
          color="secondary"
        > 
          New {{ type }}
        </BaseButton>
      </v-flex>-->
    </v-layout>
    
    <!-- SEARCH BAR -->
    <v-divider/>
    <TheSideDrawerSearchBar :postType="type"/>
    <v-divider/>

    <template v-if="mitClass">
      <TheSideDrawerGroupByDate :collection="type" v-if="groupBy==='date'"/>
      <TheSideDrawerGroupByFolders :collection="type" v-else/>
    </template>
    </div>
</template>

<script>
// TODO: Fix search; Allow user to edit; Fix the strange nesting
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js"; 
import BasePopupButton from "@/components/BasePopupButton.vue";
import TheSideDrawerSearchBar from "@/components/TheSideDrawerSearchBar.vue";
import BaseButton from "@/components/BaseButton.vue";
import { displayDate, getRandomId } from "@/helpers.js";
import db from "@/database.js";
import firebase from "firebase/app";
import "firebase/firestore";
import { mapState } from "vuex";
import moment from "moment";
import { Drag, Drop } from 'vue-drag-drop';
import TheSideDrawerGroupByFolders from "@/components/TheSideDrawerGroupByFolders.vue";
import TheSideDrawerGroupByDate from "@/components/TheSideDrawerGroupByDate.vue";

export default {
  props: {
    type: {
      type: String,
      default: 'posts'
    },
  },
  components: {
    TheSideDrawerSearchBar,
    BasePopupButton,
    BaseButton,
    TheSideDrawerGroupByFolders,
    TheSideDrawerGroupByDate,
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
      search: null,
      groupBy: 'date',
    }
  },
  methods: {
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