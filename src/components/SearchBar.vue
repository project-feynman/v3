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