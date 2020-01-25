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
  name: 'SearchBar',
  data () {
    return {
      searchText: "",
    }
  },
  props: ["label", "items"],
  methods: {
    submit () {
      let text = this.searchText
      // this.$nextTick(() => {
      //   this.searchText = ""
      // })
      this.$emit("submit", text)
      this.searchText = ""
    },
  }
}
</script>