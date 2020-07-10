<template>
  <!-- Commented out z-index so dropdown menus will show, but now tabs are submerged-->
  <v-sheet class="pa-4 secondary lighten-3">
      <v-autocomplete
        v-model="selectedItem"
        :search-input.sync="search"
        :items="searchResults"
        label="Search existing posts..."
        dark
        flat
        solo-inverted
        :item-text="text"
        :loading="loading"
        no-data-text="No Posts Match your Search"
        return-object
        >
            <template v-slot:item="{ parent, item }"> 
                <v-card :to="`/class/${item.mitClass.id}/${item.postType}/${item.objectID}`" tile style="width: 100%">
                    <v-card-title v-html="parent.genFilteredText(item.title)"/>
                    <v-card-subtitle >
                        <div v-text="item.creator.firstName +' '+ item.creator.lastName"/>
                        <div v-text="item.date"/>
                    </v-card-subtitle>
                    <v-card-text v-html="parent.genFilteredText(item.html)"/>
                </v-card>
            </template>

            <template v-slot:selection="{ item }">
                <div v-text="item.title">
                </div>
            </template>
      </v-autocomplete>
    </v-sheet>
</template>

<script>
import { mapState } from "vuex";
import algoliasearch from "algoliasearch";
import { algoliaCreds } from "@/algoliaCreds.js";
import { displayDate } from "@/helpers.js";

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
        selectedItem: { creator: {}},
        displayDate: displayDate,
        loading: false
    }
  },
  computed: { 
    ...mapState([
      "user",
      "mitClass"
    ]),
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
              this.loading = true;
              this.searchIndex.search(val).then( ({ hits }) => {
                  let filteredHits = hits.filter(post => post.postType === this.postTypeTrans)
                  if (filteredHits.length !== this.searchResults.length) { // only update when the search result changes. idk if this is necessary but it should be more efficient
                    this.searchResults = filteredHits.map( post => { 
                        // for display purposes
                        post.date = displayDate(post.date);
                        post.html = this.stripHtml(post.html);
                        return post
                    })
                  }
                  this.loading = false;
              })
          }
      }
  },
  methods: {
      stripHtml (html) {
            var tmp = document.createElement("DIV");
            tmp.innerHTML = html;
            return tmp.textContent || tmp.innerText || "";
        },
      //janky filter type thing so autocomplete displays all results from algolia
      text: item => item.title +" "+ item.html +" "+ item.creator.firstName +" "+ item.creator.lastName +" "+ item.creator.email 
  }
};
</script>