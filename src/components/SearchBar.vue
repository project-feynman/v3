<template>
  <div>
    <v-autocomplete
      :label="label"
      :items="items"
      placeholder="Start Typing to Search"
      v-model="searchText"
      @change="submit"
      ></v-autocomplete>
  </div>
</template>


<script>

export default {
  name: 'SearchBar',
  data() {
        return {
            searchText: null,
        }
  },
  props: ['label', 'items'],
  methods: {
    submit() {
        //this.$emit('submit', this.searchText)
        this.searchText = null
    },
  }
}
</script>