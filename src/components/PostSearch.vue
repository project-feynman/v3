<template>
  <!-- Commented out z-index so dropdown menus will show, but now tabs are submerged-->
  <v-sheet class="pa-4 secondary lighten-3">
      <!-- <v-text-field
        v-model="search"
        label="Search existing posts..."
        dark
        flat
        solo-inverted
        hide-details
        clearable
        clear-icon="mdi-close-circle-outline"
      ></v-text-field> -->

      <v-autocomplete
        v-model="selectedItem"
        :search-input.sync="search"
        :items="searchResults"
        label="Search existing posts..."
        dark
        flat
        solo-inverted
        :item-text="text"
        return-object
        >
            <template v-slot:item="{ parent, item }"> 
                <!-- <template v-if="item.mitClass"> -->
                <v-card :to="`/class/${item.mitClass.id}/${item.postType}/${item.objectID}`" tile style="width: 100%">
                    <v-card-title v-html="parent.genFilteredText(item.title)"/>
                    <v-card-subtitle v-text="item.date"/>
                    <v-card-text v-html="parent.genFilteredText(stripHtml(item.html))"/>
                </v-card>
                <!-- </template> -->
            </template>

            <template v-slot:selection="{ item }">
                    <div v-text="item.title">
                    </div>
            </template>
      </v-autocomplete>
    </v-sheet>
</template>

<script>
import { tutorial } from "@/CONSTANTS.js";
import { mapState } from "vuex";
import firebase from "firebase/app";
import "firebase/firestore";
import algoliasearch from "algoliasearch";
import { algoliaCreds } from "@/algoliaCreds.js"

export default {
  props: {
    postType: String
  },
  components: {
  },
  data () {
    return {
        algoliaClient: algoliasearch(algoliaCreds.APP_SID, algoliaCreds.ADMIN_API_KEY),
        searchInput: "",
        search: null,
        searchResults: [],
        selectedItem: { creator: {}}
    }
  },
  computed: { 
    ...mapState([
      "user",
      "mitClass"
    ]),
    classId () { 
      return this.$route.params.class_id; 
    },
    roomId () {
      return this.$route.params.room_id;
    },
    searchIndex () {
        return this.algoliaClient.initIndex(this.mitClass.id)
    },
    postTypeTrans () {
        return this.postType === 'question' ? 'questions' : 'posts' 
    }
  },
  watch: {
      search (val) {
          if (val && val.length > 2){
              this.searchIndex.search(val).then( ({ hits }) => {
                  this.searchResults = hits.filter(post => post.postType === this.postTypeTrans)
              })
          }
      },
      selectedItem () {

      }
  },
  methods: {
      stripHtml(html) {
            var tmp = document.createElement("DIV");
            tmp.innerHTML = html;
            return tmp.textContent || tmp.innerText || "";
        },
      //janky filter type thing so autocomplete displays all results from algolia
      text: item => item.title +" "+ item.html +" "+ item.creator.firstName +" "+ item.creator.lastName +" "+ item.creator.email 
  }
};
</script>