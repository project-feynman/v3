<template>
  <!-- return object means payload from @change will be the object
  even though the display name is just object.name -->
  <v-autocomplete
    :items="items"
    item-text="name"
    @change="(newClass) => handleChange(newClass)"
    return-object 
    prepend-inner-icon="mdi-magnify"
    placeholder="Search for a class to join e.g. 18.065"
    color="accent" 
    outlined 
    clearable 
    elevate="2"
    ref="VAutocomplete"
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