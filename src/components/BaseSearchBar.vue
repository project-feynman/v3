<template>
  <!-- return object means payload from @change will be the object
  even though the display name is just object.name -->
  <v-autocomplete
    ref="VAutocomplete"
    :items="items"
    item-text="name"
    @change="newClass => handleChange(newClass)"
    return-object
    :label="label"
    placeholder="Enter a class number"
    color="accent lighten-1" outlined clearable elevate="2"
  />
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
      searchInput: "",
    }
  },
  methods: {
    handleChange (newClass) {
      const { VAutocomplete } = this.$refs;
      this.$emit("submit", newClass);
      VAutocomplete.reset();
    }
  }
};
</script>