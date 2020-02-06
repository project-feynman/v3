<template>
  <div>
    <v-autocomplete
      :label="label"
      :items="items"
      v-model="searchBarValue"
      @change="payload => submit(payload)"
      return-object
      item-text="name"
      placeholder="Start Typing to Search"
      color="accent lighten-1"
      outlined
      elevate="2"
    />
  </div>
</template>

<script>
export default {
  name: "BaseSearchBar",
  props: {
    label: String,
    items: Array
  },
  data () {
    return {
      searchBarValue: ""
    }
  },
  methods: {
    submit (payload) {
      this.$emit("submit", payload);
      this.searchBarValue = "";
    }
  }
};
</script>