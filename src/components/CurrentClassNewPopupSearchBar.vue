<template>
  <!-- return object means payload from @change will be the object
  even though the display name is just object.name -->
  <v-autocomplete
    label="Search class to join"
    :items="items"
    item-text="name"
    @change="(newClass) => handleChange(newClass)"
    return-object 
    prepend-inner-icon="mdi-magnify"
    placeholder="e.g. 8.01, ESG"
    color="accent" 
    clearable 
    ref="VAutocomplete"
    hide-details
  />
</template>

<script>
export default {
  props: { 
    label: String, 
    items: Array 
  },
  data () {
    return { 
      searchInput: ""
    };
  },
  methods: {
    handleChange (newClass) {
      const { VAutocomplete } = this.$refs;
      this.$emit("submit", newClass);
      VAutocomplete.reset();
      VAutocomplete.blur();
    }
  }
};
</script>