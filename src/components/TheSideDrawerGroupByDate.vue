<template>
  <v-expansion-panels accordion v-model="openedWeeks" multiple>
    <v-expansion-panel
      v-for="week in weeks"
      :key="week.date"
    >
      <v-expansion-panel-header ripple color="#f8f8f8">{{ week.name }}</v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-list>
          <template 
            v-for="post in week.children"
          >
            <v-list-item
              :to="`/class/${mitClass.id}/${collection}/${post.id}`" dense
              two-line
            >
              <v-list-item-content>
                <v-list-item-title style="font-size:1em; color: #555; padding-bottom: 5px;">{{ post.name }}</v-list-item-title>
                <v-list-item-subtitle>{{ post.date }}</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
            <v-divider/>
          </template>
        </v-list>
      </v-expansion-panel-content>
      <v-divider/>
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
      default: 'posts'
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
      openedWeeks: []
    }
  },
  watch: {
    openedWeeks: function (newVal, oldVal) {
      console.log('previously opened weeks', oldVal);
      console.log('now opened weeks', newVal);
      const justOpened = newVal.filter(x => !oldVal.includes(x));
      if (justOpened.length===1) {
        this.openThisWeek(this.weeks[justOpened]);
      }
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
    async groupPosts () {
      // This only (re)groups the posts, but doesn't rerender the UI.
      // To rerender UI, call groupPosts
      if (this.weeks.length!==0) return;
      const dateList = [];
      await db.collection(`classes/${this.$route.params.class_id}/${this.collection}`).get().then((querySnapshot)=> {
        querySnapshot.forEach(doc => {
          dateList.push(doc.data().date);
        })
        this.foldersFromDates(dateList);
      });
    },
    async openThisWeek (week) {
      if (week.children.length!==0) return;
      console.log(week);
      const startTime = new Date(week.name.split('-')[0]).toISOString();
      const endDate = new Date(week.name.split('-')[1]);
      endDate.setHours(23, 59, 59); // Since we want the post till the end of the day
      const endTime = endDate.toISOString();
      const postsQuery = db.collection(`classes/${this.mitClass.id}/${this.collection}`).where("date", ">=", startTime).where("date", "<=", endTime);
      const posts = [];
      return new Promise(resolve => {
        const snapshotListener = postsQuery.onSnapshot(snapshot => {
          if (snapshot.empty) {
            resolve();
            return;
          }
          snapshot.forEach(doc => {
            posts.push({
              id: doc.id,
              name: doc.data().title,
              date: doc.data().date,
              hasReplies: doc.data().hasReplies,
            });
          });
          posts.sort((a, b) => b.date-a.date);
          resolve();
        });
        week.children = posts;
        console.log('the week', week);
        this.snapshotListeners.push(snapshotListener)
      })
      // await this.bindArrayToDatabase(item.children, item.id, postsQuery);
    },
    foldersFromDates (dateList) {
      this.weeks.length = 0;
      const weekGroups = {}
      dateList.sort((a, b) => (a < b) ? 1 : ((a > b) ? -1 : 0)); // First sort the date in reverse chronological order
      dateList.forEach( date => {
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
        this.weeks.push({
            id: i,
            name: week,
            isFolder: true,
            children: [],
            date: week.split('-')[0]
          });
        i++;
      }
    },
  }
}

</script>

<style>
.v-expansion-panel--active > .v-expansion-panel-header {
  min-height: unset;
  background-color: #d8d8d8;
}
</style>