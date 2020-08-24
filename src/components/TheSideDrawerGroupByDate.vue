<template>
  <v-expansion-panels hover accordion v-model="openedWeeks" multiple class="group-by-date">
    <v-expansion-panel
      v-for="week in weeks"
      :key="week.start.toISOString()"
    >
      <v-expansion-panel-header ripple color="#f8f8f8">{{ week.name }}</v-expansion-panel-header>
      <v-expansion-panel-content>
        <template v-if="week.isLoading">
          <div class="text-center py-2">
            <v-progress-circular indeterminate color="accent"/>
          </div>
        </template>
        <v-list v-else shaped>
          <template v-for="post in week.children">
            <!-- :to="`/class/${classID}/room/${roomID}/posts/${post.id}`" -->
            <v-list-item
              @click="$emit('post-was-clicked', post.id)"
              :class="(collection === 'questions') && !post.hasReplies ? 'unanswered' : 'answered'"
              two-line
              dense
              :key="post.id"
            >
              <v-list-item-icon>
                <v-icon>{{ collection === 'questions' ? 'mdi-file-question-outline' : 'mdi-file-document-box-outline'}}</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title style="font-size:1em; color: #555; padding-bottom: 5px;">
                  {{ post.name }}
                </v-list-item-title>
                <v-list-item-subtitle class="post-metaData">
                  <span v-if="getFolder(post)">
                    <v-icon small>mdi-folder-open</v-icon>
                    {{ getFolder(post) }}
                  </span>
                  <span v-if="getFolder(post)">|</span>
                  <span>
                    <v-icon small>mdi-calendar</v-icon>
                    {{ getDate(post) }}
                  </span>
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
            <v-divider/>
          </template>
        </v-list>
      </v-expansion-panel-content>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script>

import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import db from "@/database.js";
import firebase from "firebase/app";
import "firebase/firestore";
import { mapState } from "vuex";
import moment from "moment";

export default {
  props: {
    collection: {
      type: String,
      default: 'questions'
    },
  },
  mixins: [
    DatabaseHelpersMixin,
  ],
  computed: {
    ...mapState([
      "user",
      "mitClass"
    ]),
  },
  data: function () {
    return {
      weeks: [],
      search: null,
      snapshotListeners: [],
      openedWeeks: [],
      weeksMounted: false,
      routePath: this.$route.path,
      classID: this.$route.params.class_id,
      roomID: this.$route.params.room_id
    }
  },
  watch: {
    openedWeeks: function (newVal, oldVal) {
      const justOpened = newVal.filter(x => !oldVal.includes(x));
      if (justOpened.length===1) {
        this.openThisWeek(this.weeks[justOpened]);
      }
    },
    weeksMounted: function (newVal) {
      if ( newVal === true ) {
        this.openedWeeks.push(0);
        this.openThisWeek(this.weeks[0]); // This should have been handled by the watch hook on openedWeeks, but strangely doesn't
      }
    },
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
    async groupPosts () {
      // This only (re)groups the posts, but doesn't rerender the UI.
      // To rerender UI, call groupPosts
      if (this.weeks.length!==0) return;
      const collectionRef = db.collection(`classes/${this.$route.params.class_id}/${this.collection}`);
      // Get the first and last post posted in the class
      let firstDate, lastDate;
      await collectionRef.orderBy('date', 'asc').limit(1).get().then(querySnapshot => {
        if (querySnapshot.empty) return;
        querySnapshot.forEach(doc => {
          firstDate = new Date(doc.data().date);
        });
      });

      await collectionRef.orderBy('date', 'desc').limit(1).get().then(querySnapshot => {
        if (querySnapshot.empty) return;
        querySnapshot.forEach(doc => {
          lastDate = moment(doc.data().date);
        });
      });

      let startOfNextWeek  = moment()
          .isoWeekYear(lastDate.year())
          .isoWeek(lastDate.week())
          .startOf('week')
          .add(1, 'week')
          .toDate();
      
      while ( startOfNextWeek > firstDate ) {
        const endOfThisWeek = new Date(startOfNextWeek.getTime());
        endOfThisWeek.setDate(endOfThisWeek.getDate() - 1);
        const startOfThisWeek = new Date(startOfNextWeek.getTime());
        startOfThisWeek.setDate(startOfNextWeek.getDate() - 7);

        await collectionRef.where("date", ">=", startOfThisWeek.toISOString()).where("date", "<", startOfNextWeek.toISOString()).limit(1).get().then(querySnapshot => {
          if (!querySnapshot.empty) {
            this.weeks.push({
              name: 'Week ' + moment(startOfThisWeek).format('MMM D') + ' - ' + moment(endOfThisWeek).format('MMM D'),
              start: startOfThisWeek,
              end: startOfNextWeek,
              isLoading: false,
              children: [],
            })
          }
        });
        startOfNextWeek = startOfThisWeek;
      }
      this.weeksMounted = true;
    },
    async openThisWeek (week) {
      if (week.children.length!==0) return;
      week.isLoading = true
      // const startTime = new Date(week.name.split('-')[0]).toISOString();
      // const endDate = new Date(week.name.split('-')[1]);
      // endDate.setHours(23, 59, 59); // Since we want the post till the end of the day
      // const endTime = endDate.toISOString();
      const startDate = week.start.toISOString();
      const endDate = week.end.toISOString();
      const postsQuery = db.collection(`classes/${this.mitClass.id}/${this.collection}`).where("date", ">=", startDate).where("date", "<=", endDate);
      const posts = [];
      await new Promise(resolve => {
        const snapshotListener = postsQuery.onSnapshot(snapshot => {
          if (snapshot.empty) {
            resolve();
            return;
          }
          week.children.length = 0;
          snapshot.forEach(doc => {
            week.children.push({
              id: doc.id,
              name: doc.data().title,
              date: doc.data().date,
              hasReplies: doc.data().hasReplies,
              tag: doc.data().tags[0],
            });
          });
          week.children.sort((a, b) => b.date-a.date);
          week.isLoading= false
          resolve();
        });
        this.snapshotListeners.push(snapshotListener)
      });
    },
    getFolder (post) {
      const folderIndex = this.mitClass.tags.findIndex(tag => tag.id === post.tag);
      if (folderIndex === -1) return false;
      return this.mitClass.tags[folderIndex].name;
    },
    getDate (post) {
      const theDate = moment(post.date);
      return theDate.format('MMM D, YYYY');
    }
  }
}

</script>

<style>
.group-by-date .unanswered {
  position: relative;
  left: -5px;
  border-left: 5px solid #B00;
  background: rgba(255,100,100,0.07);
}
.group-by-date .unanswered.v-list-item--active {
  background: rgba(255,0,0,0.1);
}
.group-by-date .v-expansion-panel-content__wrap {
  padding: 0 5px 0 8px;
}
.group-by-date .v-expansion-panel--active > .v-expansion-panel-header {
  min-height: unset;
  background-color: #d8d8d8 !important;
}
.group-by-date .post-metaData span {
  padding: 0 3px;
}
</style>