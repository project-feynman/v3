<template>
  <div>
    <!-- console.log -->
    <p>{{ questionsArray }}</p>

    <!-- Button for a new question -->
    <BaseButton :to="`class/${classId}/new?type=question/`"
      :disabled="!user"
      icon="mdi-shape-square-plus"
      color="secondary"
    > 
      New Question
    </BaseButton>

    <!-- Display questions -->
    <v-treeview
      :items="questionsArray"
      :load-children="folder => fetchQuestions(folder)"
      :open.sync="openedFoldersIndices"
    />
  </div>
</template>

<script>
import BaseButton from "@/components/BaseButton.vue"; 
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import db from "@/database.js";
import { mapState } from "vuex";

export default {
  mixins: [
    DatabaseHelpersMixin
  ],
  components: {
    BaseButton
  },
  data () {
    return {
      questionsArray: [],
      openedFoldersIndices: []
    };
  },  
  computed: {
    ...mapState([
      "user",
      "mitClass"
    ]),
    classId () {
      return this.$route.params.class_id;
    },
    classRef () {
      return db.collection("classes").doc(this.classId);
    },
    questionsRef () {
      return this.classRef.collection("questions");
    }
  },
  created () {
    this.questionsRef.orderBy("date").limit(1).get().then(snapshot => {
      const oldestQuestion = snapshot.docs[0].data(); 
      this.createWeeklyFolders(new Date().toISOString(), oldestQuestion.date); 

      // fetch the most recent questions (from until a week ago)
      this.openedFoldersIndices.push(0); // will cause the folder to open and fetch the questions
    });   
  },
  methods: {
    /**
     * Create weekly folders from today until the oldest date. 
     * Mutates `questionsArray` to have the structure below:  
     *   [<folder-1>, ..., <folder-n>] 
     *   where <folder-i> := { id, isFolder, children }
     * 
     * @param currentDate ISO string
     * @param oldestDate ISO string
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getDate
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/setDate
     */
    createWeeklyFolders (startDateISO, endDateISO) {
      console.log("createWeeklyFolders()");
      console.log("startDateISO =", startDateISO);
      console.log("endDateISO =", endDateISO);

      const currentDate = new Date(startDateISO); 
      const endDate = new Date(endDateISO);
      let currentFolder = initializeNewFolder(); 
      
      function initializeNewFolder () {
        return {
          id: 0, // is `id` necessary?
          isFolder: true,
          children: [],
          startDate: Date.now()
        };
      }

      while (currentDate.getDay() < endDate.getDay()) {
        console.log("in while loop, currentDate =", currentDate);

        // increment `currentDate` by creating a fresh object (to avoid silent mutations)
        currentDate = new Date().setDate(currentDate.getDate() + 1);
        
        // create a folder for every 7 days
        if (currentFolder.startDate.getDay() - currentDate.getDay() === 7) {
          currentFolder.endDate = currentDate; 
          this.questionsArray.push(currentFolder)
          currentFolder = initializeNewFolder();
        }
      }
      console.log("exited the while loop");
      // create a folder for last remainder days (i.e. not a full week)
      if (currentDate > currentFolder.startDate) {
        currentFolder.endDate = currentDate;
        this.questionsArray.push(currentFolder); 
      }
    },
    /**
     * Continuously listen to all questions created within `fromDate` and `toDate`.
     * 
     * @param id id of the folder 
     * @param fromDate ISO string
     * @param toDate ISO string
     * @throws InvalidDateRange error if fromDate and toDate are undefined
     */
    fetchQuestions (folder) {
      const query = this.questionsRef
        .where("date", ">=", folder.startDate.toISOString())
        .where("date", "<=", folder.endDate.toISOString()); 
      this.$_listenToCollection(query, folder, "children");
    }
  }
}
</script>