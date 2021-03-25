<template>
  <v-expansion-panels hover accordion v-model="openedWeeks" multiple class="group-by-date">
    <v-expansion-panel v-for="week in weeks" :key="week.start.toISOString()">
      <v-expansion-panel-header ripple color="#f8f8f8">
        {{ week.name }}
      </v-expansion-panel-header>

      <v-expansion-panel-content>
        <template v-if="week.isLoading">
          <div class="text-center py-2">
            <v-progress-circular indeterminate color="accent"/>
          </div>
        </template>
        <v-list v-else shaped>
          <template v-for="post in week.children">
            <!-- :to="`/class/${classID}/room/${roomID}/posts/${post.id}`" -->
            <v-list-item @click="$emit('post-was-clicked', post.id)"
              :class="(collection === 'questions') && !post.hasReplies ? 'unanswered' : 'answered'"
              two-line dense
              :key="post.id"
            >
              <v-list-item-icon>
                <v-icon>{{ collection === 'questions' ? 'mdi-file-question-outline' : 'mdi-file-document-box-outline' }}</v-icon>
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
import { mapState } from "vuex";
import { displayDate } from "@/helpers.js"; 

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
  computed: {
    ...mapState([
      "user",
      "mitClass"
    ]),
  },
  data: function () {
    return {
      weeks: [],
      snapshotListeners: [],
      openedWeeks: [],
      fetchedWeeks: [],
      routePath: this.$route.path,
      classID: this.$route.params.class_id,
      roomID: this.$route.params.room_id,
      search: null,
    }
  },
  watch: {
    openedWeeks () {
      for (const weekNumber of this.openedWeeks) {
        if (! this.fetchedWeeks.includes(weekNumber)) {
          this.openThisWeek(this.weeks[weekNumber])
          this.fetchedWeeks.push(weekNumber);
        } 
      }
    }
  },
  beforeDestroy () {
    for (const detachListener of this.snapshotListeners) {
      detachListener();
    }
  },
  async created () {
    // find min/max date range
    // everything is Boston EST time
    // let dateOfNewestPost; 
    let dateOfOldestPost;
    const { class_id } = this.$route.params; 
    const collectionRef = db.collection(`classes/${class_id}/${this.collection}`);
    await collectionRef.orderBy("date", "asc").limit(1).get().then(querySnapshot => {
      if (!querySnapshot.empty) {
        dateOfOldestPost = new Date(querySnapshot.docs[0].data().date);
      } 
    });
    // defensive programming
    if (!dateOfOldestPost) return; 

    let folderStartDate = dateOfOldestPost; 
    // note that the exact time of the day is lost and rounded off with this operation
    let folderEndDate = new Date(folderStartDate.toDateString()); // // let folderEndDate = new Date(dateOfOldestPost + ONE_WEEK_IN_MILLISECONDS);
    folderEndDate.setDate(folderEndDate.getDate() + 7);
    let createFolderPromises = []; 

    // only generate folders in between if it's not empty
    // danger, start date and end date can mutate each other
    let counter = 1; 
    const monthDayFormat = { month: "long", day: "2-digit" };
    const dateObjectOfToday = new Date();
    const weekFolders = []; 
    while (folderStartDate < dateObjectOfToday) {
      const startCopy = new Date(folderStartDate.toDateString());
      const endCopy = new Date(folderEndDate.toDateString());
      createFolderPromises.push(
        collectionRef
          .where("date", ">=", startCopy.toISOString())
          .where("date", "<", endCopy.toISOString())
          .limit(1)
          .get()
          .then(querySnapshot => {
            if (! querySnapshot.empty) {
              weekFolders.push({
                name: "Week " + displayDate(startCopy, monthDayFormat) + " - " + displayDate(endCopy, monthDayFormat),
                start: startCopy,
                end: endCopy,
                isLoading: false,
                children: []
              });
            }
          })
      );
      // shift the interval by 1 week
      folderStartDate.setDate(folderStartDate.getDate() + 7);
      folderEndDate.setDate(folderStartDate.getDate() + 7);
      // const ONE_WEEK_IN_MILLISECONDS  = 7 * 24 * 60 * 60 * 1000;
      // folderStartDate = new Date(folderStartDate + ONE_WEEK_IN_MILLISECONDS);
      // folderEndDate = new Date(folderEndDate + ONE_WEEK_IN_MILLISECONDS); 
      counter += 1; 
    }
    await Promise.all(createFolderPromises);

    weekFolders.sort((w1, w2) => w2.start - w1.start);
    this.weeks = weekFolders; 
    this.openedWeeks.push(0);
  },
  methods: {
    async openThisWeek (week) {
      if (week.children.length !== 0) return;
      week.isLoading = true
      // const startTime = new Date(week.name.split('-')[0]).toISOString();
      // const endDate = new Date(week.name.split('-')[1]);
      // endDate.setHours(23, 59, 59); // Since we want the post till the end of the day
      // const endTime = endDate.toISOString();

      const startDate = week.start.toISOString();
      const endDate = week.end.toISOString();

      console.log("startDate =", week.start.toDateString()); 
      console.log("endDate =", week.end.toDateString());

      const postsQuery = db.collection(`classes/${this.$route.params.class_id}/${this.collection}`)
        .where("date", ">=", startDate)
        .where("date", "<=", endDate)
        .orderBy('date', 'desc');
      const posts = [];
      await new Promise(resolve => {
        const snapshotListener = postsQuery.onSnapshot(snapshot => {
          if (snapshot.empty) {
            week.isLoading = false
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
          week.isLoading= false
          resolve();
        });
        this.snapshotListeners.push(snapshotListener)
      });
    },
    getFolder (post) {
      return false; 
      // if (!this.mitClass.tags) return false; 
      // const folderIndex = this.mitClass.tags.findIndex(tag => tag.id === post.tag);
      // if (folderIndex === -1) return false;
      // return this.mitClass.tags[folderIndex].name;
    },
    getDate (post) {
      return displayDate(post.date); 
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