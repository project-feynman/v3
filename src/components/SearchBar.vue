<template>
  <v-autocomplete
    :label="label"
    :items="items"
    placeholder="Start Typing to Search"
    @change="submit"
    v-model="searchText"
  />
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