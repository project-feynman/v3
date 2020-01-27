<template>
  <div>
    <v-autocomplete
      color="accent lighten-1"
      :label="label"
      :items="items"
      placeholder="Start Typing to Search"
      @change="submit"
      v-model="searchText"
      outlined
      elevate="2"
      ></v-autocomplete>
  </div>
</template>

<script>
export default {
  name: "SearchBar",
  data() {
    return {
      searchText: ""
    };
  },
  props: ["label", "items"],
  methods: {
    submit() {
      this.$emit("submit", this.searchText);
      this.searchText = "";
    }
  }
};
</script>