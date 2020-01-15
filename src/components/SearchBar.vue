<template>
  <div>
    <v-autocomplete
      :label="label"
      :items="items"
      placeholder="Start Typing to Search"
      @change="submit"
      v-model="searchText"
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
        let text = this.searchText
        this.$nextTick(() => {
            this.searchText = null
        })
        this.$emit('submit', text)
    },
  }
}
</script>