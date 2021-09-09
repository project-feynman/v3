<template>
  <!-- return object means payload from @change will be the object
  even though the display name is just object.name -->
  <v-autocomplete
    label="Search class to join"
    :items="itemsWithMemberCount"
    item-text="nameWithMemberCount"
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
  computed: {
    itemsWithMemberCount () {
      const sortedItems = this.items.sort((i1, i2) => i2.numOfMembers - i1.numOfMembers)
      const out = []
      for (const item of sortedItems) {
        out.push({ ...item, nameWithMemberCount: `${item.name} (${item.numOfMembers || 0} members)`})
      }
      return out
    }
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